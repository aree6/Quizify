import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, X, LogIn } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { setReturnUrl } from '../services/auth';
import { CollapsibleLesson } from '../components/common/CollapsibleLesson';
import { SegmentControl } from '../components/common/SegmentControl';
import type { SegmentOption } from '../components/common/SegmentControl';
import { PageError } from '../components/common/PageState';
import type { PublicCourse, QuizSubmissionResult } from '../types';

type QuizView = 'course' | 'quiz';

const QUIZ_VIEW_OPTIONS: SegmentOption<QuizView>[] = [
  { value: 'course', label: 'Course' },
  { value: 'quiz', label: 'Quiz' },
];

function parseTitleParts(fullTitle: string): { courseName: string; entries: string[] } {
  const idx = fullTitle.indexOf(' — ');
  if (idx === -1) return { courseName: fullTitle, entries: [] };
  const courseName = fullTitle.slice(0, idx).trim();
  const entries = fullTitle
    .slice(idx + 3)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return { courseName, entries };
}

export function QuizPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [view, setView] = useState<QuizView>('course');
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Missing quiz token in URL.');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const response = await apiService.getPublicCourse(token);
        setCourse(response.course);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const totalQuestions = course?.questions.length ?? 0;
  const completion = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
  const currentQuestion = course?.questions[currentQuestionIndex] ?? null;

  const titleParts = course ? parseTitleParts(course.title) : { courseName: '', entries: [] };

  const answerCurrent = (optionIndex: number) => {
    if (!currentQuestion || result) return;
    setAnswers((prev) => {
      const current = prev[currentQuestion.id];
      if (current === optionIndex) {
        const next = { ...prev };
        delete next[currentQuestion.id];
        return next;
      }
      return { ...prev, [currentQuestion.id]: optionIndex };
    });
  };

  const goToQuestion = (idx: number) => {
    if (idx >= 0 && idx < totalQuestions) {
      setCurrentQuestionIndex(idx);
    }
  };

  const submitQuiz = async () => {
    if (!course) return;

    if (answeredCount < totalQuestions) {
      setError('Answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      // Identity (student name + email) is derived from the auth token server-side.
      const response = await apiService.submitQuiz(token, {
        answers: course.questions.map((q) => ({
          questionId: q.id,
          selectedOptionIndex: answers[q.id],
        })),
      });
      setResult(response);
      setView('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = () => {
    // Remember the quiz link so the user is returned here after OAuth.
    setReturnUrl(window.location.pathname + window.location.search);
    navigate('/login');
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-body-gray">Loading quiz...</p>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-3xl mx-auto"><PageError error={error} /></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen p-6 text-body-gray">
        Course unavailable.
      </div>
    );
  }

  const optionLabels = ['A', 'B', 'C', 'D'];
  const quizLocked = !isAuthenticated;

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-near-black mb-2">
            {titleParts.courseName}
          </h1>
          {titleParts.entries.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              {titleParts.entries.map((t) => (
                <span
                  key={t}
                  className="px-2.5 py-0.5 text-[11px] rounded-full bg-chip-gray text-body-gray font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-center">
            <SegmentControl options={QUIZ_VIEW_OPTIONS} value={view} onChange={setView} />
          </div>
        </div>

        {/* Course View (always public) */}
        {view === 'course' && (
          <div className="surface-card  sm:p-8">
            <CollapsibleLesson
              markdown={course.lessonContent}
              sources={course.sources}
              className="text-sm text-body-gray leading-relaxed"
            />
          </div>
        )}

        {/* Quiz View - locked for anonymous visitors */}
        {view === 'quiz' && quizLocked && !result && (
          <div className="surface-card sm:p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-light-mint flex items-center justify-center mb-3">
              <LogIn className="w-6 h-6 text-positive" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-near-black mb-2">
              Sign in to take this quiz
            </h2>
            <p className="text-sm text-body-gray mb-1">
              Quiz attempts are recorded against your account so you can review
              your history in the Student Dashboard.
            </p>
            <p className="text-xs text-muted-gray mb-5">
              The course lesson above is still viewable without signing in.
            </p>
            <button
              type="button"
              onClick={handleSignIn}
              className="pill-primary inline-flex items-center gap-2"
            >
              <LogIn className="w-4 h-4" /> Sign in with Google
            </button>
            {user && (
              <p className="text-xs text-muted-gray mt-3">
                Signed in as {user.email} ({user.role}) — but the quiz attempt
                could not be linked. Try signing out and back in.
              </p>
            )}
          </div>
        )}

        {/* Quiz View - taking (authenticated) */}
        {view === 'quiz' && !result && isAuthenticated && (
          <div className="space-y-4">
            {/* Question card */}
            {currentQuestion && (
              <div className="surface-card sm:p-6">
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-body-gray">
                      Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <span className="text-xs text-body-gray">{completion}% complete</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-chip-gray overflow-hidden">
                    <div
                      className="h-full bg-lime transition-[width] duration-200"
                      style={{ width: `${completion}%` }}
                    />
                  </div>
                </div>

                {/* Question prompt */}
                <p className="text-sm font-semibold text-near-black mb-4">
                  {currentQuestionIndex + 1}. {currentQuestion.prompt}
                </p>

                {/* Options */}
                <div className="space-y-2">
                  {currentQuestion.options.map((option, oi) => {
                    const selected = answers[currentQuestion.id] === oi;
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() => answerCurrent(oi)}
                        className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                          selected
                            ? 'border-lime bg-light-mint'
                            : 'border-hover-gray bg-white hover:border-lime'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            selected
                              ? 'bg-lime text-dark-green'
                              : 'bg-chip-gray text-body-gray'
                          }`}
                        >
                          {optionLabels[oi]}
                        </span>
                        <span className="text-sm text-near-black">{option}</span>
                        {selected && (
                          <Check className="w-4 h-4 text-positive ml-auto flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
                className="pill-secondary flex items-center gap-1.5 disabled:opacity-40 min-w-[100px] justify-center"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="flex items-center gap-1 flex-wrap justify-center">
                {course.questions.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => goToQuestion(idx)}
                    title={`Question ${idx + 1}`}
                    className={`w-7 h-7 rounded-full text-[11px] font-semibold flex items-center justify-center cursor-pointer transition-colors ${
                      idx === currentQuestionIndex
                        ? 'bg-near-black text-white'
                        : answers[course.questions[idx].id] !== undefined
                          ? 'bg-lime text-dark-green'
                          : 'bg-chip-gray text-body-gray hover:bg-hover-gray'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => goToQuestion(currentQuestionIndex + 1)}
                disabled={currentQuestionIndex >= totalQuestions - 1}
                className="pill-secondary flex items-center gap-1.5 disabled:opacity-40 min-w-[100px] justify-center"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Submit */}
            <div className="flex justify-center pt-2">
              <button
                type="button"
                onClick={submitQuiz}
                disabled={submitting || answeredCount < totalQuestions}
                className="pill-primary"
              >
                {submitting ? 'Submitting...' : `Submit Quiz (${answeredCount}/${totalQuestions})`}
              </button>
            </div>

            {error && <PageError error={error} />}
          </div>
        )}

        {/* Quiz Results */}
        {view === 'quiz' && result && (
          <div className="space-y-5">
            {/* Score card */}
            <div className="surface-card sm:p-8 text-center">
              <p className={`text-lg font-bold mb-2 ${result.passed ? 'text-positive' : 'text-danger'}`}>
                {result.passed ? 'Passed' : 'Not Passed'}
              </p>
              <p className="text-2xl sm:text-3xl font-extrabold text-near-black mb-1">
                {result.score}/{result.total}
              </p>
              <p className="text-sm text-body-gray">
                {result.percentage}% score
              </p>
              {user && (
                <p className="text-xs text-muted-gray mt-2">
                  Attempt saved against {user.email}
                </p>
              )}
            </div>

            {/* Per-question review */}
            <div className="space-y-4">
              {course.questions.map((question, index) => {
                const answer = result.answers.find((a) => a.questionId === question.id);
                const selectedIdx = answer?.selectedOptionIndex ?? -1;
                const correctIdx = answer?.correctOptionIndex ?? -1;
                const isCorrect = answer?.isCorrect ?? false;

                return (
                  <div key={question.id} className="surface-card p-4 sm:p-5">
                    <div className="flex items-start gap-2 mb-3">
                      {isCorrect ? (
                        <Check className="w-5 h-5 text-positive flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
                      )}
                      <p className="text-sm font-semibold text-near-black">
                        {index + 1}. {question.prompt}
                      </p>
                    </div>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3 ml-7">
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-chip-gray text-body-gray font-medium uppercase tracking-wide">
                        {question.metadata.bloomLevel}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-chip-gray text-body-gray font-medium uppercase tracking-wide">
                        {question.metadata.soloLevel.replace('_', '-')}
                      </span>
                      {question.metadata.topic && (
                        <span className="px-2 py-0.5 text-[10px] rounded-full bg-light-mint text-positive font-medium">
                          {question.metadata.topic}
                        </span>
                      )}
                    </div>

                    {/* Options with highlights */}
                    <div className="space-y-2 ml-7">
                      {question.options.map((opt, oi) => {
                        const isSelected = oi === selectedIdx;
                        const isCorrectOpt = oi === correctIdx;
                        return (
                          <div
                            key={oi}
                            className={`text-sm px-3 py-2 rounded-md border ${
                              isCorrectOpt
                                ? 'bg-light-mint border-lime text-positive'
                                : isSelected
                                  ? 'bg-error-surface border-danger text-danger'
                                  : 'bg-chip-gray/60 border-hover-gray text-body-gray'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{optionLabels[oi]}.</span>
                              <span className="flex-1">{opt}</span>
                              {isCorrectOpt && <span className="text-xs font-bold">Correct</span>}
                              {isSelected && !isCorrectOpt && (
                                <span className="text-xs font-bold">Your answer</span>
                              )}
                            </div>
                            {question.explanations[oi] && (
                              <p className="text-xs mt-1 opacity-90">{question.explanations[oi]}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
