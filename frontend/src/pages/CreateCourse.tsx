import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

const COURSE_OPTIONS = [
  'SE101',
  'SE201',
  'SE301',
  'SE401',
];

export function CreateCoursePage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('Week 5 - SDLC Quiz');
  const [courseCode, setCourseCode] = useState('SE101');
  const [topicsInput, setTopicsInput] = useState('SDLC, Requirements');
  const [questionCount, setQuestionCount] = useState(5);
  const [passPercentage, setPassPercentage] = useState(70);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState('');

  const topics = useMemo(
    () => topicsInput.split(',').map((item) => item.trim()).filter(Boolean),
    [topicsInput],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setCreatedLink('');

    if (topics.length === 0) {
      setError('Please enter at least one topic.');
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.generateCourse({
        title,
        courseCode,
        topics,
        questionCount,
        passPercentage,
        lecturerName: user?.name || 'Lecturer',
        expiresAt: expiresAt || null,
      });

      setCreatedLink(`${window.location.origin}${response.course.shareUrl}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create mini-course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Create Mini-Course</h2>
        <p className="text-slate-500 mt-1">Generate lesson and quiz for immediate student testing.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Quiz title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="e.g., Week 5 - SDLC Quiz"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Course code</label>
            <select
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              {COURSE_OPTIONS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Question count</label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Topics (comma-separated)</label>
          <input
            value={topicsInput}
            onChange={(e) => setTopicsInput(e.target.value)}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="SDLC, Requirements, Integration Testing"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Pass percentage</label>
            <input
              type="number"
              min={1}
              max={100}
              value={passPercentage}
              onChange={(e) => setPassPercentage(Number(e.target.value))}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Link expiry (optional)</label>
            <input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">{error}</div>}

        {createdLink && (
          <div className="p-4 rounded-xl bg-green-50 border border-green-200">
            <p className="text-sm text-green-800 mb-1">Mini-course created successfully.</p>
            <p className="text-sm text-green-700 break-all">{createdLink}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl font-medium bg-blue-600 text-white disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Mini-Course'}
        </button>
      </form>
    </div>
  );
}
