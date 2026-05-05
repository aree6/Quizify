import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { LessonWithCitations } from '../components/common/LessonWithCitations';
import { PageError } from '../components/common/PageState';
import type { PublicCourse, QuizSubmissionResult } from '../types';

export function QuizPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [course, setCourse] = useState<PublicCourse | null>(null);
  const [studentName, setStudentName] = useState('');
  const [answers, setAnswers] = useState<Record<string, number>>({});
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
  const completion = course ? Math.round((answeredCount / course.questions.length) * 100) : 0;

  const submitQuiz = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!course) return;

    if (studentName.trim().length < 2) {
      setError('Student name is required.');
      return;
    }

    if (answeredCount < course.questions.length) {
      setError('Answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await apiService.submitQuiz(token, {
        studentName,
        answers: course.questions.map((q) => ({ questionId: q.id, selectedOptionIndex: answers[q.id] })),
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading quiz...</div>;
  }

  if (error && !course) {
    return <div className="min-h-screen bg-white p-6"><PageError error={error} /></div>;
  }

  if (!course) {
    return <div className="min-h-screen bg-white p-6 text-body-gray">Course unavailable.</div>;
  }

  return (
    <div className="min-h-screen bg-white py-6 sm:py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="surface-card p-6 sm:p-8 mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold text-near-black">{course.title}</h1>
          <LessonWithCitations
            markdown={course.lessonContent}
            sources={course.sources}
            className="markdown-content text-sm text-body-gray mt-3 leading-relaxed"
          />

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="chip">Pass mark: {course.passPercentage}%</span>
            <span className="chip">Questions: {course.questions.length}</span>
            <span className="chip-active">Progress: {completion}%</span>
          </div>
        </div>

        {result ? (
          <div className="surface-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-near-black mb-3">Result</h2>
            <p className="text-sm text-body-gray">
              Score: <span className="font-bold text-near-black">{result.score}/{result.total}</span> ({result.percentage}%)
            </p>
            <p className={`text-sm mt-2 font-semibold ${result.passed ? 'text-positive' : 'text-danger'}`}>
              {result.passed ? 'Passed' : 'Not passed'} (required {result.passPercentage}%)
            </p>

            <div className="mt-6 space-y-5">
              {course.questions.map((question, index) => {
                const answer = result.answers.find((item) => item.questionId === question.id);
                const selectedIdx = answer?.selectedOptionIndex ?? -1;
                const correctIdx = answer?.correctOptionIndex ?? -1;
                return (
                  <div key={question.id} className="ring-card p-4">
                    <p className="text-sm font-semibold text-near-black mb-2">
                      {index + 1}. {question.prompt}
                    </p>
                    {/* Metadata chips */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
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
                    {/* Options with explanations */}
                    <div className="space-y-2">
                      {question.options.map((opt, oi) => {
                        const isSelected = oi === selectedIdx;
                        const isCorrect = oi === correctIdx;
                        return (
                          <div
                            key={oi}
                            className={`text-sm px-3 py-2 rounded-md border ${
                              isCorrect
                                ? 'bg-light-mint border-lime text-positive'
                                : isSelected
                                  ? 'bg-error-surface border-danger text-danger'
                                  : 'bg-chip-gray/60 border-hover-gray text-body-gray'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{['A', 'B', 'C', 'D'][oi]}.</span>
                              <span className="flex-1">{opt}</span>
                              {isCorrect && <span className="text-xs font-bold">Correct</span>}
                              {isSelected && !isCorrect && <span className="text-xs font-bold">Your answer</span>}
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
        ) : (
          <form onSubmit={submitQuiz} className="space-y-4">
            <div className="surface-card p-6">
              <label className="block text-sm font-semibold text-near-black mb-2">Student name</label>
              <input className="field" value={studentName} onChange={(event) => setStudentName(event.target.value)} required placeholder="Enter full name" />
            </div>

            {course.questions.map((question, index) => (
              <div key={question.id} className="surface-card p-6">
                <p className="text-sm font-semibold text-near-black mb-3">
                  {index + 1}. {question.prompt}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={`${question.id}-${optionIndex}`}
                       className={`flex items-center gap-3 p-3 rounded-lg border ${
                         answers[question.id] === optionIndex
                           ? 'border-lime bg-light-mint'
                           : 'border-muted-gray bg-white'
                       }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        checked={answers[question.id] === optionIndex}
                        onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: optionIndex }))}
                      />
                      <span className="text-sm text-near-black">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {error && <PageError error={error} />}

            <button type="submit" disabled={submitting} className="pill-primary">
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
