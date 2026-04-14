import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, ChevronDown, ChevronRight, Edit2, Loader, Search, Trash2, Upload, X } from 'lucide-react';
import { apiService } from '../services/api';
import { COURSE_OPTIONS, findCourseByCode } from '../constants/courses';
import type { Material } from '../types';

type MaterialType = 'course_info' | 'slide';

interface QueueItem {
  id: string;
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
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

  const chapterNum = chapterMatch?.[1] ? Number(chapterMatch[1]) : 1;
  const itemNum = itemMatch?.[1] ? Number(itemMatch[1]) : 0;

  return {
    chapterLabel: `Chapter ${Math.max(1, chapterNum)}`,
    chapterItemLabel: `1.${Math.max(0, itemNum)}`,
  };
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

  return Array.from(files)
    .filter((file) => /\.(pdf|pptx)$/i.test(file.name))
    .map((file) => {
      const rel = (file as File & { webkitRelativePath?: string }).webkitRelativePath || '';
      const folderRoot = rel.includes('/') ? rel.split('/')[0] : 'Manual Selection';
      const suggestedCourseCode = fuzzySuggestCourseCode(`${folderRoot} ${file.name}`);
      const inferred = inferChapterAndItem(file.name);
      const inferredType = inferMaterialType(file.name);

      return {
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        status: 'pending' as const,
        fileName: inferFileName(file.name),
        materialType: inferredType,
        chapterLabel: inferredType === 'course_info' ? 'CI' : inferred.chapterLabel,
        chapterItemLabel: inferredType === 'course_info' ? '' : inferred.chapterItemLabel,
        courseCode: suggestedCourseCode,
        folderRoot,
      };
    });
}

function normalizeChapterLabel(raw: string) {
  const value = raw.trim();
  if (!value) return 'Chapter 1';
  if (/^chapter\s+/i.test(value)) return value;
  if (/^\d+$/i.test(value)) return `Chapter ${value}`;
  return value;
}

function chapterOptions(max = 13) {
  const options = ['CI'];
  for (let i = 1; i <= max; i += 1) {
    options.push(`Chapter ${i}`);
  }
  return options;
}

function statusBadgeClass(status: Material['status']) {
  if (status === 'Active') return 'status-badge status-active';
  if (status === 'Processing') return 'status-badge status-processing';
  return 'status-badge status-failed';
}

export function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'upload' | 'view'>('view');
  const [editingCourseCode, setEditingCourseCode] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [courseQuery, setCourseQuery] = useState('');
  const [collapsedStoredCourses, setCollapsedStoredCourses] = useState<Record<string, boolean>>({});
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});
  const [collapsedSubgroups, setCollapsedSubgroups] = useState<Record<string, boolean>>({});
  const [collapsedUploadCourses, setCollapsedUploadCourses] = useState<Record<string, boolean>>({});
  const [collapsedUploadChapters, setCollapsedUploadChapters] = useState<Record<string, boolean>>({});

  const chapterMenuOptions = chapterOptions(13);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTarget, setReplaceTarget] = useState<Material | null>(null);

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

  const stats = useMemo(
    () => ({
      files: materials.length,
      chunks: materials.reduce((sum, item) => sum + Number(item.chunk_count || 0), 0),
      bytes: materials.reduce((sum, item) => sum + Number(item.file_size || 0), 0),
    }),
    [materials],
  );

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
          next.chapterLabel = 'CI';
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

    let completed = 0;
    const total = pending.length;

    for (const item of pending) {
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading', error: undefined } : q)));
      try {
        await apiService.uploadMaterialAdvanced({
          file: item.file,
          courseCode: item.courseCode,
          materialType: item.materialType,
          chapter: item.materialType === 'slide' ? normalizeChapterLabel(item.chapterLabel) : undefined,
          chapterItemLabel: item.materialType === 'slide' ? item.chapterItemLabel || undefined : undefined,
          fileName: item.fileName || item.file.name,
          onDuplicate: 'error',
        });
        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'success' } : q)));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';

        if (message.toLowerCase().includes('duplicate material exists')) {
          const shouldReplace = window.confirm(`Duplicate detected for ${item.fileName}. Replace existing material?`);
          if (shouldReplace) {
            try {
              await apiService.uploadMaterialAdvanced({
                file: item.file,
                courseCode: item.courseCode,
                materialType: item.materialType,
                chapter: item.materialType === 'slide' ? normalizeChapterLabel(item.chapterLabel) : undefined,
                chapterItemLabel: item.materialType === 'slide' ? item.chapterItemLabel || undefined : undefined,
                fileName: item.fileName || item.file.name,
                onDuplicate: 'replace',
              });
              setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'success' } : q)));
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
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleDeleteChapter = async (courseCode: string, chapter: string) => {
    const yes = window.confirm(`Delete all materials in ${courseCode} / ${chapter}?`);
    if (!yes) return;
    await apiService.deleteChapterMaterials(courseCode, chapter);
    await loadMaterials();
  };

  const handleDeleteCourse = async (courseCode: string) => {
    const yes = window.confirm(`Delete ALL materials for ${courseCode}?`);
    if (!yes) return;
    await apiService.deleteCourseMaterials(courseCode);
    await loadMaterials();
  };

  const toggleStoredCourse = (courseCode: string) => {
    setCollapsedStoredCourses((prev) => ({ ...prev, [courseCode]: !prev[courseCode] }));
  };

  const toggleChapter = (key: string) => {
    setCollapsedChapters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSubgroup = (key: string) => {
    setCollapsedSubgroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleUploadCourse = (key: string) => {
    setCollapsedUploadCourses((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleUploadChapter = (key: string) => {
    setCollapsedUploadChapters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openReplace = (item: Material) => {
    setReplaceTarget(item);
    replaceInputRef.current?.click();
  };

  const onReplacePicked = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !replaceTarget) return;

    try {
      await apiService.uploadMaterialAdvanced({
        file,
        courseCode: replaceTarget.course_code,
        materialType: replaceTarget.material_type,
        chapter: replaceTarget.material_type === 'slide' ? replaceTarget.chapter || undefined : undefined,
        chapterItemLabel: replaceTarget.material_type === 'slide' ? replaceTarget.chapter_item_label || undefined : undefined,
        fileName: replaceTarget.file_name,
        onDuplicate: 'replace',
      });
      await loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Replace failed');
    } finally {
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
      <div className="mb-8">
        <h2 className="section-title">Materials Library</h2>
        <p className="section-subtitle mt-2">Upload course materials and manage them by course and chapter.</p>
      </div>

      <div className="flex gap-3 mb-6 justify-center">
        <button type="button" onClick={() => setViewMode('view')} className={viewMode === 'view' ? 'chip-active' : 'chip'}>
          View Materials
        </button>
        <button type="button" onClick={() => setViewMode('upload')} className={viewMode === 'upload' ? 'chip-active' : 'chip'}>
          Upload Material
        </button>
      </div>

      {viewMode === 'upload' && (
        <div className="surface-card p-6 mb-6">
          <div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className="ring-card p-8 text-center mb-4">
            <Upload className="w-8 h-8 mx-auto text-[#4b4b4b] mb-2" />
            <p className="text-sm font-semibold text-[#0e0f0c]">Drop files here or click to select</p>
            <p className="text-xs text-[#4b4b4b] mt-1">PDF and PPTX files supported</p>
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
                  <div className="w-full h-2 rounded-full bg-[#efefef] overflow-hidden">
                    <div className="h-full bg-[#9fe870] transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <p className="text-xs text-[#4b4b4b] mt-1">Uploading {uploadProgress}%</p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <p className="text-sm text-[#4b4b4b]">{queue.length} file(s) ready to upload</p>
              </div>

              <div className="space-y-3 max-h-[440px] overflow-y-auto">
                {Object.entries(uploadHierarchy)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([courseCode, courseChapters]) => {
                    const courseKey = `upload-course-${courseCode}`;
                    const courseCollapsed = collapsedUploadCourses[courseKey] || false;
                    const totalFiles = Object.values(courseChapters).reduce((sum, list) => sum + list.length, 0);

                    return (
                    <div key={courseCode} className="surface-card p-3">
                      <div className="flex items-center justify-between mb-2">
                        <button type="button" className="inline-flex items-center gap-2" onClick={() => toggleUploadCourse(courseKey)}>
                          {courseCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <p className="text-sm font-semibold text-[#0e0f0c]">{getCourseDisplay(courseCode)}</p>
                          <span className="text-xs text-[#4b4b4b]">({totalFiles} files)</span>
                        </button>
                        <button type="button" onClick={() => setEditingCourseCode(editingCourseCode === courseCode ? null : courseCode)} className="p-1.5 text-[#4b4b4b]">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {editingCourseCode === courseCode && (
                        <select
                          className="field !py-1.5 text-xs mb-2"
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

                      {!courseCollapsed && (
                      <div className="space-y-2">
                        {Object.entries(courseChapters)
                          .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                          .map(([chapterKey, chapterItems]) => {
                            const uploadChapterKey = `upload-chapter-${courseCode}-${chapterKey}`;
                            const chapterCollapsed = collapsedUploadChapters[uploadChapterKey] || false;

                            return (
                            <div key={uploadChapterKey} className="ring-card p-2">
                              <button type="button" className="inline-flex items-center gap-2 mb-2" onClick={() => toggleUploadChapter(uploadChapterKey)}>
                                {chapterCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                <span className="text-xs font-semibold text-[#4b4b4b]">{chapterKey}</span>
                                <span className="text-xs text-[#4b4b4b]">({chapterItems.length})</span>
                              </button>

                              {!chapterCollapsed && chapterItems.map((item) => {
                                const chapterValue = item.materialType === 'course_info' ? 'CI' : item.chapterLabel || 'Chapter 1';
                                return (
                            <div key={item.id} className="ring-card p-3 border border-[#efefef]">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="text-sm font-semibold text-[#0e0f0c] truncate"
                                    onDoubleClick={() => {
                                      const next = window.prompt('Edit file name', item.fileName);
                                      if (next !== null) updateQueueItem(item.id, { fileName: next });
                                    }}
                                  >
                                    {item.fileName}
                                  </p>
                                  <p className="text-xs text-[#4b4b4b]">{formatBytes(item.file.size)}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {item.status === 'uploading' && <Loader className="w-4 h-4 text-[#4b4b4b] animate-spin" />}
                                  {item.status === 'success' && <CheckCircle className="w-4 h-4 text-[#054d28]" />}
                                  {item.status === 'error' && <AlertCircle className="w-4 h-4 text-[#d03238]" />}
                                  {item.status === 'pending' && (
                                    <button type="button" onClick={() => removeFromQueue(item.id)} className="p-1 text-[#4b4b4b]"><X className="w-4 h-4" /></button>
                                  )}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <select
                                  value={chapterValue}
                                  onChange={(event) => {
                                    const value = event.target.value;
                                    if (value === 'CI') {
                                      updateQueueItem(item.id, { materialType: 'course_info', chapterLabel: 'CI', chapterItemLabel: '' });
                                    } else {
                                      updateQueueItem(item.id, { materialType: 'slide', chapterLabel: value });
                                    }
                                  }}
                                  className="field !py-1.5 text-xs"
                                >
                                  {chapterMenuOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                                <input
                                  className="field !py-1.5 text-xs"
                                  value={item.chapterItemLabel}
                                  onChange={(event) => updateQueueItem(item.id, { chapterItemLabel: event.target.value })}
                                  placeholder="1.0"
                                  disabled={item.materialType === 'course_info'}
                                />
                              </div>

                              {item.error && <p className="text-xs text-[#d03238] mt-1">{item.error}</p>}
                            </div>
                                );
                              })}
                            </div>
                            );
                          })}
                      </div>
                      )}
                    </div>
                    );
                  })}
              </div>

              <div className="mt-4 flex justify-end">
                <button type="button" onClick={uploadAll} disabled={uploading || queue.every((item) => item.status !== 'pending')} className="pill-primary text-xs">
                  {uploading ? 'Uploading...' : 'Upload All'}
                </button>
              </div>
            </div>
          )}

          {error && <div className="mt-4 p-3 rounded-[8px] bg-[#ffe5e7] text-[#d03238] text-sm">{error}</div>}
        </div>
      )}

      {viewMode === 'view' && (
        <>
          <div className="surface-card p-4 mb-4">
            <label className="block text-xs font-semibold text-[#4b4b4b] mb-1">Search by course</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b4b4b]" />
              <input className="field pl-10" value={courseQuery} onChange={(event) => setCourseQuery(event.target.value)} placeholder="Type course name or code" />
            </div>
          </div>

          {loading ? (
            <div className="surface-card p-6 text-sm text-[#4b4b4b]">Loading materials...</div>
          ) : Object.keys(filteredStoredByCourse).length === 0 ? (
            <div className="surface-card p-6 text-sm text-[#4b4b4b]">No materials uploaded yet.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(filteredStoredByCourse)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([courseCode, items]) => {
                  const course = findCourseByCode(courseCode);
                  const collapsed = collapsedStoredCourses[courseCode] || false;

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
                      <div className="px-4 sm:px-6 py-4 border-b border-[#efefef] flex flex-wrap items-center justify-between gap-2">
                        <button type="button" onClick={() => toggleStoredCourse(courseCode)} className="inline-flex items-center gap-2 text-left">
                          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          <span className="text-lg font-bold text-[#0e0f0c]">{course?.name || courseCode}</span>
                          <span className="text-sm text-[#4b4b4b]">({courseCode})</span>
                        </button>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#4b4b4b]">{items.length} files</span>
                          <button type="button" className="pill-secondary !px-2 !py-1.5" onClick={() => handleDeleteCourse(courseCode)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {!collapsed && (
                        <div className="p-3 sm:p-4 space-y-3">
                          {ci.length > 0 && (
                            <div className="ring-card p-3">
                              <p className="text-sm font-semibold text-[#0e0f0c] mb-2">Course Information</p>
                              {ci.map((item) => (
                                <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border border-[#efefef] rounded-[8px] p-2">
                                  <p className="text-sm text-[#0e0f0c]">{item.file_name}</p>
                                  <div className="flex items-center gap-2">
                                    <button type="button" className="pill-secondary !px-2 !py-1.5" onClick={() => openReplace(item)}>
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button type="button" onClick={() => handleDelete(item.id)} className="pill-secondary !px-2 !py-1.5">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {Object.entries(chapterGroups)
                            .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                            .map(([chapter, chapterItems]) => {
                              const sorted = [...chapterItems].sort((a, b) => a.file_name.localeCompare(b.file_name, undefined, { numeric: true, sensitivity: 'base' }));
                              const chapterKey = `${courseCode}__${chapter}`;
                              const chapterCollapsed = collapsedChapters[chapterKey] || false;

                              const subgrouped: Record<string, Material[]> = {};
                              sorted.forEach((item) => {
                                const subgroup = item.chapter_item_label || '1.0';
                                if (!subgrouped[subgroup]) subgrouped[subgroup] = [];
                                subgrouped[subgroup].push(item);
                              });

                              return (
                                <div key={chapter} className="ring-card p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <button type="button" onClick={() => toggleChapter(chapterKey)} className="inline-flex items-center gap-2">
                                      {chapterCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                      <span className="text-sm font-semibold text-[#0e0f0c]">{chapter}</span>
                                    </button>
                                    <div className="flex items-center gap-2">
                                      <button type="button" className="pill-secondary !px-2 !py-1.5" onClick={() => handleDeleteChapter(courseCode, chapter)}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {!chapterCollapsed && (
                                    <div className="space-y-2">
                                      {Object.entries(subgrouped)
                                        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
                                        .map(([subgroup, subgroupItems]) => {
                                          const subgroupKey = `${courseCode}__${chapter}__${subgroup}`;
                                          const subgroupCollapsed = collapsedSubgroups[subgroupKey] || false;

                                          return (
                                            <div key={subgroupKey} className="border border-[#efefef] rounded-[8px] p-2">
                                              <button type="button" onClick={() => toggleSubgroup(subgroupKey)} className="inline-flex items-center gap-2 mb-2">
                                                {subgroupCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                <span className="text-xs font-semibold text-[#4b4b4b]">Sub-chapter {subgroup}</span>
                                              </button>
                                              {!subgroupCollapsed && (
                                                <div className="space-y-2">
                                                  {subgroupItems.map((item) => (
                                                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 border border-[#efefef] rounded-[8px] p-2">
                                                      <div>
                                                        <p className="text-sm text-[#0e0f0c]">{item.file_name}</p>
                                                        {item.error_message && <p className="text-xs text-[#d03238] mt-1">{item.error_message}</p>}
                                                      </div>
                                                      <div className="flex items-center gap-2">
                                                        <span className="text-xs text-[#4b4b4b]">{formatBytes(item.file_size)}</span>
                                                        <span className="text-xs text-[#4b4b4b]">{item.chunk_count} chunks</span>
                                                        <span className={statusBadgeClass(item.status)}>{item.status}</span>
                                                        <button type="button" className="pill-secondary !px-2 !py-1.5" onClick={() => openReplace(item)}>
                                                          <Edit2 className="w-3.5 h-3.5" />
                                                        </button>
                                                        <button type="button" onClick={() => handleDelete(item.id)} className="pill-secondary !px-2 !py-1.5">
                                                          <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
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

      <div className="mt-8 pt-6 border-t border-[#efefef]">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="top-stat">
            <p className="text-xs text-[#4b4b4b]">Files</p>
            <p className="text-3xl font-bold text-[#0e0f0c]">{stats.files}</p>
          </div>
          <div className="top-stat">
            <p className="text-xs text-[#4b4b4b]">Indexed chunks</p>
            <p className="text-3xl font-bold text-[#0e0f0c]">{stats.chunks}</p>
          </div>
          <div className="top-stat">
            <p className="text-xs text-[#4b4b4b]">Storage</p>
            <p className="text-3xl font-bold text-[#0e0f0c]">{formatBytes(stats.bytes)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
