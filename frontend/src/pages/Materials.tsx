import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle, Loader, Search, Trash2, Upload, X } from 'lucide-react';
import { apiService } from '../services/api';
import { COURSE_OPTIONS, filterCoursesBySearch, findCourseByCode, type CourseOption } from '../constants/courses';
import type { Material } from '../types';

type MaterialType = 'course_info' | 'slide';

interface QueueItem {
  id: string;
  file: File;
  relativePath?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
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

function inferChapter(relativePath?: string) {
  if (!relativePath) return '';
  const parts = relativePath.split('/');
  if (parts.length > 1) return parts[parts.length - 2];
  return '';
}

function inferTopic(fileName: string) {
  return fileName.replace(/\.(pdf|pptx)$/i, '').replace(/[_-]/g, ' ').trim();
}

function queueFromFiles(files: FileList | null): QueueItem[] {
  if (!files) return [];
  return Array.from(files)
    .filter((file) => /\.(pdf|pptx)$/i.test(file.name))
    .map((file) => {
      const maybePath = (file as File & { webkitRelativePath?: string }).webkitRelativePath;
      return {
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        relativePath: maybePath || undefined,
        status: 'pending' as const,
      };
    });
}

function CourseSearchSelect({
  selectedCourse,
  onSelect,
}: {
  selectedCourse: CourseOption;
  onSelect: (course: CourseOption) => void;
}) {
  const [query, setQuery] = useState(`${selectedCourse.code} - ${selectedCourse.name}`);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(`${selectedCourse.code} - ${selectedCourse.name}`);
  }, [selectedCourse]);

  const filtered = filterCoursesBySearch(query);

  return (
    <div className="relative w-full lg:w-[430px]">
      <label className="block text-xs font-semibold text-[#4b4b4b] mb-1">Search course</label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b4b4b]" />
        <input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          className="field pl-10"
          placeholder="SECJ2203 or Software Engineering"
        />
      </div>

      {open && (
        <div className="absolute z-20 mt-1 w-full ring-card max-h-64 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-[#4b4b4b]">No matching course</div>
          ) : (
            filtered.map((course) => (
              <button
                key={course.code}
                type="button"
                onClick={() => {
                  onSelect(course);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-[#efefef]"
              >
                <p className="text-sm font-bold text-[#0e0f0c]">{course.code}</p>
                <p className="text-xs text-[#4b4b4b]">{course.name}</p>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<CourseOption>(COURSE_OPTIONS[0]);
  const [materialType, setMaterialType] = useState<MaterialType>('slide');
  const [chapter, setChapter] = useState('');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

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

  const stats = useMemo(
    () => ({
      files: materials.length,
      chunks: materials.reduce((sum, item) => sum + Number(item.chunk_count || 0), 0),
      bytes: materials.reduce((sum, item) => sum + Number(item.file_size || 0), 0),
    }),
    [materials],
  );

  const groupedByCourse = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    materials.forEach((item) => {
      if (!grouped[item.course_code]) grouped[item.course_code] = [];
      grouped[item.course_code].push(item);
    });
    return grouped;
  }, [materials]);

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

  const removeFromQueue = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const uploadAll = async () => {
    const pending = queue.filter((item) => item.status === 'pending');
    if (pending.length === 0) return;

    setUploading(true);
    setError('');

    for (const item of pending) {
      setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'uploading' } : q)));

      try {
        await apiService.uploadMaterialAdvanced({
          file: item.file,
          courseCode: selectedCourse.code,
          materialType,
          chapter: materialType === 'slide' ? chapter || inferChapter(item.relativePath) || undefined : undefined,
          topic: inferTopic(item.file.name),
          relativePath: item.relativePath,
        });

        setQueue((prev) => prev.map((q) => (q.id === item.id ? { ...q, status: 'success' } : q)));
      } catch (err) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id
              ? { ...q, status: 'error', error: err instanceof Error ? err.message : 'Upload failed' }
              : q,
          ),
        );
      }
    }

    setUploading(false);
    await loadMaterials();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteMaterial(id);
      await loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="section-title">Materials Library</h2>
        <p className="section-subtitle mt-2">Organize files by course, type, chapter, and topic.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

      <div className="surface-card p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <CourseSearchSelect selectedCourse={selectedCourse} onSelect={setSelectedCourse} />

          <div>
            <label className="block text-xs font-semibold text-[#4b4b4b] mb-1">Material type</label>
            <select value={materialType} onChange={(event) => setMaterialType(event.target.value as MaterialType)} className="field">
              <option value="slide">Slides / chapter files</option>
              <option value="course_info">Course information</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#4b4b4b] mb-1">Chapter (optional)</label>
            <input className="field" value={chapter} onChange={(event) => setChapter(event.target.value)} placeholder="Chapter 1" />
          </div>
        </div>

        <div onDragOver={(event) => event.preventDefault()} onDrop={handleDrop} className="ring-card p-8 text-center mb-4">
          <Upload className="w-8 h-8 mx-auto text-[#4b4b4b] mb-2" />
          <p className="text-sm font-semibold text-[#0e0f0c]">Drop files/folders or use picker</p>
          <p className="text-xs text-[#4b4b4b] mt-1">Supports PDF and PPTX, including folder upload.</p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <button type="button" onClick={() => fileInputRef.current?.click()} className="pill-secondary">
              Select files
            </button>
            <button type="button" onClick={() => folderInputRef.current?.click()} className="pill-secondary">
              Select folder
            </button>
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <p className="text-sm text-[#4b4b4b]">{queue.length} file(s) queued for {selectedCourse.code}</p>
              <button
                type="button"
                onClick={uploadAll}
                disabled={uploading || queue.every((item) => item.status !== 'pending')}
                className="pill-primary"
              >
                {uploading ? 'Uploading...' : 'Upload and Index'}
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto">
              {queue.map((item) => (
                <div key={item.id} className="ring-card p-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#0e0f0c] truncate">{item.file.name}</p>
                    {item.relativePath && <p className="text-xs text-[#4b4b4b] truncate">{item.relativePath}</p>}
                    {item.error && <p className="text-xs text-[#d03238] mt-1">{item.error}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {item.status === 'uploading' && <Loader className="w-4 h-4 text-[#4b4b4b] animate-spin" />}
                    {item.status === 'success' && <CheckCircle className="w-4 h-4 text-[#054d28]" />}
                    {item.status === 'error' && <AlertCircle className="w-4 h-4 text-[#d03238]" />}
                    {item.status === 'pending' && (
                      <button type="button" onClick={() => removeFromQueue(item.id)} className="p-1 text-[#4b4b4b]">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <div className="mt-4 p-3 rounded-[8px] bg-[#ffe5e7] text-[#d03238] text-sm">{error}</div>}
      </div>

      {loading ? (
        <div className="surface-card p-6 text-sm text-[#4b4b4b]">Loading materials...</div>
      ) : Object.keys(groupedByCourse).length === 0 ? (
        <div className="surface-card p-6 text-sm text-[#4b4b4b]">No materials uploaded yet.</div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByCourse)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([courseCode, items]) => {
              const course = findCourseByCode(courseCode);
              const infoItems = items.filter((item) => item.material_type === 'course_info');
              const slideItems = items.filter((item) => item.material_type === 'slide');

              return (
                <div key={courseCode} className="surface-card overflow-hidden">
                  <div className="px-6 py-4 border-b border-[#efefef]">
                    <h3 className="text-lg font-bold text-[#0e0f0c]">{courseCode}</h3>
                    <p className="text-sm text-[#4b4b4b]">{course?.name || 'Unknown course'} • {items.length} files</p>
                  </div>

                  <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="ring-card p-4">
                      <p className="text-sm font-bold text-[#0e0f0c] mb-2">Course Information ({infoItems.length})</p>
                      {infoItems.length === 0 ? (
                        <p className="text-xs text-[#4b4b4b]">No course information uploaded.</p>
                      ) : (
                        <div className="space-y-2">
                          {infoItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-3 border border-[#efefef] rounded-[8px]">
                              <div>
                                <p className="text-sm font-semibold text-[#0e0f0c]">{item.file_name}</p>
                                <p className="text-xs text-[#4b4b4b]">{formatBytes(item.file_size)} • {item.chunk_count} chunks</p>
                              </div>
                              <button type="button" onClick={() => handleDelete(item.id)} className="pill-secondary !px-3 !py-2">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="ring-card p-4">
                      <p className="text-sm font-bold text-[#0e0f0c] mb-2">Slides and Chapters ({slideItems.length})</p>
                      {slideItems.length === 0 ? (
                        <p className="text-xs text-[#4b4b4b]">No chapter slides uploaded.</p>
                      ) : (
                        <div className="space-y-2">
                          {slideItems.map((item) => (
                            <div key={item.id} className="flex items-center justify-between gap-3 p-3 border border-[#efefef] rounded-[8px]">
                              <div>
                                <p className="text-sm font-semibold text-[#0e0f0c]">{item.file_name}</p>
                                <p className="text-xs text-[#4b4b4b]">
                                  {item.chapter ? `${item.chapter} • ` : ''}
                                  {item.topic || 'No topic'} • {formatBytes(item.file_size)} • {item.chunk_count} chunks
                                </p>
                              </div>
                              <button type="button" onClick={() => handleDelete(item.id)} className="pill-secondary !px-3 !py-2">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
