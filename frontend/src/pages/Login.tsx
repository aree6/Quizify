import { useState } from 'react';
import { GraduationCap, Shield, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSelectedRole, setSelectedRole } from '../services/auth';
import { PageError } from '../components/common/PageState';
import logoSvg from '../assets/logo.svg';

type UserRole = 'Lecturer' | 'Admin' | 'Student';

const ROLE_MOCK_USERS: Record<UserRole, { email: string; name: string }> = {
  Lecturer: { email: 'lecturer@utm.my', name: 'Dr. Ahmad' },
  Admin: { email: 'admin@utm.my', name: 'Admin User' },
  Student: { email: 'student@graduate.utm.my', name: 'Student' },
};

const ROLE_INFO: Record<UserRole, { label: string; icon: typeof GraduationCap; hint: string }> = {
  Lecturer: { label: 'Lecturer', icon: GraduationCap, hint: 'Sign in with your @utm.my email' },
  Admin: { label: 'Admin', icon: Shield, hint: 'Sign in with your @utm.my email' },
  Student: { label: 'Student', icon: User, hint: 'Sign in with your @graduate.utm.my email' },
};

export function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRoleState] = useState<UserRole>(
    () => (getSelectedRole() as UserRole) || 'Lecturer',
  );

  const roleInfo = ROLE_INFO[selectedRole];
  const RoleIcon = roleInfo.icon;

  const handleRoleChange = (role: UserRole) => {
    setSelectedRoleState(role);
    setSelectedRole(role);
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      await loginWithGoogle({ role: selectedRole });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
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
          <img src={logoSvg} alt="Quizify" className="h-16 w-16 mx-auto" />
          <p className="section-subtitle mt-3">Course materials into interactive learning</p>
        </div>

        <div className="surface-card p-6 sm:p-8">
          <div className="mb-6">
            <label className="block text-sm font-semibold text-near-black mb-2">I am a...</label>
            <div className="relative">
              <RoleIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-body-gray pointer-events-none" />
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
            <p className="text-xs text-muted-gray mt-2 ml-1">{roleInfo.hint}</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="pill-primary w-full"
          >
            {isLoading ? 'Redirecting...' : `Continue with Google as ${roleInfo.label}`}
          </button>

          {error && <PageError error={error} className="mt-4" />}
        </div>

        {import.meta.env.DEV && (
          <div className="ring-card mt-4 p-4">
            <p className="text-xs text-body-gray font-semibold mb-2 text-center">Development Quick Access</p>
            <button type="button" onClick={handleDevLogin} className="pill-secondary w-full">
              Continue as {selectedRole}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
