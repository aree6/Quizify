import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ChevronDown, Copy, ExternalLink, Trash2 } from 'lucide-react';
import type { CourseSummary } from '../types';
import { apiService } from '../services/api';

type SortKey = 'recent' | 'courseCode' | 'title' | 'questions' | 'attempts';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}M ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}H ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}D ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

export function MyCoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This will also remove all associated quizzes and attempts.`)) return;
    setDeleting(id);
    try {
      await apiService.deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete course');
    } finally {
      setDeleting(null);
    }
  };

  const sorted = useMemo(() => {
    const result = [...courses];
    result.sort((a, b) => {
      switch (sort) {
        case 'recent':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'courseCode':
          return a.courseCode.localeCompare(b.courseCode);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'questions':
          return b.questionCount - a.questionCount;
        case 'attempts':
          return b.attempts - a.attempts;
        default:
          return 0;
      }
    });
    return result;
  }, [courses, sort]);

  const copyLink = async (path: string) => {
    await navigator.clipboard.writeText(`${window.location.origin}${path}`);
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="section-title">My Mini-Courses</h2>
        <p className="section-subtitle mt-2">Track generated courses and share links with students.</p>
      </div>

      <div className="flex items-center gap-1.5 mb-6">
        <ArrowUpDown className="w-4 h-4 text-[#4b4b4b]" />
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="appearance-none bg-white border border-[#efefef] rounded-lg pl-3 pr-7 py-1.5 text-sm text-[#1c1d1a] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[rgba(159,232,112,0.3)]"
          >
            <option value="recent">Recent</option>
            <option value="courseCode">Course code</option>
            <option value="title">Title</option>
            <option value="questions">Questions</option>
            <option value="attempts">Attempts</option>
          </select>
          <ChevronDown className="w-4 h-4 text-[#4b4b4b] pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {loading ? (
        <div className="surface-card p-6 text-sm text-[#4b4b4b]">Loading courses...</div>
      ) : error ? (
        <div className="surface-card p-6 text-sm text-[#d03238]">{error}</div>
      ) : sorted.length === 0 ? (
        <div className="surface-card p-6 text-sm text-[#4b4b4b]">No courses yet.</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((course) => (
            <div key={course.id} className="surface-card p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-base font-bold text-[#1c1d1a]">{course.title}</p>
                <p className="text-sm text-[#4b4b4b]">
                  {course.courseCode} • {course.questionCount} questions • {course.attempts} attempts • {timeAgo(course.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`status-badge ${course.status === 'Ready' ? 'status-active' : course.status === 'Generating' ? 'status-processing' : 'status-active'}`}>
                  {course.status}
                </span>
                <button type="button" onClick={() => copyLink(course.shareUrl)} className="pill-secondary !rounded-lg !px-3 !py-2" title="Copy share link">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={course.shareUrl} target="_blank" rel="noreferrer" className="pill-secondary !rounded-lg !px-3 !py-2" title="Open share link">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(course.id, course.title)}
                  disabled={deleting === course.id}
                  className="pill-secondary !rounded-lg !px-3 !py-2 text-[#d03238] hover:bg-[#d03238] hover:text-white"
                  title="Delete course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
