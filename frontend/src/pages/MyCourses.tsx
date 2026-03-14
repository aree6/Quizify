import { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
import type { CourseSummary } from '../types';
import { apiService } from '../services/api';

export function MyCoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'shared' | 'generating'>('all');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const response = await apiService.getCourses();
        setCourses(response.courses);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load courses');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredCourses = useMemo(() => {
    if (filter === 'all') return courses;
    return courses.filter((course) => course.status.toLowerCase() === filter);
  }, [courses, filter]);

  const copyLink = async (path: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
    window.alert('Link copied');
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">My Mini-Courses</h2>
        <p className="text-slate-500 mt-1">Track generated courses and share links with students.</p>
      </div>

      <div className="flex gap-2 mb-6">
        {(['all', 'ready', 'shared', 'generating'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`px-4 py-2 rounded-xl text-sm font-medium ${
              filter === item ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'
            }`}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-6 text-slate-500">Loading courses...</div>
        ) : error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : filteredCourses.length === 0 ? (
          <div className="p-6 text-slate-500">No courses yet. Generate your first mini-course.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Title</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Course</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Questions</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Attempts</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCourses.map((course) => (
                  <tr key={course.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">{course.title}</td>
                    <td className="px-6 py-4 text-slate-600">{course.courseCode}</td>
                    <td className="px-6 py-4 text-slate-600">{course.questionCount}</td>
                    <td className="px-6 py-4 text-slate-600">{course.attempts}</td>
                    <td className="px-6 py-4 text-slate-600">{course.status}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          className="p-2 text-slate-500"
                          onClick={() => copyLink(course.shareUrl)}
                          title="Copy share link"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <a
                          href={course.shareUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-500"
                          title="Open share link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
