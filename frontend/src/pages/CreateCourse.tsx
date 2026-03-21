import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { COURSE_OPTIONS, filterCoursesBySearch, type CourseOption } from '../constants/courses';

function CoursePicker({
  value,
  onChange,
}: {
  value: CourseOption;
  onChange: (course: CourseOption) => void;
}) {
  const [query, setQuery] = useState(`${value.code} - ${value.name}`);
  const [open, setOpen] = useState(false);
  const filtered = filterCoursesBySearch(query);

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">Course</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b4b4b]" />
        <input
          className="field pl-10"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="Search by code or course name"
        />
      </div>

      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white ring-card max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-[#4b4b4b]">No matching course.</div>
          ) : (
            filtered.map((course) => (
              <button
                key={course.code}
                type="button"
                onClick={() => {
                  onChange(course);
                  setQuery(`${course.code} - ${course.name}`);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#efefef]"
              >
                <p className="text-sm font-semibold text-[#0e0f0c]">{course.code}</p>
                <p className="text-xs text-[#4b4b4b]">{course.name}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function CreateCoursePage() {
  const { user } = useAuth();

  const [title, setTitle] = useState('Week 5 - SDLC Quiz');
  const [course, setCourse] = useState<CourseOption>(COURSE_OPTIONS[0]);
  const [topicsInput, setTopicsInput] = useState('SDLC, Requirements');
  const [questionCount, setQuestionCount] = useState(5);
  const [passPercentage, setPassPercentage] = useState(70);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [generationInfo, setGenerationInfo] = useState('');

  const topics = useMemo(
    () => topicsInput.split(',').map((item) => item.trim()).filter(Boolean),
    [topicsInput],
  );

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setCreatedLink('');
    setGenerationInfo('');

    if (topics.length === 0) {
      setError('Please enter at least one topic.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.generateCourse({
        title,
        courseCode: course.code,
        topics,
        questionCount,
        passPercentage,
        lecturerName: user?.name || 'Lecturer',
        expiresAt: expiresAt || null,
      });

      setCreatedLink(`${window.location.origin}${response.course.shareUrl}`);
      if (response.course.generationSource) {
        setGenerationInfo(`${response.course.generationSource} • ${response.course.contextChunksUsed || 0} chunks`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mini-course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="section-title">Create Mini-Course</h2>
        <p className="section-subtitle mt-2">Generate lesson and quiz from indexed RAG context.</p>
      </div>

      <form onSubmit={onSubmit} className="surface-card p-6 sm:p-8 space-y-5">
        <div>
          <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">Mini-course title</label>
          <input value={title} onChange={(event) => setTitle(event.target.value)} className="field" required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CoursePicker value={course} onChange={setCourse} />

          <div>
            <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">Question count</label>
            <select className="field" value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">Topics (comma-separated)</label>
          <input className="field" value={topicsInput} onChange={(event) => setTopicsInput(event.target.value)} required />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">Pass percentage</label>
            <input
              className="field"
              type="number"
              min={1}
              max={100}
              value={passPercentage}
              onChange={(event) => setPassPercentage(Number(event.target.value))}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">Link expiry (optional)</label>
            <input className="field" type="datetime-local" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} />
          </div>
        </div>

        {error && <div className="p-3 rounded-[8px] bg-[#ffe5e7] text-[#d03238] text-sm">{error}</div>}

        {createdLink && (
          <div className="p-4 rounded-[8px] bg-[#e2f6d5] text-[#054d28] text-sm">
            <p className="font-semibold mb-1">Mini-course created.</p>
            <p className="break-all">{createdLink}</p>
            {generationInfo && <p className="text-xs mt-1">{generationInfo}</p>}
          </div>
        )}

        <button type="submit" disabled={loading} className="pill-primary">
          {loading ? 'Generating...' : 'Generate Mini-Course'}
        </button>
      </form>
    </div>
  );
}
