import { useEffect, useMemo, useRef, useState } from 'react';
import { Upload, FileText, FolderOpen, Trash2, X, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { apiService } from '../services/api';
import type { Material } from '../types';

const COURSE_OPTIONS = [
  { code: 'SECI1013', name: 'Discrete Structure' },
  { code: 'SECJ1013', name: 'Programming Technique I' },
  { code: 'SECR1013', name: 'Digital Logic' },
  { code: 'SECP1513', name: 'Technology & Information System' },
  { code: 'SECI1113', name: 'Computational Mathematics' },
  { code: 'SECI1143', name: 'Probability & Statistical Data Analysis' },
  { code: 'SECJ1023', name: 'Programming Technique II' },
  { code: 'SECR1033', name: 'Computer Organisation and Architecture' },
  { code: 'SECD2523', name: 'Database' },
  { code: 'SECD2613', name: 'System Analysis and Design' },
  { code: 'SECJ2013', name: 'Data Structure and Algorithm' },
  { code: 'SECR2213', name: 'Network Communications' },
  { code: 'SECV2113', name: 'Human Computer Interaction' },
  { code: 'SECJ2203', name: 'Software Engineering' },
  { code: 'SECV2223', name: 'Web Programming' },
  { code: 'SECR2043', name: 'Operating Systems' },
  { code: 'SECJ2154', name: 'Object Oriented Programming' },
  { code: 'SECJ2253', name: 'Requirements Engineering & Software Modelling' },
  { code: 'SECJ2363', name: 'Software Project Management' },
  { code: 'SECJ3104', name: 'Applications Development' },
  { code: 'SECJ3553', name: 'Artificial Intelligence' },
  { code: 'SECJ3303', name: 'Internet Programming' },
  { code: 'SECJ3323', name: 'Software Design & Architecture' },
  { code: 'SECJ3603', name: 'Knowledge-Based & Expert Systems' },
  { code: 'SECJ3032', name: 'Software Engineering Project I' },
  { code: 'SECJ3203', name: 'Theory of Computer Science' },
  { code: 'SECJ3343', name: 'Software Quality Assurance' },
  { code: 'SECJ3563', name: 'Computational Intelligence' },
  { code: 'SECJ3623', name: 'Mobile Application Programming' },
  { code: 'SECJ3403', name: 'Special Topic in Software Engineering' },
  { code: 'SECJ3483', name: 'Web Technology' },
  { code: 'SECJ4118', name: 'Industrial Training (HW)' },
  { code: 'SECJ4114', name: 'Industrial Training Report' },
  { code: 'SECJ4134', name: 'Software Engineering Project II' },
  { code: 'SECD3761', name: 'Technopreneurship Seminar' },
  { code: 'UBSS1032', name: 'Introduction to Entrepreneurship' },
  { code: 'SECJ4383', name: 'Software Construction' },
  { code: 'SECJ4423', name: 'Real-Time Software Engineering' },
  { code: 'SECJ4463', name: 'Agent-Oriented Software Engineering' },
];

function extractCourseCode(value: string): string {
  if (value.includes(' - ')) {
    return value.split(' - ')[0];
  }
  return value;
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string }> = {
  Processing: { icon: Loader, color: 'text-amber-600', bg: 'bg-amber-100' },
  Active: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  Failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

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

interface UploadFile extends File {
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [courseCode, setCourseCode] = useState('SECJ1013 - Programming Technique I');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadFile[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);

  const loadMaterials = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getMaterials();
      setMaterials(response.materials);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  const activeMaterials = useMemo(
    () => materials.filter((m) => m.status !== 'Deleted'),
    [materials],
  );

  const materialsByCourse = useMemo(() => {
    const grouped: Record<string, Material[]> = {};
    activeMaterials.forEach((m) => {
      if (!grouped[m.course_code]) {
        grouped[m.course_code] = [];
      }
      grouped[m.course_code].push(m);
    });
    return grouped;
  }, [activeMaterials]);

  const totalChunks = useMemo(
    () => activeMaterials.reduce((sum, item) => sum + Number(item.chunk_count || 0), 0),
    [activeMaterials],
  );
  const totalStorage = useMemo(
    () => activeMaterials.reduce((sum, item) => sum + Number(item.file_size || 0), 0),
    [activeMaterials],
  );

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const queue: UploadFile[] = files.map((file) => ({
      ...file,
      id: `${file.name}-${file.lastModified}`,
      status: 'pending' as const,
    }));

    setUploadQueue((prev) => [...prev, ...queue]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((f) => f.id !== id));
  };

  const processQueue = async () => {
    const pending = uploadQueue.filter((f) => f.status === 'pending');
    if (pending.length === 0) return;

    setUploadingCount(pending.length);

    for (const file of pending) {
      setUploadQueue((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, status: 'uploading' as const } : f))
      );

      try {
        const actualCourseCode = extractCourseCode(courseCode);
        await apiService.uploadMaterial({
          file: file as File,
          courseCode: actualCourseCode,
          topic: file.name.replace(/\.(pdf|pptx)$/i, '').replace(/[_-]/g, ' '),
        });

        setUploadQueue((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: 'success' as const } : f))
        );
      } catch (err) {
        setUploadQueue((prev) =>
          prev.map((f) =>
            f.id === file.id
              ? { ...f, status: 'error' as const, error: err instanceof Error ? err.message : 'Upload failed' }
              : f
          )
        );
      }
    }

    setUploadingCount(0);
    await loadMaterials();
    setUploadQueue((prev) => prev.filter((f) => f.status === 'pending'));
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleQueueUpload = async () => {
    await processQueue();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiService.deleteMaterial(id);
      await loadMaterials();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const getStatusIcon = (status: string) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Active;
    const Icon = config.icon;
    return <Icon className={`w-4 h-4 ${config.color}`} />;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Course Materials</h2>
        <p className="text-slate-500 mt-1">
          Upload PDF/PPTX files for RAG. Students can quiz on any uploaded material.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{activeMaterials.length}</p>
              <p className="text-sm text-slate-500">Files</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalChunks}</p>
              <p className="text-sm text-slate-500">Chunks Indexed</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatBytes(totalStorage)}</p>
              <p className="text-sm text-slate-500">Storage Used</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Upload New Materials</h3>
          <select
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="px-4 py-2 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {COURSE_OPTIONS.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        <div
          onClick={handleUploadClick}
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-colors mb-4"
        >
          <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <p className="text-slate-600 font-medium">
            Drop files here or click to browse
          </p>
          <p className="text-slate-400 text-sm mt-1">
            Select multiple files at once — PDF or PPTX
          </p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.pptx,application/pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploadQueue.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-sm font-medium text-slate-700">
              {uploadQueue.length} file(s) selected for {courseCode}
            </p>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {uploadQueue.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {file.status === 'uploading' ? (
                      <Loader className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                    ) : file.status === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    ) : file.status === 'error' ? (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    )}
                    <span className="text-sm text-slate-700 truncate">{file.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {file.error && (
                      <span className="text-xs text-red-600 hidden sm:inline">{file.error}</span>
                    )}
                    <button
                      onClick={() => removeFromQueue(file.id)}
                      disabled={file.status === 'uploading'}
                      className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={handleQueueUpload}
              disabled={uploadingCount > 0 || uploadQueue.every((f) => f.status !== 'pending')}
              className="px-4 py-2.5 rounded-xl font-medium bg-blue-600 text-white disabled:opacity-50"
            >
              {uploadingCount > 0 ? `Uploading ${uploadingCount}...` : 'Upload All'}
            </button>
          </div>
        )}

        {error && <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center text-slate-500">
            Loading materials...
          </div>
        ) : Object.keys(materialsByCourse).length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center text-slate-500">
            No materials uploaded yet. Upload your first file above!
          </div>
        ) : (
          Object.entries(materialsByCourse)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([course, courseMaterials]) => (
              <div key={course} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{course}</h3>
                    <p className="text-sm text-slate-500">
                      {courseMaterials.length} file(s) • {formatBytes(courseMaterials.reduce((s, m) => s + Number(m.file_size), 0))} total
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">File</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Topic</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Size</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Chunks</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Status</th>
                        <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {courseMaterials.map((material) => (
                        <tr key={material.id}>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-slate-400" />
                              <span className="text-sm font-medium text-slate-900">{material.file_name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-600">{material.topic || '-'}</td>
                          <td className="px-6 py-3 text-sm text-slate-600">{formatBytes(material.file_size)}</td>
                          <td className="px-6 py-3 text-sm text-slate-600">{material.chunk_count}</td>
                          <td className="px-6 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[material.status]?.bg || 'bg-slate-100'} ${STATUS_CONFIG[material.status]?.color || 'text-slate-600'}`}>
                              {getStatusIcon(material.status)}
                              {material.status}
                            </span>
                          </td>
                          <td className="px-6 py-3">
                            <button
                              onClick={() => handleDelete(material.id)}
                              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
        )}
      </div>
    </div>
  );
}