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
  User
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Lecturer', 'Admin', 'Student'] },
  { path: '/materials', label: 'Materials', icon: FileText, roles: ['Admin'] },
  { path: '/create-course', label: 'Create Course', icon: PlusCircle, roles: ['Lecturer', 'Admin'] },
  { path: '/my-courses', label: 'My Courses', icon: BookOpen, roles: ['Lecturer', 'Admin'] },
  { path: '/analytics', label: 'Analytics', icon: BarChart3, roles: ['Lecturer', 'Admin'] },
  { path: '/quiz', label: 'Take Quiz', icon: FileQuestion, roles: ['Student'] },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filteredItems = navItems.filter(item => 
    !item.roles || (user && item.roles.includes(user.role))
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const SidebarContent = ({ onClose }: { onClose?: () => void }) => (
    <>
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-blue-400">QUIZIFY</h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        {filteredItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => 
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-400'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
            <User className="w-5 h-5 text-slate-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-4 py-2 text-slate-400 rounded-lg"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 flex items-center justify-between px-4 z-50">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-white"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg font-bold text-blue-400">QUIZIFY</h1>
        <div className="w-10" />
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-col fixed inset-y-0 left-0 z-40">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setSidebarOpen(false)} 
          />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-900 flex flex-col">
            <button 
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400"
            >
              <X className="w-6 h-6" />
            </button>
            <SidebarContent onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}