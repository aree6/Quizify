import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Edit2, Loader, RefreshCw, Search, Trash2, Upload, X } from 'lucide-react';
import { apiService } from '../services/api';
import { COURSE_OPTIONS, findCourseByCode } from '../constants/courses';
import type { Material } from '../types';
import { PageLoading, PageEmpty, PageError } from '../components/common/PageState';
import { useConfirmDialog } from '../components/common/useConfirmDialog';
import { useToast } from '../components/common/Toast';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { SegmentControl } from '../components/common/SegmentControl';
import { pluralize } from '../utils/helpers';
import type { SegmentOption } from '../components/common/SegmentControl';

type ViewMode = 'view' | 'upload';

const VIEW_OPTIONS: SegmentOption<ViewMode>[] = [
  { value: 'view', label: 'Your Materials' },
  { value: 'upload', label: 'Upload Material' },
];

type MaterialType = 'course_info' | 'slide';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'index_failed';
  error?: string;
  fileName: string;
  materialType: MaterialType;
  chapterLabel: string;
  chapterItemLabel: string;
  courseCode: string;
  folderRoot: string;
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(value >= 10 || idx === 0 ? 0 : 1)} ${units[idx]}`;
}

function inferFileName(fileName: string) {
  return fileName.trim();
}

function normalizeSearchToken(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function fuzzySuggestCourseCode(label: string) {
  const normalized = normalizeSearchToken(label);
  if (!normalized) return COURSE_OPTIONS[0].code;

  let best = COURSE_OPTIONS[0];
  let score = -1;

  COURSE_OPTIONS.forEach((course) => {
    const tokens = `${course.code} ${course.name}`.toLowerCase();
    let current = 0;
    normalized.split(' ').forEach((token) => {
      if (!token) return;
      if (tokens.includes(token)) current += token.length;
    });
    if (current > score) {
      score = current;
      best = course;
    }
  });

  return best.code;
}

function inferChapterAndItem(fileName: string) {
  const lower = fileName.toLowerCase();
  const chapterMatch = lower.match(/(?:chapter|ch|week|w)\s*[-_ ]?(\d{1,2})/i) || lower.match(/(?:^|[^\d])(\d{1,2})(?:[^\d]|$)/);
  const itemMatch = lower.match(/(?:part|p|section|sec|sub)\s*[-_ ]?(\d{1,2})/i) || lower.match(/(?:\.|_|-)\s*(\d{1,2})\s*(?:\.pdf|\.pptx)$/i);

  const chapterNum = Math.max(1, chapterMatch?.[1] ? Number(chapterMatch[1]) : 1);
  const itemNum = Math.max(0, itemMatch?.[1] ? Number(itemMatch[1]) : 0);

  return {
    chapterLabel: `Chapter ${chapterNum}`,
    chapterItemLabel: `${chapterNum}.${itemNum}`,
  };
}

/** Sort chapter-like keys: Course Information first, then Chapter N numerically. */
function compareChapterKeys(a: string, b: string): number {
  if (a === 'Course Information') return -1;
  if (b === 'Course Information') return 1;
  return a.localeCompare(b, undefined, { numeric: true });
}

/** Parse a label like "1.10" into a numeric tuple for proper ordering. */
function parseItemLabel(label: string | null | undefined): number[] {
  return String(label ?? '')
    .split('.')
    .map((part) => Number.parseInt(part, 10))
    .map((n) => (Number.isFinite(n) ? n : 0));
}

/** Sort items within a chapter by their sub-chapter label (1.0 < 1.1 < 1.10), then by file name. */
function compareQueueItems(a: QueueItem, b: QueueItem): number {
  const aParts = parseItemLabel(a.chapterItemLabel);
  const bParts = parseItemLabel(b.chapterItemLabel);
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (aParts[i] ?? 0) - (bParts[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return a.fileName.localeCompare(b.fileName, undefined, { numeric: true });
}

function inferMaterialType(fileName: string): MaterialType {
  const lower = fileName.toLowerCase();
  if (/(course\s*info|course-info|syllabus|outline|\bci\b)/i.test(lower)) {
    return 'course_info';
  }
  return 'slide';
}

function getCourseDisplay(courseCode: string) {
  const course = findCourseByCode(courseCode);
  if (!course) return courseCode;
  return `${course.name} (${course.code})`;
}

function queueFromFiles(files: FileList | null): QueueItem[] {
  if (!files) return [];

  const items: QueueItem[] = [];

  Array.from(files).forEach((file) => {
    if (!/\.(pdf|pptx)$/i.test(file.name)) return;

    if (file.size > MAX_FILE_SIZE) {
      items.push({
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        status: 'error',
        error: `File exceeds the 10 MB limit (${formatBytes(file.size)}).`,
        fileName: inferFileName(file.name),
        materialType: 'slide',
        chapterLabel: 'Chapter 1',
        chapterItemLabel: '1.0',
        courseCode: '',
        folderRoot: 'Manual Selection',
      });
      return;
    }

    const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || '';
    const folderRoot = rel.includes('/') ? rel.split('/')[0] : 'Manual Selection';
    const suggestedCourseCode = fuzzySuggestCourseCode(`${folderRoot} ${file.name}`);
    const inferred = inferChapterAndItem(file.name);
    const inferredType = inferMaterialType(file.name);

    items.push({
      id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      status: 'pending',
      fileName: inferFileName(file.name),
      materialType: inferredType,
      chapterLabel: inferredType === 'course_info' ? 'Course Information' : inferred.chapterLabel,
      chapterItemLabel: inferredType === 'course_info' ? '' : inferred.chapterItemLabel,
      courseCode: suggestedCourseCode,
      folderRoot,
    });
  });

  return items;
}

function normalizeChapterLabel(raw: string) {
  const value = raw.trim();
  if (!value) return 'Chapter 1';
  if (/^chapter\s+/i.test(value)) return value;
  if (/^\d+$/i.test(value)) return `Chapter ${value}`;
  return value;
}

function chapterOptions(max = 13) {
  const options = ['Course Information'];
  for (let i = 1; i <= max; i += 1) {
    options.push(`Chapter ${i}`);
  }
  return options;
}

function statusBadgeClass(status: Material['status'], material?: Material) {
  if (status === 'Active') {
    if (material?.has_embeddings === false) return 'status-badge status-processing';
    return 'status-badge status-active';
  }
  if (status === 'Processing') return 'status-badge status-processing';
  return 'status-badge status-failed';
}

function statusLabel(status: Material['status'], material?: Material): string {
  if (status === 'Active') {
    if (material?.has_embeddings === false) return 'Needs Index';
    return 'Indexed';
  }
  if (status === 'Processing') return 'Processing';
  if (status === 'Failed') {
    if (material?.error_message?.toLowerCase().includes('embedding')) return 'Unindexed';
    return 'Failed';
  }
  return status;
}

export function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('view');
  const [editingCourseCode, setEditingCourseCode] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [courseQuery, setCourseQuery] = useState('');
  const [expandedStoredCourses, setExpandedStoredCourses] = useState<Record<string, boolean>>({});
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [collapsedUploadCourses, setCollapsedUploadCourses] = useState<Record<string, boolean>>({});
  const [collapsedUploadChapters, setCollapsedUploadChapters] = useState<Record<string, boolean>>({});

  const chapterMenuOptions = chapterOptions(13);

  const { ask: confirm, dialog: confirmDialog } = useConfirmDialog();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<Material | null>(null);
  const [replacing, setReplacing] = useState<Set<string>>(new Set());
  const [reindexing, setReindexing] = useState<Set<string>>(new Set());
  const abortRef = useRef(false);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getMaterials();
      setMaterials(response.materials.filter((item) => item.status !== 'Deleted'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  // Auto-repair: detect Active materials that lack embeddings and reset them
  // to Failed so the re-index button shows up in the UI.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const broken = materials.filter(
        (m) => m.status === 'Active' && m.has_embeddings === false,
      );
      if (broken.length === 0) return;
      try {
        const { repaired } = await apiService.repairMaterials();
        if (repaired > 0 && !cancelled) {
          showToast(`Fixed ${repaired} material(s) that needed re-indexing.`);
          await loadMaterials();
        }
      } catch {
        // silent — repair is best-effort
      }
    })();
    return () => { cancelled = true; };
  }, [materials.length]);

  useEffect(() => {
    loadMaterials();
  }, []);

  const groupedStoredByCourse = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    materials.forEach((item) => {
      if (!grouped[item.course_code]) grouped[item.course_code] = [];
      grouped[item.course_code].push(item);
    });
    return grouped;
  }, [materials]);

  const filteredStoredByCourse = useMemo(() => {
    const query = courseQuery.trim().toLowerCase();
    if (!query) return groupedStoredByCourse;

    const filtered: Record<string, Material[]> = {};
    Object.entries(groupedStoredByCourse).forEach(([courseCode, items]) => {
      const course = findCourseByCode(courseCode);
      const label = `${course?.name || ''} ${courseCode}`.toLowerCase();
      if (label.includes(query)) filtered[courseCode] = items;
    });
    return filtered;
  }, [groupedStoredByCourse, courseQuery]);

  const appendQueue = (items: QueueItem[]) => {
    if (items.length === 0) {
      setError('No supported files found. Upload PDF or PPTX.');
      return;
    }

    setQueue((prev) => [...prev, ...items]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    appendQueue(queueFromFiles(event.target.files));
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    appendQueue(queueFromFiles(event.dataTransfer.files));
  };

  const updateQueueItem = (id: string, patch: Partial<QueueItem>) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if (patch.materialType === 'course_info') {
          next.chapterLabel = 'Course Information';
          next.chapterItemLabel = '';
        }
        return next;
      }),
    );
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const uploadAll = async () => {
    const pending = queue.filter((item) => item.status === 'pending');
    if (pending.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setError('');
    abortRef.current = false;

    let completed = 0;
    const total = pending.length;

    for (const item of pending) {
      if (abortRef.current) {
        setQueue((prev) => prev.map((q) => (q.status === 'uploading' ? { ...q, status: 'pending', error: undefined } : q)));
        break;
      }
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', error: undefined } : q)));
      try {
        const resp = await apiService.uploadMaterialAdvanced({
          file: item.file,
          courseCode: item.courseCode,
          materialType: item.materialType,
          chapter: item.materialType === 'slide' ? normalizeChapterLabel(item.chapterLabel) : undefined,
          chapterItemLabel: item.materialType === 'slide' ? item.chapterItemLabel || undefined : undefined,
          fileName: item.fileName || item.file.name,
          onDuplicate: 'error',
        });
        const status = resp.material.status;
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? {
                  ...q,
                  status: status === 'Active' ? 'success' : 'index_failed',
                  error: status !== 'Active' ? (resp.material.error_message || 'Indexing pending') : undefined,
                }
              : q,
          ),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';

        if (message.toLowerCase().includes('duplicate material exists')) {
          const shouldReplace = await confirm(`Duplicate detected for ${item.fileName}. Replace existing material?`, { title: 'Duplicate', confirmLabel: 'Replace', destructive: false });
          if (shouldReplace) {
            try {
              const resp = await apiService.uploadMaterialAdvanced({
                file: item.file,
                courseCode: item.courseCode,
                materialType: item.materialType,
                chapter: item.materialType === 'slide' ? normalizeChapterLabel(item.chapterLabel) : undefined,
                chapterItemLabel: item.materialType === 'slide' ? item.chapterItemLabel || undefined : undefined,
                fileName: item.fileName || item.file.name,
                onDuplicate: 'replace',
              });
              const replaceStatus = resp.material.status;
              setQueue((prev) =>
                prev.map((q) =>
                  q.id === item.id
                    ? {
                        ...q,
                        status: replaceStatus === 'Active' ? 'success' : 'index_failed',
                        error: replaceStatus !== 'Active' ? (resp.material.error_message || 'Indexing pending') : undefined,
                      }
                    : q,
                ),
              );
            } catch (replaceErr) {
              setQueue((prev) =>
                prev.map((q) =>
                  q.id === item.id
                    ? { ...q, status: 'error', error: replaceErr instanceof Error ? replaceErr.message : 'Replace failed' }
                    : q,
                ),
              );
            }

            completed += 1;
            setUploadProgress(Math.round((completed / total) * 100));
            continue;
          }
        }

        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', error: message }
              : q,
          ),
        );
      }

      completed += 1;
      setUploadProgress(Math.round((completed / total) * 100));
    }

    if (abortRef.current) {
      setUploading(false);
      setUploadProgress(0);
      return;
    }

    setUploading(false);
    setUploadProgress(100);
    await loadMaterials();
    setQueue((prev) => prev.filter((item) => item.status !== 'success'));
    setTimeout(() => setUploadProgress(0), 500);
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteMaterial(id);
      await loadMaterials();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleReindex = async (id: string) => {
    setReindexing((prev) => new Set(prev).add(id));
    try {
      await apiService.reindexMaterial(id);
      showToast('Material re-indexed successfully.');
      await loadMaterials();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Re-indexing failed');
    } finally {
      setReindexing((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDeleteChapter = async (courseCode: string, chapter: string) => {
    const yes = await confirm(`Delete all materials in ${courseCode} / ${chapter}?`, { title: 'Delete chapter' });
    if (!yes) return;
    await apiService.deleteChapterMaterials(courseCode, chapter);
    await loadMaterials();
    showToast(`Deleted chapter ${chapter} materials.`);
  };

  const handleDeleteCourse = async (courseCode: string) => {
    const yes = await confirm(`Delete ALL materials for ${courseCode}?`, { title: 'Delete course' });
    if (!yes) return;
    await apiService.deleteCourseMaterials(courseCode);
    await loadMaterials();
    showToast(`Deleted all materials for ${courseCode}.`);
  };

  const toggleStoredCourse = (courseCode: string) => {
    setExpandedStoredCourses((prev) => ({ ...prev, [courseCode]: !prev[courseCode] }));
  };

  const toggleChapter = (key: string) => {
    setCollapsedChapters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleUploadCourse = (key: string) => {
    setCollapsedUploadCourses((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleUploadChapter = (key: string) => {
    setCollapsedUploadChapters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openReplace = async (item: Material) => {
    const yes = await confirm(`Replace "${item.file_name}" with a new file? This will overwrite the existing material.`, { title: 'Replace Material', confirmLabel: 'Replace', destructive: true });
    if (!yes) return;
    setReplaceTarget(item);
    replaceInputRef.current?.click();
  };

  const onReplacePicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !replaceTarget) return;

    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.pptx')) {
      setError('Only PDF and PPTX files are supported for replacement.');
      setReplaceTarget(null);
      event.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError(`File exceeds the 10 MB limit (${formatBytes(file.size)}).`);
      setReplaceTarget(null);
      event.target.value = '';
      return;
    }

    setReplacing((prev) => new Set(prev).add(replaceTarget.id));
    try {
      await apiService.uploadMaterialAdvanced({
        file,
        courseCode: replaceTarget.course_code,
        materialType: replaceTarget.material_type,
        chapter: replaceTarget.material_type === 'slide' ? replaceTarget.chapter || undefined : undefined,
        chapterItemLabel: replaceTarget.material_type === 'slide' ? replaceTarget.chapter_item_label || undefined : undefined,
        fileName: file.name,
        onDuplicate: 'replace',
      });
      await loadMaterials();
      showToast(`Replaced "${replaceTarget.file_name}" with "${file.name}".`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replace failed');
    } finally {
      setReplacing((prev) => {
        const next = new Set(prev);
        next.delete(replaceTarget.id);
        return next;
      });
      setReplaceTarget(null);
      event.target.value = '';
    }
  };

  const uploadHierarchy = useMemo(() => {
    const courses: Record<string, Record<string, QueueItem[]>> = {};
    queue.forEach((item) => {
      if (!courses[item.courseCode]) courses[item.courseCode] = {};
      const chapterKey = item.materialType === 'course_info' ? 'Course Information' : item.chapterLabel || 'Chapter 1';
      if (!courses[item.courseCode][chapterKey]) courses[item.courseCode][chapterKey] = [];
      courses[item.courseCode][chapterKey].push(item);
    });
    return courses;
  }, [queue]);

  return (
    <div>
      <Breadcrumbs />

      <div className="flex justify-center mb-6">
        <SegmentControl options={VIEW_OPTIONS} value={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === 'upload' && (
        <div className="surface-card p-6 mb-6">
          <div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className="ring-card p-4 sm:p-8 py-20 sm:py-32 text-center mb-4">
            <Upload className="w-8 h-8 mx-auto text-body-gray mb-2" />
            <p className="text-sm font-semibold text-near-black">Drop files here or click to select</p>
            <p className="text-xs text-body-gray mt-1">PDF / PPTX only · Max 10 MB per file</p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="pill-secondary">Select Files</button>
              <button type="button" onClick={() => folderInputRef.current?.click()} className="pill-secondary">Select Folder</button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            onChange={handleFileSelect}
            className="hidden"
          />
          <input
            ref={folderInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            className="hidden"
            {...({ webkitdirectory: '', directory: '' } as Record<string, string>)}
          />

          {queue.length > 0 && (
            <div>

              {uploading && (
                <div className="mb-3">
                  <div className="w-full h-2 rounded-full bg-chip-gray overflow-hidden">
                    <div className="h-full bg-lime transition-[width] duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-body-gray mt-1">Uploading {uploadProgress}%</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-sm text-body-gray">{pluralize(queue.length, 'file')} ready to upload</p>
              </div>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1 p-3 sm:p-4 sm:m-4">
                {Object.entries(uploadHierarchy)
                  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                  .map(([courseCode, courseChapters]) => {
                    const courseKey = `upload-course-${courseCode}`;
                    const courseCollapsed = collapsedUploadCourses[courseKey] || false;
                    const totalFiles = Object.values(courseChapters).reduce((sum, list) => sum + list.length, 0);

                    return (
                      <div key={courseCode} className="surface-card p-4">
                        {/* Course header */}
                        <div className="flex items-center justify-between gap-3 mb-2 mt-2">
                          <button type="button" className="inline-flex items-center gap-2 min-w-0 flex-1" onClick={() => toggleUploadCourse(courseKey)}>
                            {courseCollapsed ? <ChevronRight className="w-4 h-4 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 flex-shrink-0" />}
                            <p className="text-sm font-semibold text-near-black truncate">{getCourseDisplay(courseCode)}</p>
                            <span className="text-xs text-body-gray flex-shrink-0">({pluralize(totalFiles, 'file')})</span>
                          </button>
                          <button type="button" onClick={() => setEditingCourseCode(editingCourseCode === courseCode ? null : courseCode)} className="p-1.5 text-body-gray flex-shrink-0">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {editingCourseCode === courseCode && (
                          <select
                            className="field !py-1.5 border border-muted-gray text-xs mb-3"
                            value={courseCode}
                            onChange={(event) => {
                              setQueue((prev) => prev.map((item) => (item.courseCode === courseCode ? { ...item, courseCode: event.target.value } : item)));
                              setEditingCourseCode(null);
                            }}
                          >
                            {COURSE_OPTIONS.map((c) => (
                              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                            ))}
                          </select>
                        )}

                        {/* Chapters (Course Information first, then Chapter 1, 2, 3...) */}
                        {!courseCollapsed && (
                          <div className="space-y-3">
                            {Object.entries(courseChapters)
                              .sort(([a], [b]) => compareChapterKeys(a, b))
                              .map(([chapterKey, chapterItems]) => {
                                const uploadChapterKey = `upload-chapter-${courseCode}-${chapterKey}`;
                                const chapterCollapsed = collapsedUploadChapters[uploadChapterKey] || false;
                                const sortedItems = [...chapterItems].sort(compareQueueItems);

                                return (
                                  <div key={uploadChapterKey} className="border border-hover-gray rounded-lg p-3">
                                    <button type="button" className="inline-flex items-center gap-2 mb-2" onClick={() => toggleUploadChapter(uploadChapterKey)}>
                                      {chapterCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      <span className="text-xs font-semibold text-near-black">{chapterKey}</span>
                                      <span className="text-xs text-body-gray">({sortedItems.length})</span>
                                    </button>

                                    {!chapterCollapsed && (
                                      <div className="space-y-2">
                                        {sortedItems.map((item) => {
                                          const chapterValue = item.materialType === 'course_info' ? 'Course Information' : item.chapterLabel || 'Chapter 1';
                                          return (
                                            <div key={item.id} className="rounded-md p-3 sm:p-3">
                                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-2 mb-2">
                                                <div className="min-w-0">
                                                  <p
                                                    className="text-sm font-semibold text-near-black truncate"
                                                    onDoubleClick={() => {
                                                      const next = window.prompt('Edit file name', item.fileName);
                                                      if (next !== null) updateQueueItem(item.id, { fileName: next });
                                                    }}
                                                  >
                                                    {item.fileName}
                                                  </p>
                                                  <p className="text-xs text-body-gray">{formatBytes(item.file.size)}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  {item.status === 'uploading' && <Loader className="w-4 h-4 text-body-gray animate-spin" />}
                                                  {item.status === 'success' && <CheckCircle className="w-4 h-4 text-positive" />}
                                                  {item.status === 'index_failed' && <AlertCircle className="w-4 h-4 text-body-gray" />}
                                                  {item.status === 'error' && <AlertCircle className="w-4 h-4 text-danger" />}
                                                  {(item.status === 'pending' || item.status === 'error' || item.status === 'index_failed') && (
                                                    <button type="button" onClick={() => removeFromQueue(item.id)} className="p-1 text-body-gray">
                                                      <X className="w-4 h-4" />
                                                    </button>
                                                  )}
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <select
                                                  value={chapterValue}
                                                  onChange={(event) => {
                                                    const value = event.target.value;
                                                    if (value === 'Course Information') {
                                                      updateQueueItem(item.id, { materialType: 'course_info', chapterLabel: 'Course Information', chapterItemLabel: '' });
                                                    } else {
                                                      updateQueueItem(item.id, { materialType: 'slide', chapterLabel: value });
                                                    }
                                                  }}
                                                  className="field !py-1.5 border border-muted-gray text-xs"
                                                >
                                                  {chapterMenuOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                                </select>
                                                <input
                                                  className="field !py-1.5 border border-muted-gray text-xs"
                                                  value={item.chapterItemLabel}
                                                  onChange={(event) => updateQueueItem(item.id, { chapterItemLabel: event.target.value })}
                                                  placeholder={item.materialType === 'course_info' ? '—' : '1.0'}
                                                  disabled={item.materialType === 'course_info'}
                                                />
                                              </div>

                                              {item.error && <p className="text-xs text-danger mt-2">{item.error}</p>}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="mt-4 flex justify-end gap-2">
                {uploading && (
                  <button type="button" onClick={() => { abortRef.current = true; }} className="pill-secondary text-xs">
                    Cancel
                  </button>
                )}
                <button type="button" onClick={uploadAll} disabled={uploading || queue.every((item) => item.status !== 'pending')} className="pill-primary text-xs">
                  {uploading ? 'Uploading...' : 'Upload All'}
                </button>
              </div>
            </div>
          )}

          {error && <PageError error={error} className="mt-4" />}
        </div>
      )}

      {viewMode === 'view' && (
        <>
          <div className="surface-card p-4 mb-4">
            <label className="block text-xs font-semibold text-body-gray mb-1">Search by course</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-body-gray" />
              <input className="field pl-10" value={courseQuery} onChange={(event) => setCourseQuery(event.target.value)} placeholder="Type course name or code" />
            </div>
          </div>

          {loading ? (
            <PageLoading message="Loading materials..." />
          ) : Object.keys(filteredStoredByCourse).length === 0 ? (
            <PageEmpty message="No materials uploaded yet." />
          ) : (
            <div className="space-y-6 border border-hover-gray rounded-lg">
              {Object.entries(filteredStoredByCourse)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([courseCode, items]) => {
                  const course = findCourseByCode(courseCode);
                  const expanded = expandedStoredCourses[courseCode] || false;

                  const slides = items.filter((item) => item.material_type !== 'course_info');
                  const ci = items.filter((item) => item.material_type === 'course_info');

                  const chapterGroups: Record<string, Material[]> = {};
                  slides.forEach((item) => {
                    const chapter = item.chapter || 'Chapter 1';
                    if (!chapterGroups[chapter]) chapterGroups[chapter] = [];
                    chapterGroups[chapter].push(item);
                  });

                  return (
                    <div key={courseCode} className="surface-card overflow-hidden">
                      <div className="px-4 sm:px-6 py-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                          <button type="button" onClick={() => toggleStoredCourse(courseCode)} className="inline-flex items-center gap-2 text-left min-w-0">
                            {expanded ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
                            <span className="text-base sm:text-lg font-bold text-near-black truncate">{course?.name || courseCode}</span>
                          </button>
                          <div className="flex items-center gap-2 pl-6 sm:pl-0">
                            <span className="text-sm text-body-gray shrink-0">({courseCode})</span>
                            <span className="text-sm text-body-gray shrink-0">{pluralize(items.length, 'file')}</span>
                            <button type="button" className="pill-icon" onClick={() => handleDeleteCourse(courseCode)}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {expanded && (
                        <div className="p-3 sm:p-4 tree-level">
                          {ci.length > 0 && (
                            <div className="rounded-lg p-3 tree-node ">
                              <p className="text-sm font-semibold text-near-black mb-2">Course Information</p>
                              <div className="tree-level">
                                {ci.map((item) => (
                                  <div key={item.id} className="rounded-lg p-2 tree-node">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                      <div className="min-w-0">
                                        <p className="text-sm text-near-black truncate">{item.file_name}</p>
                                        {item.error_message && <p className="text-xs text-danger mt-0.5">{item.error_message}</p>}
                                      </div>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {item.status === 'Active' && (
                                          <span className={statusBadgeClass(item.status, item)}>{statusLabel(item.status, item)}</span>
                                        )}
                                        {item.status === 'Processing' && <span className={statusBadgeClass(item.status, item)}>{statusLabel(item.status, item)}</span>}
                                        {item.status === 'Failed' && (
                                          <span className={statusBadgeClass(item.status, item)}>{statusLabel(item.status, item)}</span>
                                        )}
                                        {(item.status === 'Failed' || (item.status === 'Active' && item.has_embeddings === false)) && (
                                          <button
                                            type="button"
                                            className="pill-icon text-body-gray"
                                            title="Retry indexing"
                                            disabled={reindexing.has(item.id)}
                                            onClick={() => handleReindex(item.id)}
                                          >
                                            {reindexing.has(item.id) ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                          </button>
                                        )}
                                        {replacing.has(item.id) ? <Loader className="w-3.5 h-3.5 animate-spin" /> : (
                                          <button type="button" className="pill-icon" onClick={() => openReplace(item)}>
                                            <Edit2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                        <button type="button" onClick={() => handleDelete(item.id)} className="pill-icon">
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {Object.entries(chapterGroups)
                            .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                            .map(([chapter, chapterItems]) => {
                              const sorted = [...chapterItems].sort((a, b) => a.file_name.localeCompare(b.file_name, undefined, { numeric: true, sensitivity: 'base' }));
                              const chapterKey = `${courseCode}__${chapter}`;
                              const chapterCollapsed = collapsedChapters[chapterKey] ?? true;

                              const subgrouped: Record<string, Material[]> = {};
                              sorted.forEach((item) => {
                                const subgroup = item.chapter_item_label || '1.0';
                                if (!subgrouped[subgroup]) subgrouped[subgroup] = [];
                                subgrouped[subgroup].push(item);
                              });

                              return (
                                <div key={chapter} className="rounded-lg pr-1 pt-1 pb-1  tree-node ">
                                  <div className="flex items-center justify-between mb-2">
                                    <button type="button" onClick={() => toggleChapter(chapterKey)} className="inline-flex items-center gap-2">
                                      {chapterCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      <span className="text-sm font-semibold text-near-black">{chapter}</span>
                                    </button>
                                    <div className="flex items-center gap-2">
                                      <button type="button" className="pill-icon" onClick={() => handleDeleteChapter(courseCode, chapter)}>
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>

                                  {!chapterCollapsed && (
                                    <div className="tree-level">
                                      {Object.entries(subgrouped)
                                        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                                        .flatMap(([subgroup, subgroupItems]) =>
                                          subgroupItems.map((item) => ({ ...item, _subgroup: subgroup }))
                                        )
                                        .map((item) => (
                                          <div key={item.id} className="rounded-lg pt-2 pb-2 pl-2 tree-node">
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                                              <div className="min-w-0">
                                                <p className="text-sm text-near-black truncate">
                                                  <span className="text-muted-gray font-medium">{item._subgroup}</span> {item.file_name}
                                                </p>
                                                {item.error_message && <p className="text-xs text-danger mt-0.5">{item.error_message}</p>}
                                              </div>
                                              <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-xs text-body-gray shrink-0">{formatBytes(item.file_size)}</span>
                                                {item.status === 'Active' && (
                                                  <span className={statusBadgeClass(item.status, item)}>{statusLabel(item.status, item)}</span>
                                                )}
                                                {item.status === 'Processing' && <span className={statusBadgeClass(item.status, item)}>{statusLabel(item.status, item)}</span>}
                                                {item.status === 'Failed' && (
                                                  <span className={statusBadgeClass(item.status, item)}>{statusLabel(item.status, item)}</span>
                                                )}
                                                {(item.status === 'Failed' || (item.status === 'Active' && item.has_embeddings === false)) && (
                                                  <button
                                                    type="button"
                                                    className="pill-icon text-body-gray"
                                                    title="Retry indexing"
                                                    disabled={reindexing.has(item.id)}
                                                    onClick={() => handleReindex(item.id)}
                                                  >
                                                    {reindexing.has(item.id) ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                                  </button>
                                                )}
                                                {replacing.has(item.id) ? <Loader className="w-3.5 h-3.5 animate-spin" /> : (
                                                  <button type="button" className="pill-icon" onClick={() => openReplace(item)}>
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                  </button>
                                                )}
                                                <button type="button" onClick={() => handleDelete(item.id)} className="pill-icon">
                                                  <Trash2 className="w-4 h-4" />
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}

      <input
        ref={replaceInputRef}
        type="file"
        accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
        onChange={onReplacePicked}
        className="hidden"
      />

      {confirmDialog}
    </div>
  );
}
