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

  const filtered = useMemo(() => {
    if (filter === 'all') return courses;
    return courses.filter((course) => course.status.toLowerCase() === filter);
  }, [courses, filter]);

  const copyLink = async (path: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="section-title">My Mini-Courses</h2>
        <p className="section-subtitle mt-2">Track generated courses and share links with students.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {(['all', 'ready', 'shared', 'generating'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={filter === item ? 'chip-active' : 'chip pulse-hover'}
          >
            {item.charAt(0).toUpperCase() + item.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="surface-card p-6 text-sm text-[#4b4b4b]">Loading courses...</div>
      ) : error ? (
        <div className="surface-card p-6 text-sm text-[#d03238]">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="surface-card p-6 text-sm text-[#4b4b4b]">No courses in this filter.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((course) => (
            <div key={course.id} className="surface-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-base font-bold text-[#0e0f0c]">{course.title}</p>
                <p className="text-sm text-[#4b4b4b]">
                  {course.courseCode} • {course.questionCount} questions • {course.attempts} attempts
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`status-badge ${course.status === 'Ready' ? 'status-active' : course.status === 'Generating' ? 'status-processing' : 'status-active'}`}>
                  {course.status}
                </span>
                <button type="button" onClick={() => copyLink(course.shareUrl)} className="pill-secondary !px-3 !py-2" title="Copy share link">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={course.shareUrl} target="_blank" rel="noreferrer" className="pill-secondary !px-3 !py-2" title="Open share link">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
