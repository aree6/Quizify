import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { BookOpen, Users, FileText, BarChart3, GraduationCap } from 'lucide-react';

export function DashboardPage() {
  const { user } = useAuth();

  const adminCards = [
    { icon: FileText, title: 'Materials', desc: 'Upload and manage course materials', path: '/materials', color: 'bg-blue-500' },
  ];

  const lecturerCards = [
    { icon: BookOpen, title: 'Create Course', desc: 'Generate a new mini-course with quiz', path: '/create-course', color: 'bg-green-500' },
    { icon: Users, title: 'My Courses', desc: 'View and manage your mini-courses', path: '/my-courses', color: 'bg-purple-500' },
    { icon: BarChart3, title: 'Analytics', desc: 'View student quiz results', path: '/analytics', color: 'bg-orange-500' },
  ];

  const studentCards = [
    { icon: GraduationCap, title: 'Available Quizzes', desc: 'View and attempt quizzes', path: '/quiz', color: 'bg-teal-500' },
  ];

  const getCards = () => {
    if (user?.role === 'Admin') return [...adminCards, ...lecturerCards];
    if (user?.role === 'Lecturer') return lecturerCards;
    return studentCards;
  };

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}!</h2>
        <p className="text-slate-500 mt-1">What would you like to do today?</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {getCards().map((card) => {
          const Icon = card.icon;
          return (
            <Link 
              key={card.path} 
              to={card.path}
              className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
            >
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {card.title}
              </h3>
              <p className="text-slate-400 text-sm mt-1">{card.desc}</p>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 text-center">
          <p className="text-slate-500">No recent activity yet. Create your first mini-course!</p>
        </div>
      </div>
    </div>
  );
}