import { useState } from 'react';
import { Upload, FileText, FolderOpen, BookOpen, Plus, Edit, Trash2 } from 'lucide-react';

export function MaterialsPage() {
  const [uploading, setUploading] = useState(false);

  const courses = [
    { id: '1', name: 'SE101 - Software Engineering', topics: 5, files: 12 },
    { id: '2', name: 'SE201 - Requirements Engineering', topics: 4, files: 8 },
    { id: '3', name: 'SE301 - Software Testing', topics: 6, files: 15 },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Course Materials</h2>
          <p className="text-slate-500 mt-1">Upload and manage course materials for RAG processing</p>
        </div>
        <button 
          onClick={() => setUploading(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium"
        >
          <Plus className="w-5 h-5" />
          Upload Materials
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">3</p>
              <p className="text-sm text-slate-500">Total Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">15</p>
              <p className="text-sm text-slate-500">Topics</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">35</p>
              <p className="text-sm text-slate-500">Files Uploaded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Courses List */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Courses</h3>
        <div className="space-y-3">
          {courses.map(course => (
            <div 
              key={course.id} 
              className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-slate-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">{course.name}</h4>
                  <p className="text-sm text-slate-500">{course.topics} topics • {course.files} files</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 text-slate-400">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-slate-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload Modal */}
      {uploading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Upload Materials</h3>
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer">
              <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <p className="text-slate-600 font-medium">Drag and drop files here</p>
              <p className="text-slate-400 text-sm mt-1">or</p>
              <button className="mt-2 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium">
                Browse Files
              </button>
              <p className="text-slate-400 text-xs mt-3">Supported: PDF, PPT, PPTX</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setUploading(false)}
                className="px-4 py-2 text-slate-500"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
                Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}