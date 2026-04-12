import { Link } from 'react-router-dom';
import { BarChart3, BookOpen, FileQuestion, FileText, PlusCircle, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardCard {
  title: string;
  desc: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  cta: string;
}

const ADMIN_CARDS: DashboardCard[] = [
  { title: 'Materials Library', desc: 'Manage course info and chapter slides.', path: '/materials', icon: FileText, cta: 'Open materials' },
  { title: 'Create Course', desc: 'Generate mini-courses from indexed materials.', path: '/create-course', icon: PlusCircle, cta: 'Create now' },
  { title: 'Analytics', desc: 'Review submissions and pass-rate trends.', path: '/analytics', icon: BarChart3, cta: 'View analytics' },
  { title: 'My Courses', desc: 'Share links and monitor readiness.', path: '/my-courses', icon: BookOpen, cta: 'Manage courses' },
];

const LECTURER_CARDS: DashboardCard[] = [
  { title: 'Materials Library', desc: 'Upload course info and chapter slide packs.', path: '/materials', icon: FileText, cta: 'Open materials' },
  { title: 'Create Course', desc: 'Generate lessons and quizzes by topic.', path: '/create-course', icon: PlusCircle, cta: 'Create now' },
  { title: 'My Courses', desc: 'Track generated courses and share URLs.', path: '/my-courses', icon: Users, cta: 'Manage courses' },
  { title: 'Analytics', desc: 'Review student scores and pass rates.', path: '/analytics', icon: BarChart3, cta: 'View analytics' },
];

const STUDENT_CARDS: DashboardCard[] = [
  { title: 'Take Quiz', desc: 'Open available quiz links and submit attempts.', path: '/quiz', icon: FileQuestion, cta: 'Start quiz' },
];

function cardSet(role?: 'Lecturer' | 'Admin' | 'Student') {
  if (role === 'Admin') return ADMIN_CARDS;
  if (role === 'Lecturer') return LECTURER_CARDS;
  return STUDENT_CARDS;
}

export function DashboardPage() {
  const { user } = useAuth();
  const cards = cardSet(user?.role);

  return (
    <div>
      <div className="mb-8">
        <h2 className="section-title">Welcome back, {user?.name}</h2>
        <p className="section-subtitle mt-2">Your workspace is tailored for the {user?.role} role.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.path} className="surface-card card-hover p-6">
              <div className="w-12 h-12 rounded-full bg-[#efefef] flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#0e0f0c]" />
              </div>
              <h3 className="text-xl font-bold text-[#0e0f0c] mb-1">{card.title}</h3>
              <p className="text-sm text-[#4b4b4b] mb-4">{card.desc}</p>
              <Link to={card.path} className="pill-primary">
                {card.cta}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-8 surface-card p-6">
        <h3 className="text-lg font-bold text-[#0e0f0c] mb-2">Recent Activity</h3>
        {user?.role === 'Student' ? (
          <p className="text-sm text-[#4b4b4b]">No attempts yet. Ask your lecturer for the latest quiz link.</p>
        ) : (
          <p className="text-sm text-[#4b4b4b]">No activity yet. Start by uploading materials or creating a mini-course.</p>
        )}
      </div>
    </div>
  );
}
