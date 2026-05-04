import { useCallback, useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronRight, Loader2, ArrowLeft, Check, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { LessonWithCitations } from '../components/common/LessonWithCitations';
import { PromptBuilder } from '../components/common/PromptBuilder';
import { PageError } from '../components/common/PageState';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { DEFAULT_GENERATION_OPTIONS } from '../types';
import type { CoursePreview, GenerationOptions } from '../types';

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
      <label className="block text-sm font-semibold text-near-black mb-2">Course</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-gray" />
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
            <div className="p-3 text-sm text-body-gray">
              {courses.length === 0 ? 'No courses with indexed materials.' : 'No matching course.'}
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onChange(c); setQuery(`${c.code} - ${c.name}`); setOpen(false); }}
                className="w-full text-left px-4 py-2.5 hover:bg-chip-gray"
              >
                <p className="text-sm font-semibold text-near-black">{c.code}</p>
                <p className="text-xs text-body-gray">{c.name}</p>
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
      <div className="flex items-center gap-2 py-6 text-sm text-body-gray">
        <Loader2 className="w-4 h-4 animate-spin" />
        Extracting chapters and topics from course materials…
      </div>
    );
  }

  if (chapters.length === 0) {
    return (
      <div className="py-4 text-sm text-body-gray">
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
          <div key={ch.chapter} className="border border-hover-gray rounded-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-chip-gray/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allSelected && ch.topics.length > 0}
                onChange={() => toggleAllInChapter(ch)}
                className="w-4 h-4 accent-lime cursor-pointer"
              />
              <button
                type="button"
                className="flex items-center gap-2 flex-1 text-left"
                onClick={() => toggleChapter(ch.chapter)}
              >
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-body-gray" />
                  : <ChevronRight className="w-4 h-4 text-body-gray" />}
                <span className="text-sm font-semibold text-near-black">{ch.chapter}</span>
                {selectedCount > 0 && (
                  <span className="ml-auto text-xs text-body-gray">
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
                    className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-chip-gray/60 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.has(topic)}
                      onChange={() => onToggle(topic)}
                      className="w-4 h-4 accent-lime cursor-pointer"
                    />
                    <span className="text-sm text-near-black">{topic}</span>
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
          <h3 className="text-lg font-bold text-near-black">{preview.title}</h3>
          <p className="text-xs text-body-gray">
            {preview.generationSource} · {preview.contextChunksUsed} chunks · {preview.questionCount} questions
          </p>
          {preview.topicCoverage.length > 0 && (
            <p className="text-xs text-body-gray mt-1">
              {preview.topicCoverage
                .map((tc) => `${tc.topic}: ${tc.chunkCount}`)
                .join(' · ')}
            </p>
          )}
        </div>
      </div>

      {/* Lesson content — [S#] markers are clickable and open a source modal. */}
      <div className="surface-card p-6">
        <h4 className="text-sm font-semibold text-near-black mb-3">Lesson Content</h4>
        <LessonWithCitations
          markdown={preview.lesson}
          sources={preview.sources}
          className="markdown-content text-sm text-body-gray leading-relaxed"
        />
      </div>

      {/* Quiz questions */}
      <div className="surface-card p-6">
        <h4 className="text-sm font-semibold text-near-black mb-4">Quiz Questions</h4>
        <div className="space-y-5">
          {preview.questions.map((q, idx) => (
            <div key={idx} className="border border-hover-gray rounded-lg p-4">
              <p className="text-sm font-medium text-near-black mb-2">
                {idx + 1}. {q.prompt}
              </p>
              {/* Metadata chips */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-chip-gray text-body-gray font-medium uppercase tracking-wide">
                  {q.metadata.bloomLevel}
                </span>
                <span className="px-2 py-0.5 text-[10px] rounded-full bg-chip-gray text-body-gray font-medium uppercase tracking-wide">
                  {q.metadata.soloLevel.replace('_', '-')}
                </span>
                {q.metadata.topic && (
                  <span className="px-2 py-0.5 text-[10px] rounded-full bg-light-mint text-positive font-medium">
                    {q.metadata.topic}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {q.options.map((opt, oi) => (
                  <div
                    key={oi}
                    className={`text-sm px-3 py-2 rounded-md ${
                      oi === q.correct
                        ? 'bg-light-mint text-positive font-medium'
                        : 'bg-chip-gray/60 text-body-gray'
                    }`}
                  >
                    <span className="font-semibold mr-1.5">{optionLabels[oi]}.</span>
                    {opt}
                    {oi === q.correct && <Check className="inline w-3.5 h-3.5 ml-1" />}
                  </div>
                ))}
              </div>
              {/* Explanations */}
              <div className="mt-3 space-y-1.5">
                {q.explanations.map((exp, ei) => (
                  <div
                    key={ei}
                    className={`text-xs px-2.5 py-1.5 rounded-md ${
                      ei === q.correct
                        ? 'bg-light-mint text-positive'
                        : 'bg-chip-gray/60 text-body-gray'
                    }`}
                  >
                    <span className="font-semibold mr-1">{optionLabels[ei]}:</span>
                    {exp}
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
  // Lecturer-selected pedagogy options (Bloom / SOLO / length / custom instructions).
  const [options, setOptions] = useState<GenerationOptions>(DEFAULT_GENERATION_OPTIONS);

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
        options,
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
        sources: preview.sources,
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
        {error && <PageError error={error} className="mb-4" />}
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
      <Breadcrumbs />
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
            <label className="block text-sm font-semibold text-near-black mb-2">Question count</label>
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
            <p className="text-xs text-body-gray mt-1">More questions = broader coverage but slower generation.</p>
          </div>
        </div>

        {/* Topics — chapter accordion */}
        <div>
          <label className="block text-sm font-semibold text-near-black mb-2">
            Topics
            {selectedTopics.size > 0 && (
              <span className="ml-2 font-normal text-body-gray">({selectedTopics.size} selected)</span>
            )}
          </label>
          <TopicSelector
            chapters={chapters}
            selectedTopics={selectedTopics}
            onToggle={toggleTopic}
            loading={topicsLoading}
          />
        </div>

        {/* Pedagogy-grounded prompt builder (Bloom / SOLO / length / custom). */}
        <PromptBuilder value={options} onChange={setOptions} />

        {/* Error */}
        {error && <PageError error={error} />}

        {/* Success (after confirm) */}
        {createdLink && (
          <div className="p-4 rounded-lg bg-light-mint text-positive text-sm">
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
