import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GraduationCap, Shield, User, Wand2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  DEFAULT_ROLE_SELECTION,
  getSelectedRole,
  resolveRole,
  setReturnUrl,
  setSelectedRole,
  type RoleSelection,
} from '../services/auth';
import { PageError } from '../components/common/PageState';
import logoSvg from '../assets/logo.svg';

interface RoleOption {
  value: RoleSelection;
  label: string;
  icon: typeof GraduationCap;
  hint: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    value: 'Auto',
    label: 'Auto-detect (recommended)',
    icon: Wand2,
    hint: "We'll detect your role from your email: @graduate.utm.my → Student, @utm.my → Lecturer.",
  },
  {
    value: 'Lecturer',
    label: 'Lecturer',
    icon: GraduationCap,
    hint: 'Manual override. Works with @utm.my or a developer account.',
  },
  {
    value: 'Admin',
    label: 'Admin',
    icon: Shield,
    hint: 'Manual override. Only enabled for whitelisted emails.',
  },
  {
    value: 'Student',
    label: 'Student',
    icon: User,
    hint: 'Manual override. Works with any email.',
  },
];

const ROLE_OPTION_MAP: Record<RoleSelection, RoleOption> = ROLE_OPTIONS.reduce(
  (acc, o) => {
    acc[o.value] = o;
    return acc;
  },
  {} as Record<RoleSelection, RoleOption>,
);

export function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRoleState] = useState<RoleSelection>(
    () => getSelectedRole() || DEFAULT_ROLE_SELECTION,
  );

  const roleInfo = ROLE_OPTION_MAP[selectedRole];
  const RoleIcon = roleInfo.icon;

  const handleRoleChange = (role: RoleSelection) => {
    setSelectedRoleState(role);
    setSelectedRole(role);
  };

  const handleGoogleLogin = async () => {
    try {
      setError('');
      setIsLoading(true);
      // Capture the post-login destination BEFORE the OAuth redirect, so the
      // user is returned to the page they were trying to reach.
      const returnUrl = searchParams.get('return');
      if (returnUrl) {
        setReturnUrl(returnUrl);
      }
      await loginWithGoogle({ role: selectedRole });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDevLogin = () => {
    // For the dev quick-access button, we still need a concrete email so the
    // role resolver can be exercised. Use a representative mock per role.
    const mockEmail =
      selectedRole === 'Admin' ? 'Mohammadareeb34@gmail.com'
      : selectedRole === 'Lecturer' ? 'lecturer@utm.my'
      : selectedRole === 'Student' ? 'student@graduate.utm.my'
      : 'student@graduate.utm.my'; // Auto -> default to a student mock

    const { role } = resolveRole(mockEmail, selectedRole);
    const displayName = mockEmail.split('@')[0];

    localStorage.setItem(
      'devUser',
      JSON.stringify({
        userId: `dev-${role.toLowerCase()}-${Date.now()}`,
        name: displayName,
        email: mockEmail,
        role,
      }),
    );
    localStorage.setItem('authToken', `dev-token-${Date.now()}`);
    handleRoleChange(selectedRole);

    // Honour a returnUrl in dev too, so the developer can test the full flow.
    const returnUrl = searchParams.get('return');
    if (returnUrl) {
      navigate(returnUrl);
    } else {
      navigate(`/${role.toLowerCase()}/dashboard`);
    }
  };

  const isAuto = selectedRole === 'Auto';
  const showManualWarning =
    !isAuto && (selectedRole === 'Admin' || selectedRole === 'Lecturer');

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex items-center justify-center">
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
                onChange={(event) => handleRoleChange(event.target.value as RoleSelection)}
                className="field pl-10 !rounded-[999px]"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-gray mt-2 ml-1">{roleInfo.hint}</p>

            {showManualWarning && (
              <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  {selectedRole === 'Admin'
                    ? 'Admin override is only honoured for whitelisted emails. Other accounts will be treated as Student.'
                    : 'Lecturer override only works with @utm.my accounts or a whitelisted developer email. Personal Gmail accounts will be treated as Student.'}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="pill-primary w-full"
          >
            {isLoading
              ? 'Redirecting...'
              : isAuto
                ? 'Continue with Google'
                : `Continue with Google as ${roleInfo.label}`}
          </button>

          {error && <PageError error={error} className="mt-4" />}
        </div>

        {import.meta.env.DEV && (
          <div className="ring-card mt-4 p-4">
            <p className="text-xs text-body-gray font-semibold mb-2 text-center">Development Quick Access</p>
            <button type="button" onClick={handleDevLogin} className="pill-secondary w-full">
              {isAuto
                ? 'Continue as Auto (default dev account)'
                : `Continue as ${roleInfo.label}`}
            </button>
            <p className="text-[10px] text-muted-gray text-center mt-2">
              Dev only — bypasses Google OAuth.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
