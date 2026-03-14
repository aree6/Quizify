import { useEffect, useState } from 'react';
import { apiService } from '../services/api';
import type { CourseSummary, CourseAnalytics } from '../types';

export function AnalyticsPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [analytics, setAnalytics] = useState<CourseAnalytics | null>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await apiService.getCourses();
        setCourses(response.courses);
        if (response.courses.length > 0) {
          setSelectedCourseId(response.courses[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourseId) return;
    const loadAnalytics = async () => {
      try {
        setLoadingAnalytics(true);
        const response = await apiService.getAnalytics(selectedCourseId);
        setAnalytics(response);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoadingAnalytics(false);
      }
    };
    loadAnalytics();
  }, [selectedCourseId]);

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
        <p className="text-slate-500 mt-1">View student submissions and course performance.</p>
      </div>

      {loadingCourses ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-slate-500">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-slate-500">No courses yet.</div>
      ) : (
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select course</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full sm:w-[420px] px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {courses.map((course) => (
              <option value={course.id} key={course.id}>
                {course.title} ({course.courseCode})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <div className="mb-6 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

      {loadingAnalytics ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-slate-500">Loading analytics...</div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500">Total submissions</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.totalSubmissions}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500">Average score</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.averageScore}%</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <p className="text-sm text-slate-500">Pass rate</p>
              <p className="text-3xl font-bold text-slate-900">{analytics.passRate}%</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {analytics.submissions.length === 0 ? (
              <div className="p-6 text-slate-500">No submissions yet for this course.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Student</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Score</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Percentage</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Submitted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {analytics.submissions.map((submission) => (
                      <tr key={submission.id}>
                        <td className="px-6 py-4 text-slate-900 font-medium">{submission.studentName}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {submission.score}/{submission.total}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{submission.percentage}%</td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(submission.submittedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
