import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiService } from '../services/api';
import { PageError, PageLoading } from '../components/common/PageState';
import { StudentDiagnostic } from '../components/common/StudentDiagnostic';
import { barColor } from '../components/common/analyticsTokens';
import { timeAgo } from '../utils/helpers';
import type { StudentAnalyticsData } from '../types';

type PracticeSession = {
  id: string;
  title: string;
  shareToken: string;
  attemptId: string | null;
  percentage: number | null;
  submittedAt: string | null;
  topics: string[];
};

type AttemptDetail = StudentAnalyticsData & {
  courseId: string;
  courseTitle: string;
  shareToken: string;
  practiceSessions: PracticeSession[];
};

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

export function AttemptDetailPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [practicing, setPracticing] = useState(false);
  const [practiceError, setPracticeError] = useState('');

  useEffect(() => {
    if (!attemptId) {
      setError('Missing attempt id');
      setLoading(false);
      return;
    }
    const load = async () => {
      try {
        setLoading(true);
        const result = await apiService.getStudentAttempt(attemptId);
        setData(result as AttemptDetail);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attempt');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

  const handlePractice = async () => {
    if (!data || !attemptId) return;
    try {
      setPracticing(true);
      setPracticeError('');
      const result = await apiService.practiceWeakTopics(data.shareToken, attemptId);
      navigate(`/quiz?token=${encodeURIComponent(result.shareToken)}`);
    } catch (err) {
      setPracticeError(err instanceof Error ? err.message : 'Failed to generate practice');
    } finally {
      setPracticing(false);
    }
  };

  if (loading) return <PageLoading message="Loading your attempt..." />;
  if (error) return <PageError error={error} />;
  if (!data) return null;

  const { courseName, entries } = parseTitleParts(data.courseTitle);

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs text-body-gray hover:text-near-black mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back
        </button>
      </div>

      <div className="surface-card p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
          <div className="min-w-0 flex-1">
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold text-near-black truncate">{courseName}</h1>
              {entries.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {entries.map((entry) => (
                    <span key={entry} className="px-2 py-0.5 text-[11px] rounded-full bg-chip-gray text-body-gray font-medium">
                      {entry}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="text-center">
              <p className="text-xl sm:text-3xl font-extrabold" style={{ color: barColor(data.percentage) }}>
                {data.percentage}%
              </p>
              <span
                className="inline-flex text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5"
                style={{
                  backgroundColor: data.passed ? 'rgba(5,77,40,0.12)' : 'rgba(208,50,56,0.10)',
                  color: data.passed ? '#054d28' : '#d03238',
                }}
              >
                {data.passed ? 'Passed' : 'Not Passed'}
              </span>
            </div>
            <div className="text-center text-xs text-body-gray leading-snug">
              <p>{data.score}/{data.total} correct</p>
              <p className="text-muted-gray mt-0.5">{timeAgo(data.submittedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="surface-card p-4 sm:p-6">
        <StudentDiagnostic student={data} onPractice={handlePractice} />
        {practicing && (
          <p className="text-sm text-body-gray text-center mt-3 animate-pulse">Generating your personalized practice course...</p>
        )}
        {practiceError && <p className="text-sm text-danger text-center mt-2">{practiceError}</p>}
      </div>

      {data.practiceSessions && data.practiceSessions.length > 0 && (
        <div className="surface-card p-4 sm:p-6">
          <h2 className="text-sm font-semibold text-near-black mb-3">Practice Sessions</h2>
          <ul className="space-y-2">
            {data.practiceSessions.map((session) => (
              <li key={session.id} className="p-3 rounded-lg border border-chip-gray">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-near-black truncate">{session.title}</p>
                    {session.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {session.topics.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 text-[10px] rounded-full bg-chip-gray text-body-gray">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {session.percentage !== null && (
                      <span className="text-sm font-bold" style={{ color: barColor(session.percentage) }}>
                        {session.percentage}%
                      </span>
                    )}
                    {session.submittedAt && (
                      <span className="text-xs text-muted-gray">{timeAgo(session.submittedAt)}</span>
                    )}
                    {session.attemptId ? (
                      <Link
                        to={`/student/attempts/${session.attemptId}`}
                        className="pill-secondary text-xs inline-flex items-center gap-1"
                      >
                        View breakdown
                      </Link>
                    ) : (
                      <Link
                        to={`/quiz?token=${encodeURIComponent(session.shareToken)}`}
                        className="pill-primary text-xs inline-flex items-center gap-1"
                      >
                        Take quiz
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center">
        <Link to="/student/dashboard" className="pill-secondary inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to all attempts
        </Link>
      </div>
    </div>
  );
}
