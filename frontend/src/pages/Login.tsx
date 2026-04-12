import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setSelectedRole, getSelectedRole } from '../services/auth';
import { Mail, Lock, GraduationCap, Shield, User } from 'lucide-react';

type UserRole = 'Lecturer' | 'Admin' | 'Student';

const ROLE_MOCK_USERS: Record<UserRole, { email: string; name: string }> = {
  Lecturer: { email: 'lecturer@utm.my', name: 'Dr. Ahmad' },
  Admin: { email: 'admin@utm.my', name: 'Admin User' },
  Student: { email: 'student@utm.my', name: 'Ali Student' },
};

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [selectedRole, setSelectedRoleLocal] = useState<UserRole>(() => {
    return (getSelectedRole() as UserRole) || 'Lecturer';
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setSelectedRoleLocal(role);
    setSelectedRole(role);
  };

  const handleLogin = async (email: string, password: string) => {
    try {
      setError('');
      setIsLoading(true);
      handleRoleChange(selectedRole);
      await login({ email, password, role: selectedRole });
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      handleRoleChange(selectedRole);
      await loginWithGoogle({ role: selectedRole });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = () => {
    const mockInfo = ROLE_MOCK_USERS[selectedRole];
    localStorage.setItem('devUser', JSON.stringify({
      userId: `dev-${selectedRole.toLowerCase()}-${Date.now()}`,
      name: mockInfo.name,
      email: mockInfo.email,
      role: selectedRole,
    }));
    localStorage.setItem('authToken', 'dev-token-' + Date.now());
    handleRoleChange(selectedRole);
    window.location.reload();
  };

  const roleIcons: Record<UserRole, typeof GraduationCap> = {
    Lecturer: GraduationCap,
    Admin: Shield,
    Student: User,
  };
  const RoleIcon = roleIcons[selectedRole];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">QUIZIFY</h1>
          <p className="text-slate-500">Course Materials to Interactive Quizzes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Login as:
            </label>
            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                className="w-full px-4 py-3 pl-10 border-2 border-slate-200 rounded-xl appearance-none bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
              >
                <option value="Lecturer">👨‍🏫 Lecturer</option>
                <option value="Admin">👨‍💻 Admin</option>
                <option value="Student">👨‍🎓 Student</option>
              </select>
              <RoleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <button
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border-2 border-slate-200 rounded-xl font-medium text-slate-700 disabled:opacity-50 mb-4"
            onClick={handleGoogleLogin}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google as {selectedRole}
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-slate-400 text-sm">or</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const email = (form.elements.namedItem('email') as HTMLInputElement).value;
              const password = (form.elements.namedItem('password') as HTMLInputElement).value;
              handleLogin(email, password);
            }}
            className="space-y-4"
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                className="w-full pl-10 pr-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-xl font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Demo: lecturer@utm.my / password123
          </p>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm text-center">
              {error}
            </div>
          )}
        </div>

        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-amber-800 text-sm font-medium mb-3 text-center">
            Development Mode — Quick Access
          </p>
          <button
            onClick={handleDevLogin}
            className="w-full py-2.5 px-4 bg-amber-500 text-white rounded-lg font-medium"
          >
            Continue as {selectedRole}
          </button>
        </div>
      </div>
    </div>
  );
}
