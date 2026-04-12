import { useEffect, useState } from 'react';
import type { CourseAnalytics, CourseSummary } from '../types';
import { apiService } from '../services/api';

export function AnalyticsPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
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

  return (
    <div>
      <div className="mb-8">
        <h2 className="section-title">Analytics</h2>
        <p className="section-subtitle mt-2">Review submissions, pass rates, and scoring patterns.</p>
      </div>

      {loadingCourses ? (
        <div className="surface-card p-6 text-sm text-[#4b4b4b]">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="surface-card p-6 text-sm text-[#4b4b4b]">No courses generated yet.</div>
      ) : (
        <div className="mb-6 max-w-xl">
          <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">Select course</label>
          <select className="field" value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)}>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.courseCode})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="mb-4 p-3 rounded-[8px] bg-[#ffe5e7] text-[#d03238] text-sm">{error}</div>}

      {loadingAnalytics ? (
        <div className="surface-card p-6 text-sm text-[#4b4b4b]">Loading analytics...</div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="top-stat">
              <p className="text-xs text-[#4b4b4b]">Total submissions</p>
              <p className="text-3xl font-bold text-[#0e0f0c]">{analytics.totalSubmissions}</p>
            </div>
            <div className="top-stat">
              <p className="text-xs text-[#4b4b4b]">Average score</p>
              <p className="text-3xl font-bold text-[#0e0f0c]">{analytics.averageScore}%</p>
            </div>
            <div className="top-stat">
              <p className="text-xs text-[#4b4b4b]">Pass rate</p>
              <p className="text-3xl font-bold text-[#0e0f0c]">{analytics.passRate}%</p>
            </div>
          </div>

          {analytics.submissions.length === 0 ? (
            <div className="surface-card p-6 text-sm text-[#4b4b4b]">No submissions yet for this course.</div>
          ) : (
            <div className="surface-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#efefef]">
                    <th className="text-left px-5 py-3 text-xs font-bold text-[#4b4b4b]">Student</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-[#4b4b4b]">Score</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-[#4b4b4b]">Percentage</th>
                    <th className="text-left px-5 py-3 text-xs font-bold text-[#4b4b4b]">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.submissions.map((submission) => (
                    <tr key={submission.id} className="border-b border-[#efefef] last:border-b-0">
                      <td className="px-5 py-3 text-sm font-semibold text-[#0e0f0c]">{submission.studentName}</td>
                      <td className="px-5 py-3 text-sm text-[#4b4b4b]">{submission.score}/{submission.total}</td>
                      <td className="px-5 py-3 text-sm text-[#4b4b4b]">{submission.percentage}%</td>
                      <td className="px-5 py-3 text-sm text-[#4b4b4b]">{new Date(submission.submittedAt).toLocaleString()}</td>
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
