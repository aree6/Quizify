import type { LoginCredentials, AuthResponse, User } from '../types';
import { supabase } from './supabase';

const VALID_ROLES = ['Lecturer', 'Admin', 'Student'] as const;
type Role = typeof VALID_ROLES[number];

const MOCK_USERS: Record<string, { password: string; user: User }> = {
  'lecturer@utm.my': {
    password: 'password123',
    user: { userId: '1', name: 'Dr. Ahmad', email: 'lecturer@utm.my', role: 'Lecturer' },
  },
  'admin@utm.my': {
    password: 'admin123',
    user: { userId: '2', name: 'Admin User', email: 'admin@utm.my', role: 'Admin' },
  },
  'student@utm.my': {
    password: 'student123',
    user: { userId: '3', name: 'Ali Student', email: 'student@utm.my', role: 'Student' },
  },
};

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
  const role = (params.supabaseMeta?.role && VALID_ROLES.includes(params.supabaseMeta.role as Role))
    ? (params.supabaseMeta.role as Role)
    : getSelectedRole();

  return {
    userId: params.userId,
    name: params.name,
    email: params.email,
    role,
  };
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      const mockUser = MOCK_USERS[credentials.email];
      if (!mockUser || mockUser.password !== credentials.password) {
        throw new Error('Invalid email or password');
      }
      const role = getSelectedRole();
      const user: User = {
        userId: mockUser.user.userId,
        name: mockUser.user.name,
        email: mockUser.user.email,
        role,
      };
      return {
        user,
        token: 'mock-token-' + Date.now(),
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw new Error(error.message);

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

    return {
      user,
      token: data.session.access_token,
    };
  }

  async loginWithGoogle(_opts?: { role?: Role }): Promise<AuthResponse> {
    const role = getSelectedRole();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
        queryParams: { role },
      },
    });
    return {
      user: { userId: '', name: 'Google User', email: '', role },
      token: '',
    };
  }

  async validateToken(token: string): Promise<User> {
    if (!isSupabaseConfigured()) {
      if (token.startsWith('mock-token-')) {
        const mockUser = MOCK_USERS['lecturer@utm.my'].user;
        const role = getSelectedRole();
        return { ...mockUser, role };
      }
      if (token.startsWith('dev-token-')) {
        const devUserStr = localStorage.getItem('devUser');
        if (devUserStr) {
          const devUser = JSON.parse(devUserStr) as User;
          if (devUser.role && VALID_ROLES.includes(devUser.role as Role)) {
            return devUser;
          }
          return { ...devUser, role: getSelectedRole() };
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

  async getCurrentUser(): Promise<User | null> {
    if (!isSupabaseConfigured()) return null;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    return buildUser({
      userId: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      supabaseMeta: {
        name: user.user_metadata?.name,
        email: user.email || '',
        role: user.user_metadata?.role,
      },
    });
  }
}

export const authService = new AuthService();
