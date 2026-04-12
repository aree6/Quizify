import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { PublicCourse, QuizSubmissionResult } from '../types';
import { apiService } from '../services/api';

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
      setError('Missing quiz token in URL.');
      setLoading(false);
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

  const onSelectAnswer = (questionId: string, selectedIndex: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: selectedIndex }));
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!course) return;

    if (studentName.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }

    if (answeredCount < course.questions.length) {
      setError('Please answer all questions before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const response = await apiService.submitQuiz(token, {
        studentName,
        answers: course.questions.map((question) => ({
          questionId: question.id,
          selectedOptionIndex: answers[question.id],
        })),
      });

      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-slate-50 p-6 text-slate-600">Loading quiz...</div>;
  }

  if (error && !course) {
    return <div className="min-h-screen bg-slate-50 p-6 text-red-700">{error}</div>;
  }

  if (!course) {
    return <div className="min-h-screen bg-slate-50 p-6 text-slate-600">Course unavailable.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{course.title}</h1>
          <p className="text-slate-600 mt-2">{course.lessonContent}</p>
          <p className="text-sm text-slate-500 mt-4">
            Pass mark: {course.passPercentage}% | {course.questions.length} questions
          </p>
        </div>

        {result ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Result</h2>
            <p className="text-slate-700">
              Score: <span className="font-semibold">{result.score}/{result.total}</span> ({result.percentage}%)
            </p>
            <p className={`mt-2 font-medium ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
              {result.passed ? 'Passed' : 'Not passed'} (required {result.passPercentage}%)
            </p>

            <div className="mt-6 space-y-4">
              {course.questions.map((question, index) => {
                const answer = result.answers.find((item) => item.questionId === question.id);
                return (
                  <div key={question.id} className="p-4 rounded-xl border border-slate-200">
                    <p className="font-medium text-slate-900 mb-2">
                      {index + 1}. {question.prompt}
                    </p>
                    <p className="text-sm text-slate-600">Your answer: {question.options[answer?.selectedOptionIndex ?? -1] || 'N/A'}</p>
                    <p className="text-sm text-slate-600">Correct answer: {question.options[answer?.correctOptionIndex ?? -1] || 'N/A'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <label className="block text-sm font-medium text-slate-700 mb-2">Student name</label>
              <input
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Enter your full name"
                required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {course.questions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <p className="font-medium text-slate-900 mb-4">
                  {index + 1}. {question.prompt}
                </p>
                <div className="space-y-2">
                  {question.options.map((option, optionIndex) => (
                    <label
                      key={option}
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 ${
                        answers[question.id] === optionIndex
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={optionIndex}
                        checked={answers[question.id] === optionIndex}
                        onChange={() => onSelectAnswer(question.id, optionIndex)}
                      />
                      <span className="text-slate-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl font-medium bg-blue-600 text-white disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
