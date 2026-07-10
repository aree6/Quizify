import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, X, LogIn, Clock, Home } from 'lucide-react';
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
  const [quizTimeRemaining, setQuizTimeRemaining] = useState(0);
  const [alreadyAttempted, setAlreadyAttempted] = useState(false);
  const [existingAttemptId, setExistingAttemptId] = useState<string | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const submittedRef = useRef(false);

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
        setQuizTimeRemaining(response.course.questions.length * 120);
        try {
          const attemptsData = await apiService.getStudentAttempts();
          const existing = attemptsData.attempts.find((a) => a.shareToken === token);
          if (existing) {
            setAlreadyAttempted(true);
            setExistingAttemptId(existing.id);
          }
        } catch {
          // Attempts check is best-effort; if it fails, let the user proceed
        }
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
  const totalQuizTime = totalQuestions * 120;

  const titleParts = course ? parseTitleParts(course.title) : { courseName: '', entries: [] };

  const goToQuestion = (idx: number) => {
    if (idx >= 0 && idx < totalQuestions) {
      setCurrentQuestionIndex(idx);
    }
  };

  const submitQuiz = useCallback(async () => {
    if (!course || submittedRef.current) return;
    submittedRef.current = true;
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    try {
      setSubmitting(true);
      setError('');
      // Submit whatever answers exist; unanswered count as wrong server-side
      const response = await apiService.submitQuiz(token, {
        answers: course.questions.map((q) => ({
          questionId: q.id,
          selectedOptionIndex: answers[q.id] ?? -1,
        })),
      });
      setResult(response);
      setView('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [course, token, answers]);

  useEffect(() => {
    if (view !== 'quiz' || result || quizTimeRemaining <= 0) return;

    timerIntervalRef.current = setInterval(() => {
      setQuizTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          timerIntervalRef.current = null;
          setTimeout(() => submitQuiz(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [view, result, quizTimeRemaining <= 0, submitQuiz]);

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

  const handleManualSubmit = async () => {
    if (!course) return;
    if (answeredCount < totalQuestions) {
      setError('Answer all questions before submitting.');
      return;
    }
    submitQuiz();
  };

  const handleSignIn = () => {
    setReturnUrl(window.location.pathname + window.location.search);
    navigate('/login');
  };

  useEffect(() => {
    const card = document.querySelector('.quiz-card') as HTMLElement | null;
    if (!card || view !== 'quiz' || result) return;

    const blockEvent = (e: Event) => {
      e.preventDefault();
      if (e.type === 'copy' || e.type === 'cut') {
        try {
          const hasToast = document.querySelector('.toast-copy-warning');
          if (!hasToast) {
            const toast = document.createElement('div');
            toast.className = 'toast-copy-warning fixed bottom-4 left-1/2 -translate-x-1/2 bg-near-black text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50';
            toast.textContent = 'Copying is disabled during the quiz.';
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
          }
        } catch {}
      }
    };

    const events = ['copy', 'cut', 'paste', 'contextmenu', 'selectstart', 'dragstart'] as const;
    for (const evt of events) {
      card.addEventListener(evt, blockEvent);
    }
    return () => {
      for (const evt of events) {
        card.removeEventListener(evt, blockEvent);
      }
    };
  }, [view, result, currentQuestionIndex]);

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
      <div className="min-h-screen p-6 text-body-gray">Course unavailable.</div>
    );
  }

  const optionLabels = ['A', 'B', 'C', 'D'];
  const quizLocked = !isAuthenticated;

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back to Dashboard link */}
        {isAuthenticated && (
          <div className="mb-4">
            <Link
              to={user?.role === 'Student' ? '/student/dashboard' : '/dashboard'}
              className="inline-flex items-center gap-1.5 text-xs text-body-gray hover:text-near-black transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Back to Dashboard
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-near-black mb-2">
            {titleParts.courseName}
          </h1>
          {titleParts.entries.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-4">
              {titleParts.entries.map((t) => (
                <span key={t} className="px-2.5 py-0.5 text-[11px] rounded-full bg-chip-gray text-body-gray font-medium">
                  {t}
                </span>
              ))}
            </div>
          )}
          <div className="flex justify-center">
            <SegmentControl options={QUIZ_VIEW_OPTIONS} value={view} onChange={setView} />
          </div>
        </div>

        {/* Course View */}
        {view === 'course' && (
          <div className="surface-card sm:p-8">
            <CollapsibleLesson
              markdown={course.lessonContent}
              sources={course.sources}
              className="text-sm text-body-gray leading-relaxed"
            />
          </div>
        )}

        {/* Quiz View - locked */}
        {view === 'quiz' && quizLocked && !result && (
          <div className="surface-card sm:p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-light-mint flex items-center justify-center mb-3">
              <LogIn className="w-6 h-6 text-positive" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-near-black mb-2">Sign in to take this quiz</h2>
            <p className="text-sm text-body-gray mb-1">
              Quiz attempts are recorded against your account so you can review your history in the Student Dashboard.
            </p>
            <p className="text-xs text-muted-gray mb-5">The course lesson above is still viewable without signing in.</p>
            <button type="button" onClick={handleSignIn} className="pill-primary inline-flex items-center gap-2">
              <LogIn className="w-4 h-4" /> Sign in with Google
            </button>
            {user && (
              <p className="text-xs text-muted-gray mt-3">
                Signed in as {user.email} ({user.role}) — but the quiz attempt could not be linked. Try signing out and back in.
              </p>
            )}
          </div>
        )}

        {/* Quiz View - already attempted */}
        {view === 'quiz' && alreadyAttempted && isAuthenticated && !result && (
          <div className="surface-card sm:p-8 text-center">
            <h2 className="text-base sm:text-lg font-bold text-near-black mb-2">
              You have already taken this quiz
            </h2>
            <p className="text-sm text-body-gray mb-4">
              Each course allows only one attempt per student. View your breakdown to see your results and practice weak topics.
            </p>
            {existingAttemptId && (
              <Link
                to={`/student/attempts/${existingAttemptId}`}
                className="pill-primary inline-flex items-center gap-2"
              >
                View breakdown
              </Link>
            )}
          </div>
        )}

        {/* Quiz View - taking */}
        {view === 'quiz' && !result && !alreadyAttempted && isAuthenticated && (
          <div className="space-y-4">
            {currentQuestion && (
              <div className="surface-card sm:p-6 quiz-card select-none">
                {/* Progress bar */}
                <div className="mb-3">
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

                {/* Timer bar */}
                <div className="mb-4">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-body-gray" />
                    <span className={`text-xs font-semibold ${quizTimeRemaining <= 30 ? 'text-danger animate-pulse' : 'text-body-gray'}`}>
                      {Math.floor(quizTimeRemaining / 60)}:{String(quizTimeRemaining % 60).padStart(2, '0')} remaining
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full bg-chip-gray overflow-hidden">
                    <div
                      className={`h-full transition-[width] duration-1000 rounded-full ${quizTimeRemaining <= 30 ? 'bg-danger' : 'bg-near-black'}`}
                      style={{ width: `${(quizTimeRemaining / totalQuizTime) * 100}%` }}
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
                          selected ? 'border-lime bg-light-mint' : 'border-hover-gray bg-white hover:border-lime'
                        }`}
                      >
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                            selected ? 'bg-lime text-dark-green' : 'bg-chip-gray text-body-gray'
                          }`}
                        >
                          {optionLabels[oi]}
                        </span>
                        <span className="text-sm text-near-black">{option}</span>
                        {selected && <Check className="w-4 h-4 text-positive ml-auto flex-shrink-0" />}
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
                onClick={handleManualSubmit}
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
              <p className="text-sm text-body-gray">{result.percentage}% score</p>
              {user && (
                <p className="text-xs text-muted-gray mt-2">Attempt saved against {user.email}</p>
              )}
              {result.attemptId && (
                <Link
                  to={`/student/attempts/${result.attemptId}`}
                  className="pill-secondary inline-flex items-center gap-1.5 mt-3 text-sm"
                >
                  <Clock className="w-4 h-4" /> View breakdown & practice weak topics
                </Link>
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
