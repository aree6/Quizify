import { useState } from 'react';
import { BookOpen, Copy, BarChart3, Eye, CheckCircle, Clock, Share2 } from 'lucide-react';

const mockCourses = [
  { 
    id: '1', 
    title: 'Week 5 - SDLC Quiz', 
    course: 'SE101 - Software Engineering',
    topics: ['SDLC', 'Requirements'],
    questions: 5,
    status: 'Ready',
    createdAt: '2026-04-10',
    link: 'quizify.app/c/abc123'
  },
  { 
    id: '2', 
    title: 'Testing Basics Quiz', 
    course: 'SE301 - Software Testing',
    topics: ['Unit Testing', 'Integration Testing'],
    questions: 10,
    status: 'Shared',
    createdAt: '2026-04-08',
    link: 'quizify.app/c/def456'
  },
  { 
    id: '3', 
    title: 'Requirements Engineering', 
    course: 'SE201 - Requirements',
    topics: ['Requirements Gathering', 'Use Cases'],
    questions: 5,
    status: 'Generating',
    createdAt: '2026-04-05',
    link: null
  },
];

export function MyCoursesPage() {
  const [filter, setFilter] = useState('all');

  const filteredCourses = filter === 'all' 
    ? mockCourses 
    : mockCourses.filter(c => c.status.toLowerCase() === filter);

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(`https://${link}`);
    alert('Link copied!');
  };

  const statusConfig = {
    Ready: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100' },
    Shared: { icon: Share2, color: 'text-blue-500', bg: 'bg-blue-100' },
    Generating: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100' },
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">My Mini-Courses</h2>
        <p className="text-slate-500 mt-1">View and manage your generated mini-courses</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{mockCourses.length}</p>
              <p className="text-sm text-slate-500">Total Courses</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {mockCourses.filter(c => c.status === 'Ready').length}
              </p>
              <p className="text-sm text-slate-500">Ready</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {mockCourses.filter(c => c.status === 'Shared').length}
              </p>
              <p className="text-sm text-slate-500">Shared</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['all', 'ready', 'shared', 'generating'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-500 border border-slate-200'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Title</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Course</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Topics</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Questions</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Created</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredCourses.map(course => {
                const StatusIcon = statusConfig[course.status as keyof typeof statusConfig].icon;
                const status = statusConfig[course.status as keyof typeof statusConfig];
                return (
                  <tr key={course.id}>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-900">{course.title}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{course.course}</td>
                    <td className="px-6 py-4 text-slate-600">{course.topics.join(', ')}</td>
                    <td className="px-6 py-4 text-slate-600">{course.questions}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {course.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{course.createdAt}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-2 text-slate-400" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                        {course.link && (
                          <button 
                            className="p-2 text-slate-400" 
                            title="Copy Link"
                            onClick={() => copyLink(course.link!)}
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-2 text-slate-400" title="Analytics">
                          <BarChart3 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}