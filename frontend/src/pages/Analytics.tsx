import { Users, TrendingUp, CheckCircle } from 'lucide-react';

const mockSubmissions = [
  { id: '1', studentName: 'Ali Ahmad', score: 80, total: 5, course: 'Week 5 - SDLC Quiz', date: '2026-04-10' },
  { id: '2', studentName: 'Siti Nurhaliza', score: 100, total: 5, course: 'Week 5 - SDLC Quiz', date: '2026-04-10' },
  { id: '3', studentName: 'Mohd Razak', score: 60, total: 5, course: 'Testing Basics Quiz', date: '2026-04-09' },
  { id: '4', studentName: 'Aisyah Bt Ahmad', score: 90, total: 5, course: 'Testing Basics Quiz', date: '2026-04-09' },
  { id: '5', studentName: 'Khairul Anwar', score: 70, total: 5, course: 'Testing Basics Quiz', date: '2026-04-08' },
];

export function AnalyticsPage() {
  const avgScore = Math.round(
    mockSubmissions.reduce((acc, s) => acc + (s.score / s.total) * 100, 0) / mockSubmissions.length
  );

  const totalSubmissions = mockSubmissions.length;
  const passedCount = mockSubmissions.filter(s => (s.score / s.total) * 100 >= 70).length;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Analytics</h2>
        <p className="text-slate-500 mt-1">View student quiz results</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{totalSubmissions}</p>
              <p className="text-sm text-slate-500">Total Submissions</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{avgScore}%</p>
              <p className="text-sm text-slate-500">Average Score</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">{passedCount}</p>
              <p className="text-sm text-slate-500">Passed (70%+)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Student Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Course</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Score</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-slate-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {mockSubmissions.map((submission) => {
                const percentage = (submission.score / submission.total) * 100;
                const passed = percentage >= 70;
                return (
                  <tr key={submission.id}>
                    <td className="px-6 py-4 font-medium text-slate-900">{submission.studentName}</td>
                    <td className="px-6 py-4 text-slate-600">{submission.course}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {submission.score}/{submission.total}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{submission.date}</td>
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