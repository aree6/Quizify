import { useCallback, useEffect, useState } from 'react';
import { Search, ChevronDown, ChevronRight, Loader2, ArrowLeft, X, Maximize2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { QrOverlay } from '../components/common/QrPopover';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { LessonWithCitations } from '../components/common/LessonWithCitations';
import { PromptBuilder } from '../components/common/PromptBuilder';
import { PageError } from '../components/common/PageState';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { pluralize, parseTitleParts } from '../utils/helpers';
import { DEFAULT_GENERATION_OPTIONS } from '../types';
import type {
  BloomLevel,
  CoursePreview,
  GeneratedQuestion,
  GenerationOptions,
  SoloLevel,
  QuestionMetadata,
} from '../types';

const BLOOM_LEVELS: BloomLevel[] = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];
const SOLO_LEVELS: SoloLevel[] = ['unistructural', 'multistructural', 'relational', 'extended_abstract'];

const SOLO_UI_LABELS: Record<SoloLevel, string> = {
  unistructural: 'Foundational',
  multistructural: 'Intermediate',
  relational: 'Advanced',
  extended_abstract: 'Challenge',
};

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
        <div className="absolute z-20 w-full mt-1 ring-card max-h-64 overflow-y-auto bg-white/90 backdrop-blur-md">
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
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none">
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
              <div className="px-4 py-2 space-y-1">
                {ch.topics.map((topic) => (
                  <label
                    key={topic}
                    className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-chip-gray/30 cursor-pointer"
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

/* ── Editable preview panel: shows generated lesson + editable quiz before confirming ── */
function PreviewPanel({
  preview,
  onConfirm,
  onBack,
  confirming,
}: {
  preview: CoursePreview;
  onConfirm: (questions: GeneratedQuestion[], passPercentage: number) => void;
  onBack: () => void;
  confirming: boolean;
}) {
  const [editableQuestions, setEditableQuestions] = useState<GeneratedQuestion[]>(
    () => structuredClone(preview.questions),
  );
  const [passPercentage, setPassPercentage] = useState(40);
  const optionLabels = ['A', 'B', 'C', 'D'];

  const updateQuestion = (idx: number, patch: Partial<GeneratedQuestion>) => {
    setEditableQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q)),
    );
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    setEditableQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, options: q.options.map((o, j) => (j === oIdx ? value : o)) }
          : q,
      ),
    );
  };

  const updateExplanation = (qIdx: number, eIdx: number, value: string) => {
    setEditableQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx
          ? { ...q, explanations: q.explanations.map((e, j) => (j === eIdx ? value : e)) }
          : q,
      ),
    );
  };

  const updateMetadata = (qIdx: number, patch: Partial<QuestionMetadata>) => {
    setEditableQuestions((prev) =>
      prev.map((q, i) =>
        i === qIdx ? { ...q, metadata: { ...q.metadata, ...patch } } : q,
      ),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="pill-secondary flex items-center gap-1.5">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <div className="flex-1">
          {(() => {
            const { courseName, entries } = parseTitleParts(preview.title);
            return (
              <>
                <h3 className="text-base sm:text-lg font-bold text-near-black">{courseName}</h3>
                {entries.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {entries.map((e) => (
                      <span key={e} className="px-2.5 py-0.5 text-[11px] rounded-full bg-chip-gray text-body-gray font-medium">
                        {e}
                      </span>
                    ))}
                  </div>
                )}
              </>
            );
          })()}
          <p className="text-xs text-body-gray mt-1">
            {preview.generationSource} · {pluralize(preview.contextChunksUsed, 'chunk')} · {pluralize(preview.questionCount, 'question')}
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

      {/* Lesson content */}
      <div className="surface-card p-4 sm:p-6">
        <h4 className="text-sm font-semibold text-near-black mb-3">Lesson Content</h4>
        <LessonWithCitations
          markdown={preview.lesson}
          sources={preview.sources}
          className="markdown-content text-sm text-body-gray leading-relaxed"
        />
      </div>

      {/* Editable Quiz Questions */}
      <div className="surface-card p-4 sm:p-6">
        <h4 className="text-sm font-semibold text-near-black mb-4">Quiz Questions (Editable)</h4>
        <div className="space-y-6">
          {editableQuestions.map((q, idx) => (
            <div key={idx} className="border border-hover-gray rounded-lg p-4 space-y-3">
              {/* Question number + prompt */}
              <div>
                <label className="block text-xs font-semibold text-body-gray mb-1">
                  Question {idx + 1}
                </label>
                <input
                  className="field text-sm"
                  value={q.prompt}
                  onChange={(e) => updateQuestion(idx, { prompt: e.target.value })}
                />
              </div>

              {/* Metadata: Bloom + SOLO + correct answer */}
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-semibold text-body-gray mb-1">
                    Bloom Level
                  </label>
                  <select
                    className="field !py-1.5 text-xs"
                    value={q.metadata.bloomLevel}
                    onChange={(e) => updateMetadata(idx, { bloomLevel: e.target.value as BloomLevel })}
                  >
                    {BLOOM_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-semibold text-body-gray mb-1">
                    SOLO Level
                  </label>
                  <select
                    className="field !py-1.5 text-xs"
                    value={q.metadata.soloLevel}
                    onChange={(e) => updateMetadata(idx, { soloLevel: e.target.value as SoloLevel })}
                  >
                    {SOLO_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {SOLO_UI_LABELS[level]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-xs font-semibold text-body-gray mb-1">
                    Correct Answer
                  </label>
                  <select
                    className="field !py-1.5 text-xs"
                    value={q.correct}
                    onChange={(e) => updateQuestion(idx, { correct: Number(e.target.value) })}
                  >
                    {optionLabels.map((label, i) => (
                      <option key={i} value={i}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Options (editable) */}
              <div>
                <label className="block text-xs font-semibold text-body-gray mb-1.5">Options</label>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          oi === q.correct
                            ? 'bg-lime text-dark-green'
                            : 'bg-chip-gray text-body-gray'
                        }`}
                      >
                        {optionLabels[oi]}
                      </span>
                      <input
                        className="field flex-1 text-xs !py-2"
                        value={opt}
                        onChange={(e) => updateOption(idx, oi, e.target.value)}
                        placeholder={`Option ${optionLabels[oi]}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Explanations (editable) */}
              <div>
                <label className="block text-xs font-semibold text-body-gray mb-1.5">
                  Explanations
                </label>
                <div className="space-y-2">
                  {q.explanations.map((exp, ei) => (
                    <div
                      key={ei}
                      className={`p-2 rounded-md ${
                        ei === q.correct
                          ? 'bg-light-mint'
                          : 'bg-chip-gray/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-body-gray">
                          {optionLabels[ei]}
                        </span>
                        <span className={`text-[10px] uppercase tracking-wide ${
                          ei === q.correct ? 'text-positive font-semibold' : 'text-muted-gray'
                        }`}>
                          {ei === q.correct ? 'Correct' : 'Incorrect'}
                        </span>
                      </div>
                      <input
                        className="field text-xs !py-1.5 bg-white"
                        value={exp}
                        onChange={(e) => updateExplanation(idx, ei, e.target.value)}
                        placeholder={`Explanation for option ${optionLabels[ei]}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pass percentage */}
      <div className="surface-card p-4">
        <div className="flex items-center gap-4">
          <div>
            <label className="block text-sm font-semibold text-near-black mb-1">Pass Percentage</label>
            <p className="text-xs text-body-gray mb-1">Set the minimum score required to pass this quiz.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={100}
              value={passPercentage}
              onChange={(e) => setPassPercentage(Number(e.target.value))}
              className="w-32 accent-lime"
            />
            <input
              type="number"
              className="field w-20 text-center !py-1.5 text-sm"
              min={1}
              max={100}
              value={passPercentage}
              onChange={(e) => {
                const v = Math.min(100, Math.max(1, Number(e.target.value) || 1));
                setPassPercentage(v);
              }}
            />
            <span className="text-sm text-body-gray">%</span>
          </div>
        </div>
      </div>

      {/* Confirm / Back actions */}
      <div className="flex items-center gap-3">
        <button type="button" onClick={onBack} className="pill-secondary" disabled={confirming}>
          <X className="w-4 h-4 mr-1.5 inline" /> Discard
        </button>
        <button
          type="button"
          onClick={() => onConfirm(editableQuestions, passPercentage)}
          className="pill-primary"
          disabled={confirming}
        >
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
  // Lecturer-selected pedagogy options (Bloom / SOLO / length / custom).
  const [options, setOptions] = useState<GenerationOptions>(DEFAULT_GENERATION_OPTIONS);

  // Preview state
  const [preview, setPreview] = useState<CoursePreview | null>(null);
  const [generating, setGenerating] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Result
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [showQrOverlay, setShowQrOverlay] = useState(false);

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

  // Step 2: Confirm and save to DB (with edited questions + pass percentage)
  const onConfirm = async (editedQuestions: GeneratedQuestion[], passPercentage: number) => {
    if (!preview) return;
    setError('');
    setConfirming(true);

    try {
      const res = await apiService.confirmCourse({
        title: preview.title,
        courseCode: preview.courseCode,
        topics: preview.topics,
        lesson: preview.lesson,
        questions: editedQuestions,
        sources: preview.sources,
        lecturerName: user?.name || 'Lecturer',
        passPercentage,
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
            <p className="font-semibold mb-3 text-center">Mini-course created and published.</p>
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setShowQrOverlay(true)}
                className="relative bg-white p-2 rounded-lg cursor-pointer group"
              >
                <QRCodeSVG value={createdLink} size={180} level="M" marginSize={2} />
                <div className="absolute inset-0 flex items-center justify-center bg-near-black/0 group-hover:bg-near-black/10 rounded-lg transition-colors">
                  <Maximize2 className="w-5 h-5 text-near-black opacity-0 group-hover:opacity-60 transition-opacity" />
                </div>
              </button>
              <p className="break-all text-center">{createdLink}</p>
            </div>
            {showQrOverlay && (
              <QrOverlay url={createdLink} onClose={() => setShowQrOverlay(false)} />
            )}
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
