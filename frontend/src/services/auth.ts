import type { AuthResponse, User } from '../types';
import { supabase } from './supabase';

const VALID_ROLES = ['Lecturer', 'Admin', 'Student'] as const;
type Role = typeof VALID_ROLES[number];

const isSupabaseConfigured = () => {
  return import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;
};

export function getSelectedRole(): Role {
  const stored = localStorage.getItem('selectedRole');
  if (stored && VALID_ROLES.includes(stored as Role)) {
    return stored as Role;
  }
  return 'Lecturer';
}

export function setSelectedRole(role: Role): void {
  localStorage.setItem('selectedRole', role);
}

export function clearSelectedRole(): void {
  localStorage.removeItem('selectedRole');
}

function deriveNameFromEmail(email: string): string {
  const prefix = email.split('@')[0];
  if (!prefix) return 'User';
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}

function resolveRole(email: string): Role {
  if (email.endsWith('@graduate.utm.my')) {
    return 'Student';
  }
  if (email.endsWith('@utm.my')) {
    const selected = getSelectedRole();
    if (selected === 'Admin' || selected === 'Lecturer') return selected;
    return 'Lecturer';
  }
  return getSelectedRole();
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
  const role = resolveRole(email);
  const name = resolveName(params.supabaseMeta?.name, email);

  return {
    userId: params.userId,
    name: name || params.name || deriveNameFromEmail(email),
    email,
    role,
  };
}

class AuthService {
  async loginWithGoogle(_opts?: { role?: Role }): Promise<AuthResponse> {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    return {
      user: { userId: '', name: 'Signing in...', email: '', role: getSelectedRole() },
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
            const role = resolveRole(devUser.email);
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
