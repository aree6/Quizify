import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';

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

export function CreateCoursePage() {
  const { user } = useAuth();
  const [title, setTitle] = useState('Week 5 - SDLC Quiz');
  const [courseCode, setCourseCode] = useState('SECJ1013');
  const [topicsInput, setTopicsInput] = useState('SDLC, Requirements');
  const [questionCount, setQuestionCount] = useState(5);
  const [passPercentage, setPassPercentage] = useState(70);
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [createdLink, setCreatedLink] = useState('');
  const [generationInfo, setGenerationInfo] = useState('');

  const topics = useMemo(
    () => topicsInput.split(',').map((item) => item.trim()).filter(Boolean),
    [topicsInput],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setCreatedLink('');
    setGenerationInfo('');

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
      if (response.course.generationSource) {
        setGenerationInfo(
          `${response.course.generationSource} • ${response.course.contextChunksUsed || 0} context chunks used`,
        );
      }
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
              {COURSE_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} - {c.name}
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
            {generationInfo && <p className="text-xs text-green-700 mt-1">{generationInfo}</p>}
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
