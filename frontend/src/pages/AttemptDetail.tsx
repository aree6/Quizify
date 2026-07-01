import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { PageError, PageLoading } from '../components/common/PageState';
import { StudentDiagnostic } from '../components/common/StudentDiagnostic';
import { barColor } from '../components/common/analyticsTokens';
import { timeAgo } from '../utils/helpers';
import type { StudentAnalyticsData } from '../types';

type AttemptDetail = StudentAnalyticsData & { courseId: string; courseTitle: string };

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
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attempt');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [attemptId]);

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
            <div className="flex items-center gap-2">
              {/* <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: data.passed ? 'rgba(5,77,40,0.12)' : 'rgba(208,50,56,0.10)' }}
              >
                {data.passed ? (
                  <CheckCircle2 className="w-5 h-5" style={{ color: barColor(data.percentage) }} />
                ) : (
                  <XCircle className="w-5 h-5" style={{ color: barColor(data.percentage) }} />
                )}
              </div> */}
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
        <StudentDiagnostic student={data} />
      </div>

      <div className="text-center">
        <Link to="/student/dashboard" className="pill-secondary inline-flex items-center gap-1 text-sm">
          <ArrowLeft className="w-4 h-4" />
          Back to all attempts
        </Link>
      </div>
    </div>
  );
}
