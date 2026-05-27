import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, ExternalLink, FileQuestion, FileText, PlusCircle, Users } from 'lucide-react';
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

const STUDENT_CARDS: DashboardCard[] = [
  { title: 'Take Quiz', desc: 'Open available quiz links and submit attempts.', path: '/quiz', icon: FileQuestion, cta: 'Start quiz' },
];

function cardSet(role?: 'Lecturer' | 'Admin' | 'Student') {
  if (role === 'Admin') return ADMIN_CARDS;
  if (role === 'Lecturer') return LECTURER_CARDS;
  return STUDENT_CARDS;
}

function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quizLink, setQuizLink] = useState('');

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

  const extractToken = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return '';
    try {
      const url = new URL(trimmed);
      return url.searchParams.get('token') || trimmed;
    } catch {
      return trimmed;
    }
  };

  const handleStartQuiz = () => {
    const token = extractToken(quizLink);
    if (token) {
      navigate(`/quiz?token=${encodeURIComponent(token)}`);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="section-title">Welcome back, {user?.name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {STUDENT_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.path} className="surface-card card-hover p-6">
              <div className="w-12 h-12 rounded-full bg-chip-gray flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-near-black" />
              </div>
              <h3 className="text-xl font-bold text-near-black mb-1">{card.title}</h3>
              <p className="text-sm text-body-gray mb-4">{card.desc}</p>
              <div className="flex flex-col gap-2">
                <input
                  className="field text-sm"
                  value={quizLink}
                  onChange={(e) => setQuizLink(e.target.value)}
                  placeholder="Paste quiz link or token..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleStartQuiz();
                  }}
                />
                <button
                  type="button"
                  onClick={handleStartQuiz}
                  disabled={!quizLink.trim()}
                  className="pill-primary disabled:opacity-50"
                >
                  Start
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 surface-card p-6">
        <h3 className="text-lg font-bold text-near-black mb-4">Recent Activity</h3>
        {loading ? (
          <PageLoading message="Loading attempts..." />
        ) : error ? (
          <PageError error={error} />
        ) : attempts.length === 0 ? (
          <PageEmpty message="No quiz attempts yet. Paste a quiz link above to get started." />
        ) : (
          <div className="space-y-3">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between gap-3 p-4 rounded-lg border border-chip-gray hover:border-hover-gray transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-near-black truncate">
                    {attempt.courseTitle}
                  </p>
                  <p className="text-xs text-muted-gray mt-0.5">
                    {new Date(attempt.submittedAt).toLocaleDateString('en-MY', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-near-black">
                      {attempt.score}/{attempt.totalQuestions}
                    </p>
                    <p className={`text-xs font-semibold ${attempt.passed ? 'text-positive' : 'text-danger'}`}>
                      {attempt.percentage}% {attempt.passed ? 'Passed' : 'Failed'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/quiz?token=${encodeURIComponent(attempt.shareToken)}`)}
                    className="pill-secondary flex items-center gap-1 text-xs"
                    title="Retry quiz"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
