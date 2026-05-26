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

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
  absolute?: boolean;
}

const navItems: NavItem[] = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Lecturer', 'Admin', 'Student'] },
  { path: 'materials', label: 'Materials', icon: FileText, roles: ['Lecturer', 'Admin'] },
  { path: 'create-course', label: 'Create Course', icon: PlusCircle, roles: ['Lecturer'] },
  { path: 'my-courses', label: 'My Courses', icon: BookOpen, roles: ['Lecturer'] },
  { path: 'analytics', label: 'Analytics', icon: BarChart3, roles: ['Lecturer'] },
  { path: '/quiz', label: 'Take Quiz', icon: FileQuestion, roles: ['Student'], absolute: true },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = navItems
    .filter((item) => user && item.roles.includes(user.role))
    .map((item) => ({
      ...item,
      path: item.absolute ? item.path : `/${(user!.role).toLowerCase()}/${item.path}`,
    }));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell min-h-screen">
      <header className="sticky top-0 z-50 bg-white">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex items-center justify-center gap-1  overflow-x-auto pb-1 scrollbar-hide">
            <div className="shrink-0 sm:mr-4">
              <img src={logoSvg} alt="Quizify" className="h-6 w-6 sm:h-8 sm:w-8 scale-125" />
            </div>

            {links.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `shrink-0 flex flex-col items-center gap-0 px-1 py-3 sm:inline-flex sm:flex-row sm:items-center sm:gap-2 sm:px-3 sm:py-2 rounded-lg text-[8px] sm:text-sm font-semibold transition-colors ${
                      isActive
                        ? 'bg-light-mint text-dark-green'
                        : 'text-body-gray hover:text-near-black hover:bg-chip-gray'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
                  <span className="leading-tight">{item.label}</span>
                </NavLink>
              );
            })}

            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              className="shrink-0 flex flex-col items-center gap-0 px-1 py-3 sm:inline-flex sm:flex-row sm:items-center sm:gap-2 sm:px-3 sm:py-2 rounded-lg text-[8px] sm:text-sm font-semibold transition-colors text-body-gray hover:text-near-black hover:bg-chip-gray"
            >
              <LogOut className="w-5 h-5 sm:w-4 sm:h-4" />
              <span className="leading-tight">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto p-2">{children}</div>
      </main>
    </div>
  );
}
