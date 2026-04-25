import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  BookOpen,
  BarChart3,
  FileQuestion,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import logoSvg from '../../assets/logo.svg';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Lecturer', 'Admin', 'Student'] },
  { path: '/materials', label: 'Materials', icon: FileText, roles: ['Lecturer', 'Admin'] },
  { path: '/create-course', label: 'Create Course', icon: PlusCircle, roles: ['Lecturer', 'Admin'] },
  { path: '/my-courses', label: 'My Courses', icon: BookOpen, roles: ['Lecturer', 'Admin'] },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['Lecturer', 'Admin'] },
  { path: '/quiz', label: 'Take Quiz', icon: FileQuestion, roles: ['Student'] },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = navItems.filter((item) => user && item.roles.includes(user.role));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-hide">
            <div className="shrink-0 mr-4">
              <img src={logoSvg} alt="Quizify" className="h-8 w-8" />
            </div>

            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-[999px] text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-[#e2f6d5] text-[#163300]'
                        : 'text-[#4b4b4b] hover:text-[#1c1d1a] hover:bg-[#efefef]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              className="shrink-0 ml-auto inline-flex items-center gap-2 px-3 py-2 rounded-[999px] text-sm font-semibold text-[#4b4b4b] hover:text-[#d03238] hover:bg-[#efefef] transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
