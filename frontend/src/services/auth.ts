import type { AuthResponse, User, RoleSelection } from '../types';
import { supabase } from './supabase';

export type Role = 'Lecturer' | 'Admin' | 'Student';
export type { RoleSelection };

/** Emails that are unconditionally granted the Admin role on sign-in. */
export const ADMIN_EMAILS: ReadonlySet<string> = new Set(
  ['Mohammadareeb34@gmail.com'].map((s) => s.toLowerCase()),
);

/** Emails that are unconditionally granted the Lecturer role on sign-in
 *  (used to simulate the lecturer flow with a personal Gmail). */
export const LECTURER_OVERRIDE_EMAILS: ReadonlySet<string> = new Set(
  ['Mohammadareeb34@gmail.com', 'mohammadar336@gmail.com'].map((s) => s.toLowerCase()),
);

const ROLE_VALUES: readonly RoleSelection[] = ['Auto', 'Lecturer', 'Admin', 'Student'] as const;
export const DEFAULT_ROLE_SELECTION: RoleSelection = 'Auto';

const isSupabaseConfigured = () => {
  return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
};

export function getSelectedRole(): RoleSelection {
  const stored = localStorage.getItem('selectedRole');
  if (stored && (ROLE_VALUES as readonly string[]).includes(stored)) {
    return stored as RoleSelection;
  }
  return DEFAULT_ROLE_SELECTION;
}

export function setSelectedRole(role: RoleSelection): void {
  localStorage.setItem('selectedRole', role);
}

export function clearSelectedRole(): void {
  localStorage.removeItem('selectedRole');
}

const RETURN_URL_STORAGE_KEY = 'loginReturnUrl';

/** Capture the URL the user was trying to reach before being bounced to /login. */
export function setReturnUrl(path: string): void {
  if (!path || path.startsWith('/login')) return;
  try {
    sessionStorage.setItem(RETURN_URL_STORAGE_KEY, path);
  } catch {
    // sessionStorage unavailable (Safari private mode); ignore.
  }
}

export function getReturnUrl(): string | null {
  try {
    return sessionStorage.getItem(RETURN_URL_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function clearReturnUrl(): void {
  try {
    sessionStorage.removeItem(RETURN_URL_STORAGE_KEY);
  } catch {
    // ignore
  }
}

function deriveNameFromEmail(email: string): string {
  const prefix = email.split('@')[0];
  if (!prefix) return 'User';
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

export interface ResolveRoleResult {
  role: Role;
  /** True when the user picked a role that didn't apply to their email,
   *  and we silently fell back to a safe default. The UI can show a warning. */
  overrideRejected: boolean;
}

/**
 * Resolve the user role from email + the dropdown selection.
 *
 * Order:
 *   1. Email in ADMIN_EMAILS            -> 'Admin' (always)
 *   2. Email in LECTURER_OVERRIDE_EMAILS -> 'Lecturer' (always)
 *   3. Manual override:
 *        - 'Admin'   + email not in ADMIN_EMAILS             -> fallback to 'Student' + warning
 *        - 'Lecturer'+ email not in LECTURER_OVERRIDE_EMAILS
 *                       and not @utm.my                       -> fallback to 'Student' + warning
 *        - 'Lecturer'+ @utm.my email                          -> 'Lecturer'
 *        - 'Student'                                         -> 'Student'
 *   4. Auto mode (default):
 *        - @graduate.utm.my -> 'Student'
 *        - @utm.my          -> 'Lecturer'
 *        - anything else    -> 'Student'  ("all others are students")
 */
export function resolveRole(email: string, selected: RoleSelection = getSelectedRole()): ResolveRoleResult {
  const lower = (email || '').toLowerCase();

  if (ADMIN_EMAILS.has(lower)) {
    return { role: 'Admin', overrideRejected: false };
  }
  if (LECTURER_OVERRIDE_EMAILS.has(lower)) {
    return { role: 'Lecturer', overrideRejected: false };
  }

  if (selected === 'Admin') {
    return { role: 'Student', overrideRejected: true };
  }
  if (selected === 'Lecturer') {
    if (lower.endsWith('@utm.my')) return { role: 'Lecturer', overrideRejected: false };
    return { role: 'Student', overrideRejected: true };
  }
  if (selected === 'Student') {
    return { role: 'Student', overrideRejected: false };
  }

  // Auto mode
  if (lower.endsWith('@graduate.utm.my')) return { role: 'Student', overrideRejected: false };
  if (lower.endsWith('@utm.my')) return { role: 'Lecturer', overrideRejected: false };
  return { role: 'Student', overrideRejected: false };
}

function resolveName(supabaseName: string | undefined | null, email: string): string {
  if (supabaseName && supabaseName.trim().length > 0) return supabaseName.trim();
  return deriveNameFromEmail(email);
}

function buildUser(params: {
  userId: string;
  name: string;
  email: string;
  supabaseMeta?: {
    name?: string;
    email?: string;
    role?: string;
  };
}): User {
  const email = params.supabaseMeta?.email || params.email;
  const { role } = resolveRole(email);
  const name = resolveName(params.supabaseMeta?.name, email);

  return {
    userId: params.userId,
    name: name || params.name || deriveNameFromEmail(email),
    email,
    role,
  };
}

class AuthService {
  // The opts.role parameter is accepted for backward compatibility with
  // callers that pass it (e.g. LoginPage). The actual role is derived from
  // the email at validateToken time, so we don't need it here.
  async loginWithGoogle(_opts?: { role?: RoleSelection }): Promise<AuthResponse> {
    const selected = getSelectedRole();
    // Note: we intentionally redirect to /dashboard; the AuthContext
    // will read any stored returnUrl after the session becomes valid
    // and navigate there. (Redirecting the OAuth callback directly to
    // /quiz?token=... would bypass the role-based routing in App.tsx.)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    // The temporary user is shown only while the OAuth round-trip is in
    // flight; its role is informational. We never persist it.
    const tempRole: Role =
      selected === 'Admin' || selected === 'Lecturer' || selected === 'Student'
        ? selected
        : 'Student';
    return {
      user: { userId: '', name: 'Signing in...', email: '', role: tempRole },
      token: '',
    };
  }

  async validateToken(token: string): Promise<User> {
    if (!isSupabaseConfigured()) {
      if (token.startsWith('dev-token-')) {
        const devUserStr = localStorage.getItem('devUser');
        if (devUserStr) {
          const devUser = JSON.parse(devUserStr) as User;
          if (devUser.email) {
            const { role } = resolveRole(devUser.email);
            const name = resolveName(devUser.name, devUser.email);
            return { ...devUser, role, name };
          }
          return devUser;
        }
      }
      throw new Error('Invalid token');
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw new Error('Invalid token');

    const user = buildUser({
      userId: data.user.id,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
      email: data.user.email || '',
      supabaseMeta: {
        name: data.user.user_metadata?.name,
        email: data.user.email || '',
        role: data.user.user_metadata?.role,
      },
    });

    return user;
  }

  async logout(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    await supabase.auth.signOut();
  }
}

export const authService = new AuthService();
