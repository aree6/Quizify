import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import type { CourseAnalytics, CourseSummary } from '../types';
import { apiService } from '../services/api';
import { PageLoading, PageEmpty, PageError } from '../components/common/PageState';
import { Breadcrumbs } from '../components/common/Breadcrumbs';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function AnalyticsPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [courseSearch, setCourseSearch] = useState('');
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCourses(true);
        const response = await apiService.getCourses();
        setCourses(response.courses);
        if (response.courses.length > 0) setSelectedCourseId(response.courses[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    const load = async () => {
      try {
        setLoadingAnalytics(true);
        const result = await apiService.getAnalytics(selectedCourseId);
        setAnalytics(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoadingAnalytics(false);
      }
    };
    load();
  }, [selectedCourseId]);

  const filteredCourses = useMemo(() => {
    if (!courseSearch.trim()) return courses;
    const q = courseSearch.toLowerCase();
    return courses.filter((c) => c.title.toLowerCase().includes(q) || c.courseCode.toLowerCase().includes(q));
  }, [courses, courseSearch]);

  return (
    <div>
      <Breadcrumbs />
      <div className="mb-8">
        <h2 className="section-title">Analytics</h2>
        <p className="section-subtitle mt-2">Review submissions, pass rates, and scoring patterns.</p>
      </div>

      {loadingCourses ? (
        <PageLoading message="Loading courses..." />
      ) : courses.length === 0 ? (
        <PageEmpty message="No courses generated yet." />
      ) : (
        <div className="mb-6 max-w-xl">
          <label className="block text-sm font-semibold text-near-black mb-2">Select course</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-gray pointer-events-none" />
            <input
              className="field pl-10 pr-4"
              placeholder="Search courses..."
              value={courseSearch}
              onChange={(e) => { setCourseSearch(e.target.value); setSelectedCourseId(''); }}
            />
          </div>
          <div className="mt-2 max-h-48 overflow-y-auto space-y-1 border border-chip-gray rounded-lg">
            {filteredCourses.map((course) => (
              <button
                key={course.id}
                type="button"
                onClick={() => { setSelectedCourseId(course.id); setCourseSearch(''); }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors gap-3 ${
                  selectedCourseId === course.id
                    ? 'bg-light-mint text-dark-green font-semibold'
                    : 'hover:bg-chip-gray text-near-black'
                }`}
              >
                <span className="font-medium truncate min-w-0">{course.title}</span>
                <span className="text-muted-gray shrink-0">({course.courseCode})</span>
                <span className="text-muted-gray shrink-0 text-xs">{timeAgo(course.createdAt)}</span>
              </button>
            ))}
            {filteredCourses.length === 0 && (
              <p className="text-xs text-body-gray px-3 py-2">No courses match your search.</p>
            )}
          </div>
        </div>
      )}

      {error && <PageError error={error} className="mb-4" />}

      {loadingAnalytics ? (
        <PageLoading message="Loading analytics..." />
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="top-stat">
              <p className="text-xs text-body-gray">Total submissions</p>
              <p className="text-3xl font-bold text-near-black">{analytics.totalSubmissions}</p>
            </div>
            <div className="top-stat">
              <p className="text-xs text-body-gray">Average score</p>
              <p className="text-3xl font-bold text-near-black">{analytics.averageScore}%</p>
            </div>
            <div className="top-stat">
              <p className="text-xs text-body-gray">Pass rate</p>
              <p className="text-3xl font-bold text-near-black">{analytics.passRate}%</p>
            </div>
          </div>

          {analytics.submissions.length === 0 ? (
            <PageEmpty message="No submissions yet for this course." />
          ) : (
            <div className="surface-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-chip-gray">
                    <th className="text-left px-5 py-3 text-xs font-bold text-body-gray">Student</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-body-gray">Score</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-body-gray">Percentage</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-body-gray">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-chip-gray last:border-b-0">
                      <td className="px-5 py-3 text-sm font-semibold text-near-black">{submission.studentName}</td>
                      <td className="px-5 py-3 text-sm text-body-gray">{submission.score}/{submission.total}</td>
                      <td className="px-5 py-3 text-sm text-body-gray">{submission.percentage}%</td>
                      <td className="px-5 py-3 text-sm text-body-gray">{new Date(submission.submittedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
