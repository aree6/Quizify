import { useCallback, useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronRight, Loader2, ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import type { CoursePreview } from '../types';

interface AvailableCourse {
  code: string;
  name: string;
}

interface ChapterData {
  chapter: string;
  topics: string[];
}

/* ── Course picker: only shows courses that have indexed materials ── */
function CoursePicker({
  courses,
  value,
  onChange,
  loading,
}: {
  courses: AvailableCourse[];
  value: AvailableCourse | null;
  onChange: (course: AvailableCourse) => void;
  loading: boolean;
}) {
  const [query, setQuery] = useState(value ? `${value.code} - ${value.name}` : '');
  const [open, setOpen] = useState(false);

  const filtered = courses.filter((c) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
  });

  return (
    <div className="relative">
      <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">Course</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b4b4b]" />
        <input
          className="field pl-10"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={loading ? 'Loading courses…' : 'Search available courses'}
          disabled={loading}
        />
      </div>
      {open && (
        <div className="absolute z-20 w-full mt-1 bg-white ring-card max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-3 text-sm text-[#4b4b4b]">
              {courses.length === 0 ? 'No courses with indexed materials.' : 'No matching course.'}
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c); setQuery(`${c.code} - ${c.name}`); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#efefef]"
              >
                <p className="text-sm font-semibold text-[#0e0f0c]">{c.code}</p>
                <p className="text-xs text-[#4b4b4b]">{c.name}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Chapter accordion with selectable subtopics ── */
function TopicSelector({
  chapters,
  selectedTopics,
  onToggle,
  loading,
}: {
  chapters: ChapterData[];
  selectedTopics: Set<string>;
  onToggle: (topic: string) => void;
  loading: boolean;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleChapter = (chapter: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(chapter)) next.delete(chapter);
      else next.add(chapter);
      return next;
    });
  };

  const toggleAllInChapter = (chapter: ChapterData) => {
    const allSelected = chapter.topics.every((t) => selectedTopics.has(t));
    chapter.topics.forEach((t) => {
      if (allSelected && selectedTopics.has(t)) onToggle(t);
      if (!allSelected && !selectedTopics.has(t)) onToggle(t);
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-6 text-sm text-[#4b4b4b]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Extracting chapters and topics from course materials…
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="py-4 text-sm text-[#4b4b4b]">
        No chapters found. Select a course with indexed materials first.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {chapters.map((ch) => {
        const isOpen = expanded.has(ch.chapter);
        const selectedCount = ch.topics.filter((t) => selectedTopics.has(t)).length;
        const allSelected = selectedCount === ch.topics.length;

        return (
          <div key={ch.chapter} className="border border-[#e2e2e2] rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-[#fafafa] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected && ch.topics.length > 0}
                onChange={() => toggleAllInChapter(ch)}
                className="w-4 h-4 accent-[#9fe870] cursor-pointer"
              />
              <button
                type="button"
                className="flex items-center gap-2 flex-1 text-left"
                onClick={() => toggleChapter(ch.chapter)}
              >
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-[#4b4b4b]" />
                  : <ChevronRight className="w-4 h-4 text-[#4b4b4b]" />}
                <span className="text-sm font-semibold text-[#0e0f0c]">{ch.chapter}</span>
                {selectedCount > 0 && (
                  <span className="ml-auto text-xs text-[#4b4b4b]">
                    {selectedCount}/{ch.topics.length}
                  </span>
                )}
              </button>
            </div>
            {isOpen && (
              <div className="px-4 py-2 space-y-1 bg-white">
                {ch.topics.map((topic) => (
                  <label
                    key={topic}
                    className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-[#f5f5f5] cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.has(topic)}
                      onChange={() => onToggle(topic)}
                      className="w-4 h-4 accent-[#9fe870] cursor-pointer"
                    />
                    <span className="text-sm text-[#0e0f0c]">{topic}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Preview panel: shows generated lesson + quiz before confirming ── */
function PreviewPanel({
  preview,
  onConfirm,
  onBack,
  confirming,
}: {
  preview: CoursePreview;
  onConfirm: () => void;
  onBack: () => void;
  confirming: boolean;
}) {
  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="pill-secondary flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#0e0f0c]">{preview.title}</h3>
          <p className="text-xs text-[#4b4b4b]">
            {preview.generationSource} · {preview.contextChunksUsed} chunks · {preview.questionCount} questions
          </p>
        </div>
      </div>

      {/* Lesson content */}
      <div className="surface-card p-6">
        <h4 className="text-sm font-semibold text-[#0e0f0c] mb-3">Lesson Content</h4>
        <div className="text-sm text-[#4b4b4b] leading-relaxed whitespace-pre-wrap">
          {preview.lesson}
        </div>
      </div>

      {/* Quiz questions */}
      <div className="surface-card p-6">
        <h4 className="text-sm font-semibold text-[#0e0f0c] mb-4">Quiz Questions</h4>
        <div className="space-y-5">
          {preview.questions.map((q, idx) => (
            <div key={idx} className="border border-[#e2e2e2] rounded-lg p-4">
              <p className="text-sm font-medium text-[#0e0f0c] mb-2">
                {idx + 1}. {q.prompt}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`text-sm px-3 py-2 rounded-md ${
                      oi === q.correct
                        ? 'bg-[#e2f6d5] text-[#054d28] font-medium'
                        : 'bg-[#fafafa] text-[#4b4b4b]'
                    }`}
                  >
                    <span className="font-semibold mr-1.5">{optionLabels[oi]}.</span>
                    {opt}
                    {oi === q.correct && <Check className="inline w-3.5 h-3.5 ml-1" />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm / Back actions */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="pill-secondary" disabled={confirming}>
          <X className="w-4 h-4 mr-1.5 inline" /> Discard
        </button>
        <button type="button" onClick={onConfirm} className="pill-primary" disabled={confirming}>
          {confirming ? 'Saving…' : 'Confirm & Create Course'}
        </button>
      </div>
    </div>
  );
}

/* ── Main page ── */
export function CreateCoursePage() {
  const { user } = useAuth();

  // Available courses (those with indexed data)
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  // Selected course + chapter/topic data
  const [selectedCourse, setSelectedCourse] = useState<AvailableCourse | null>(null);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  // Form
  const [questionCount, setQuestionCount] = useState(15);

  // Preview state
  const [preview, setPreview] = useState<CoursePreview | null>(null);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Result
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState('');

  // Fetch available courses on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiService.getAvailableCourses();
        if (!cancelled) setAvailableCourses(res.courses);
      } catch {
        if (!cancelled) setError('Failed to load available courses.');
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const onCourseChange = useCallback(async (course: AvailableCourse) => {
    setSelectedCourse(course);
    setChapters([]);
    setSelectedTopics(new Set());
    setPreview(null);
    setCreatedLink('');
    setTopicsLoading(true);
    setError('');

    try {
      const res = await apiService.getCourseTopics(course.code);
      setChapters(res.chapters);
    } catch {
      setError('Failed to extract topics for this course.');
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  const toggleTopic = useCallback((topic: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  }, []);

  // Step 1: Generate preview (no DB writes)
  const onGeneratePreview = async () => {
    if (!selectedCourse || selectedTopics.size === 0) return;
    setError('');
    setPreview(null);
    setCreatedLink('');
    setGenerating(true);

    try {
      const res = await apiService.previewCourse({
        courseCode: selectedCourse.code,
        topics: [...selectedTopics],
        questionCount,
      });
      setPreview(res.preview);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate preview.');
    } finally {
      setGenerating(false);
    }
  };

  // Step 2: Confirm and save to DB
  const onConfirm = async () => {
    if (!preview) return;
    setError('');
    setConfirming(true);

    try {
      const res = await apiService.confirmCourse({
        title: preview.title,
        courseCode: preview.courseCode,
        topics: preview.topics,
        lesson: preview.lesson,
        questions: preview.questions,
        lecturerName: user?.name || 'Lecturer',
      });
      setCreatedLink(`${window.location.origin}${res.course.shareUrl}`);
      setPreview(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save course.');
    } finally {
      setConfirming(false);
    }
  };

  // Show preview panel when we have one
  if (preview) {
    return (
      <div>
        <div className="mb-8">
          <h2 className="section-title">Preview Mini-Course</h2>
          <p className="section-subtitle mt-2">Review the generated content before publishing.</p>
        </div>
        {error && <div className="p-3 rounded-[8px] bg-[#ffe5e7] text-[#d03238] text-sm mb-4">{error}</div>}
        <PreviewPanel
          preview={preview}
          onConfirm={onConfirm}
          onBack={() => setPreview(null)}
          confirming={confirming}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="section-title">Create Mini-Course</h2>
        <p className="section-subtitle mt-2">Select topics from indexed course materials to generate a lesson and quiz.</p>
      </div>

      <div className="surface-card p-6 sm:p-8 space-y-6">
        {/* Course + Question count */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <CoursePicker
            courses={availableCourses}
            value={selectedCourse}
            onChange={onCourseChange}
            loading={coursesLoading}
          />
          <div>
            <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">Question count</label>
            <select
              className="field"
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        {/* Topics — chapter accordion */}
        <div>
          <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">
            Topics
            {selectedTopics.size > 0 && (
              <span className="ml-2 font-normal text-[#4b4b4b]">({selectedTopics.size} selected)</span>
            )}
          </label>
          <TopicSelector
            chapters={chapters}
            selectedTopics={selectedTopics}
            onToggle={toggleTopic}
            loading={topicsLoading}
          />
        </div>

        {/* Error */}
        {error && <div className="p-3 rounded-[8px] bg-[#ffe5e7] text-[#d03238] text-sm">{error}</div>}

        {/* Success (after confirm) */}
        {createdLink && (
          <div className="p-4 rounded-[8px] bg-[#e2f6d5] text-[#054d28] text-sm">
            <p className="font-semibold mb-1">Mini-course created and published.</p>
            <p className="break-all">{createdLink}</p>
          </div>
        )}

        {/* Generate Preview button */}
        <button
          type="button"
          onClick={onGeneratePreview}
          disabled={generating || !selectedCourse || selectedTopics.size === 0}
          className="pill-primary disabled:opacity-50"
        >
          {generating ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Generating Preview…
            </span>
          ) : (
            'Generate Mini-Course'
          )}
        </button>
      </div>
    </div>
  );
}
