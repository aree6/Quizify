import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, ChevronDown, Copy, ExternalLink, Trash2 } from 'lucide-react';
import type { CourseSummary } from '../types';
import { apiService } from '../services/api';
import { PageLoading, PageEmpty, PageError } from '../components/common/PageState';
import { useConfirmDialog } from '../components/common/useConfirmDialog';
import { useToast } from '../components/common/Toast';
import { timeAgo, parseTitleParts, pluralize } from '../utils/helpers';

type SortKey = 'recent' | 'courseCode' | 'title' | 'questions' | 'attempts';

export function MyCoursesPage() {
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  const [deleting, setDeleting] = useState<string | null>(null);
  const { ask: confirm, dialog: confirmDialog } = useConfirmDialog();
  const { showToast } = useToast();

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
    const yes = await confirm(`Delete "${title}"? This will also remove all associated quizzes and attempts.`, { title: 'Delete course' });
    if (!yes) return;
    setDeleting(id);
    try {
      await apiService.deleteCourse(id);
      setCourses((prev) => prev.filter((c) => c.id !== id));
      showToast(`Deleted "${title}".`);
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
      <div className="flex items-center gap-1.5 mb-6">
        <ArrowUpDown className="w-4 h-4 text-body-gray" />
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="field !w-auto appearance-none !inline-flex !py-1.5 pr-7 cursor-pointer"
          >
            <option value="recent">Recent</option>
            <option value="courseCode">Course code</option>
            <option value="title">Title</option>
            <option value="questions">Questions</option>
            <option value="attempts">Attempts</option>
          </select>
          <ChevronDown className="w-4 h-4 text-body-gray pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {loading ? (
        <PageLoading message="Loading courses..." />
      ) : error ? (
        <PageError error={error} className="mb-4" />
      ) : sorted.length === 0 ? (
        <PageEmpty message="No courses yet." />
      ) : (
        <div className="space-y-3">
          {confirmDialog}
          {sorted.map((course) => {
            const { courseName, entries } = parseTitleParts(course.title);
            return (
            <div key={course.id} className="surface-card border border-chip-gray p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-bold text-near-black truncate">{courseName}</p>
                {entries.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entries.map((entry) => (
                      <span key={entry} className="px-2 py-0.5 text-[11px] rounded-full bg-chip-gray text-body-gray font-medium">
                        {entry}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-sm text-body-gray mt-1.5">
                  {course.courseCode} • {pluralize(course.questionCount, 'question')} • {pluralize(course.attempts, 'attempt')} • {timeAgo(course.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`status-badge ${course.status === 'Ready' ? 'status-active' : course.status === 'Generating' ? 'status-processing' : 'status-active'}`}>
                  {course.status}
                </span>
                <button type="button" onClick={() => copyLink(course.shareUrl)} className="pill-icon" title="Copy share link">
                  <Copy className="w-4 h-4" />
                </button>
                <a href={course.shareUrl} target="_blank" rel="noreferrer" className="pill-icon" title="Open share link">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(course.id, course.title)}
                  disabled={deleting === course.id}
                  className="pill-icon text-danger hover:bg-danger hover:text-white"
                  title="Delete course"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
