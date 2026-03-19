import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  BookOpen,
  BarChart3,
  FileQuestion,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredItems = navItems.filter((item) => !item.roles || (user && item.roles.includes(user.role)));

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      <div className="px-6 py-5 border-b border-[#1f211d]">
        <h1 className="text-xl font-extrabold text-white">QUIZIFY</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `pulse-hover flex items-center gap-3 px-4 py-2.5 rounded-[999px] text-sm font-semibold ${
                  isActive ? 'bg-[#9fe870] text-[#163300]' : 'text-[#afafaf] bg-transparent'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#1f211d]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-[#1f211d] flex items-center justify-center">
            <User className="w-5 h-5 text-[#afafaf]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
            <p className="text-xs text-[#afafaf]">{user?.role}</p>
          </div>
        </div>

        <button type="button" onClick={handleLogout} className="pill-secondary w-full justify-center gap-2 !bg-[#efefef] !text-[#0e0f0c]">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="app-shell">
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#0e0f0c] flex items-center justify-between px-4 z-50">
        <button type="button" onClick={() => setSidebarOpen(true)} className="p-2 text-white rounded-full">
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-base font-extrabold text-white">QUIZIFY</h1>
        <div className="chip text-xs">{user?.role}</div>
      </header>

      <aside className="hidden lg:flex w-64 bg-[#0e0f0c] flex-col fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <button type="button" className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-[#0e0f0c] flex flex-col">
            <button type="button" onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 text-[#afafaf]">
              <X className="w-6 h-6" />
            </button>
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
