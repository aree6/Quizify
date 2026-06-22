import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ClipboardList, XCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { PageError, PageLoading } from '../components/common/PageState';
import { StudentDiagnostic } from '../components/common/StudentDiagnostic';
import { barColor } from '../components/common/analyticsTokens';
import type { StudentAnalyticsData } from '../types';

type AttemptDetail = StudentAnalyticsData & { courseId: string; courseTitle: string };

function formatSubmittedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
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

  return (
    <div className="space-y-6">
      <div>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-xs text-body-gray hover:text-near-black mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to dashboard
        </button>
        <h1 className="section-title">{data.courseTitle}</h1>
        <p className="text-sm text-body-gray mt-1">
          Submitted {formatSubmittedAt(data.submittedAt)}
        </p>
      </div>

      <div className="surface-card p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-chip-gray">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: data.passed ? 'rgba(159,232,112,0.18)' : 'rgba(208,50,56,0.10)' }}
            >
              {data.passed ? (
                <CheckCircle2 className="w-6 h-6" style={{ color: barColor(data.percentage) }} />
              ) : (
                <XCircle className="w-6 h-6" style={{ color: barColor(data.percentage) }} />
              )}
            </div>
            <div>
              <p className="text-xs text-body-gray">Result</p>
              <p className="text-2xl font-bold" style={{ color: barColor(data.percentage) }}>
                {data.score}/{data.total} ({data.percentage}%)
              </p>
            </div>
          </div>
          <span
            className="inline-flex text-sm font-semibold px-3 py-1 rounded-full"
            style={{
              backgroundColor: data.passed ? 'rgba(159,232,112,0.18)' : 'rgba(208,50,56,0.10)',
              color: data.passed ? '#1c1d1a' : '#d03238',
            }}
          >
            {data.passed ? 'Passed' : 'Failed'}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="w-4 h-4 text-body-gray" />
          <h2 className="text-sm font-semibold text-near-black">Performance breakdown</h2>
        </div>

        <StudentDiagnostic student={data} />
      </div>

      <div className="text-center">
        <Link to="/student/dashboard" className="pill-secondary inline-flex items-center gap-1 text-sm">
          Back to all attempts
        </Link>
      </div>
    </div>
  );
}
