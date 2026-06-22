import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ClipboardList,
  FileQuestion,
  FileText,
  PlusCircle,
  Send,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { PageEmpty, PageError, PageLoading } from '../components/common/PageState';
import type { StudentAttempt } from '../types';

interface DashboardCard {
  title: string;
  desc: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  cta: string;
}

const ADMIN_CARDS: DashboardCard[] = [
  { title: 'Materials Library', desc: 'Upload and manage course info and chapter slides.', path: 'materials', icon: FileText, cta: 'Open materials' },
];

const LECTURER_CARDS: DashboardCard[] = [
  { title: 'Materials Library', desc: 'Upload course info and chapter slide packs.', path: 'materials', icon: FileText, cta: 'Open materials' },
  { title: 'Create Course', desc: 'Generate lessons and quizzes by topic.', path: 'create-course', icon: PlusCircle, cta: 'Create now' },
  { title: 'My Courses', desc: 'Track generated courses and share URLs.', path: 'my-courses', icon: Users, cta: 'Manage courses' },
  { title: 'Analytics', desc: 'Review student scores and pass rates.', path: 'analytics', icon: BarChart3, cta: 'View analytics' },
];

function cardSet(role?: 'Lecturer' | 'Admin' | 'Student') {
  if (role === 'Admin') return ADMIN_CARDS;
  if (role === 'Lecturer') return LECTURER_CARDS;
  return [];
}

function formatAttemptDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-MY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function extractToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    return url.searchParams.get('token') || trimmed;
  } catch {
    return trimmed;
  }
}

function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizLink, setQuizLink] = useState('');
  const [submittingLink, setSubmittingLink] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await apiService.getStudentAttempts();
        setAttempts(data.attempts);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load attempts');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStart = () => {
    const token = extractToken(quizLink);
    if (!token) return;
    setSubmittingLink(true);
    navigate(`/quiz?token=${encodeURIComponent(token)}`);
  };

  const handleViewBreakdown = (attemptId: string) => {
    navigate(`/student/attempts/${encodeURIComponent(attemptId)}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="section-title">Welcome back, {user?.name}</h1>
        <p className="text-sm text-body-gray mt-1">
          Open a quiz link from your lecturer, or retry one of your previous attempts.
        </p>
      </div>

      {/* Take Quiz — the central hub */}
      <div className="surface-card p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-full bg-light-mint flex items-center justify-center">
            <FileQuestion className="w-5 h-5 text-positive" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-near-black">Take Quiz</h2>
            <p className="text-xs text-muted-gray">
              Open available quiz links and submit attempts.
            </p>
          </div>
        </div>

        {/* Open an available quiz link */}
        <div className="rounded-lg border border-chip-gray p-4 mb-5">
          <label
            htmlFor="quiz-link"
            className="block text-sm font-semibold text-near-black mb-2"
          >
            Open available quiz link
          </label>
          <p className="text-xs text-muted-gray mb-3">
            Paste a quiz link or share token from your lecturer. You must be signed
            in with your <span className="font-mono">@graduate.utm.my</span> Google
            account to submit.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="quiz-link"
              className="field text-sm flex-1"
              value={quizLink}
              onChange={(e) => setQuizLink(e.target.value)}
              placeholder="https://…/quiz?token=…  or  secj2203-3a4b1c2d"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleStart();
              }}
            />
            <button
              type="button"
              onClick={handleStart}
              disabled={!quizLink.trim() || submittingLink}
              className="pill-primary disabled:opacity-50 inline-flex items-center justify-center gap-1.5 sm:w-auto w-full"
            >
              <Send className="w-4 h-4" />
              Open quiz
            </button>
          </div>
        </div>

        {/* Recent activity / submit attempts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-near-black flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-body-gray" />
              Your recent attempts
            </h3>
            {attempts.length > 0 && (
              <span className="text-xs text-muted-gray">
                {attempts.length} total
              </span>
            )}
          </div>

          {loading ? (
            <PageLoading message="Loading your attempts..." />
          ) : error ? (
            <PageError error={error} />
          ) : attempts.length === 0 ? (
            <PageEmpty message="No quiz attempts yet. Paste a quiz link above to get started." />
          ) : (
            <ul className="space-y-2">
              {attempts.map((attempt) => (
                <li
                  key={attempt.id}
                  className="flex items-center justify-between gap-3 p-3.5 rounded-lg border border-chip-gray hover:border-hover-gray transition-colors bg-white"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-near-black truncate">
                      {attempt.courseTitle}
                    </p>
                    <p className="text-xs text-muted-gray mt-0.5">
                      {formatAttemptDate(attempt.submittedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-near-black">
                        {attempt.score}/{attempt.totalQuestions}
                      </p>
                      <p
                        className={`text-xs font-semibold ${
                          attempt.passed ? 'text-positive' : 'text-danger'
                        }`}
                      >
                        {attempt.percentage}% {attempt.passed ? 'Passed' : 'Failed'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleViewBreakdown(attempt.id)}
                      className="pill-secondary flex items-center gap-1 text-xs"
                      title="View detailed breakdown"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      View breakdown
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'Student') {
    return <StudentDashboard />;
  }

  const cards = cardSet(user?.role);

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Welcome back, {user?.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.path} className="surface-card card-hover p-6">
              <div className="w-12 h-12 rounded-full bg-chip-gray flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-near-black" />
              </div>
              <h3 className="text-xl font-bold text-near-black mb-1">{card.title}</h3>
              <p className="text-sm text-body-gray mb-4">{card.desc}</p>
              <Link to={card.path} className="pill-primary">
                {card.cta}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-8 surface-card p-6">
        <h3 className="text-lg font-bold text-near-black mb-2">Recent Activity</h3>
        <PageEmpty
          message="No activity yet. Start by uploading materials or creating a mini-course."
        />
      </div>
    </div>
  );
}
