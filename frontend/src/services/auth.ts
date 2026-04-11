import type { LoginCredentials, AuthResponse, User } from '../types';
import { supabase } from './supabase';

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

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (!isSupabaseConfigured()) {
      const mockUser = MOCK_USERS[credentials.email];
      if (!mockUser || mockUser.password !== credentials.password) {
        throw new Error('Invalid email or password');
      }
      return {
        user: mockUser.user,
        token: 'mock-token-' + Date.now(),
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) throw new Error(error.message);

    const user: User = {
      userId: data.user.id,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
      email: data.user.email || '',
      role: 'Lecturer',
    };

    return {
      user,
      token: data.session.access_token,
    };
  }

  async loginWithGoogle(): Promise<AuthResponse> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard',
      },
    });

    if (error) throw new Error(error.message);
    
    return {
      user: { userId: '', name: 'Google User', email: '', role: 'Lecturer' },
      token: '',
    };
  }

  async validateToken(token: string): Promise<User> {
    if (!isSupabaseConfigured()) {
      if (token.startsWith('mock-token-')) {
        return MOCK_USERS['lecturer@utm.my'].user;
      }
      if (token.startsWith('dev-token-')) {
        const devUser = localStorage.getItem('devUser');
        if (devUser) {
          return JSON.parse(devUser);
        }
      }
      throw new Error('Invalid token');
    }

    const { data, error } = await supabase.auth.getUser(token);

    if (error) throw new Error('Invalid token');

    const user: User = {
      userId: data.user.id,
      name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
      email: data.user.email || '',
      role: 'Lecturer',
    };

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

    return {
      userId: user.id,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
      email: user.email || '',
      role: 'Lecturer',
    };
  }
}

export const authService = new AuthService();