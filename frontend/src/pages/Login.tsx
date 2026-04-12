import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, GraduationCap, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSelectedRole, setSelectedRole } from '../services/auth';

type UserRole = 'Lecturer' | 'Admin' | 'Student';

const ROLE_MOCK_USERS: Record<UserRole, { email: string; name: string }> = {
  Lecturer: { email: 'lecturer@utm.my', name: 'Dr. Ahmad' },
  Admin: { email: 'admin@utm.my', name: 'Admin User' },
  Student: { email: 'student@utm.my', name: 'Ali Student' },
};

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRoleLocal] = useState<UserRole>(() => (getSelectedRole() as UserRole) || 'Lecturer');

  const roleIcons: Record<UserRole, typeof GraduationCap> = {
    Lecturer: GraduationCap,
    Admin: Shield,
    Student: User,
  };

  const RoleIcon = roleIcons[selectedRole];

  const handleRoleChange = (role: UserRole) => {
    setSelectedRoleLocal(role);
    setSelectedRole(role);
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

  const handlePasswordLogin = async (email: string, password: string) => {
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

  const handleDevLogin = () => {
    const info = ROLE_MOCK_USERS[selectedRole];
    localStorage.setItem(
      'devUser',
      JSON.stringify({
        userId: `dev-${selectedRole.toLowerCase()}-${Date.now()}`,
        name: info.name,
        email: info.email,
        role: selectedRole,
      }),
    );
    localStorage.setItem('authToken', `dev-token-${Date.now()}`);
    handleRoleChange(selectedRole);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="display-title">QUIZIFY</h1>
          <p className="section-subtitle mt-3">Course materials into interactive learning</p>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#0e0f0c] mb-2">Login role</label>
            <div className="relative">
              <RoleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4b4b4b] pointer-events-none" />
              <select
                value={selectedRole}
                onChange={(event) => handleRoleChange(event.target.value as UserRole)}
                className="field pl-10 !rounded-[999px]"
              >
                <option value="Lecturer">Lecturer</option>
                <option value="Admin">Admin</option>
                <option value="Student">Student</option>
              </select>
            </div>
          </div>

          <button type="button" onClick={handleGoogleLogin} disabled={isLoading} className="pill-primary w-full mb-4">
            Continue with Google as {selectedRole}
          </button>

          <div className="flex items-center gap-3 my-5">
            <div className="h-px bg-[#efefef] flex-1" />
            <span className="text-xs text-[#afafaf]">or</span>
            <div className="h-px bg-[#efefef] flex-1" />
          </div>

          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = event.currentTarget;
              const email = (form.elements.namedItem('email') as HTMLInputElement).value;
              const password = (form.elements.namedItem('password') as HTMLInputElement).value;
              handlePasswordLogin(email, password);
            }}
          >
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b4b4b]" />
              <input name="email" type="email" required placeholder="Email" className="field pl-10" />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4b4b4b]" />
              <input name="password" type="password" required placeholder="Password" className="field pl-10" />
            </div>

            <button type="submit" disabled={isLoading} className="pill-dark w-full">
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="text-xs text-[#afafaf] mt-5 text-center">Demo: lecturer@utm.my / password123</p>

          {error && <div className="mt-4 p-3 rounded-[8px] bg-[#ffe5e7] text-[#d03238] text-sm">{error}</div>}
        </div>

        <div className="ring-card mt-4 p-4">
          <p className="text-xs text-[#4b4b4b] font-semibold mb-2 text-center">Development Quick Access</p>
          <button type="button" onClick={handleDevLogin} className="pill-secondary w-full">
            Continue as {selectedRole}
          </button>
        </div>
      </div>
    </div>
  );
}
