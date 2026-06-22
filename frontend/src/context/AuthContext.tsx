import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AuthState, RoleSelection, User } from '../types';
import {
  authService,
  clearReturnUrl,
  clearSelectedRole,
  getReturnUrl,
} from '../services/auth';
import { supabase } from '../services/supabase';

interface AuthContextType extends AuthState {
  loginWithGoogle: (opts?: { role?: RoleSelection }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getDevUser(): User | null {
  const devUserStr = localStorage.getItem('devUser');
  if (devUserStr) {
    try {
      return JSON.parse(devUserStr);
    } catch {
      return null;
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Track the most recent authenticated user so we only honor a returnUrl
  // once per login cycle (not on every re-render).
  const lastHandledUserId = useRef<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('authToken');

      if (token?.startsWith('dev-token-')) {
        const devUser = getDevUser();
        if (devUser) {
          setState({ user: devUser, isAuthenticated: true, isLoading: false });
          return;
        }
      }

      if (token?.startsWith('mock-token-')) {
        try {
          const user = await authService.validateToken(token);
          setState({ user, isAuthenticated: true, isLoading: false });
          return;
        } catch {
          setState({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        try {
          const user = await authService.validateToken(session.access_token);
          localStorage.setItem('authToken', session.access_token);
          setState({ user, isAuthenticated: true, isLoading: false });
        } catch {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        try {
          const user = await authService.validateToken(session.access_token);
          localStorage.setItem('authToken', session.access_token);
          setState({ user, isAuthenticated: true, isLoading: false });
        } catch {
          localStorage.removeItem('authToken');
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        const token = localStorage.getItem('authToken');
        if (!token?.startsWith('dev-token-') && !token?.startsWith('mock-token-')) {
          localStorage.removeItem('authToken');
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // After auth becomes established for a NEW user, honor any stored returnUrl.
  // This runs the navigate() AFTER the role-based routing has had a chance to
  // put the user on /dashboard, so the role guard sees a valid session.
  useEffect(() => {
    if (state.isLoading) return;
    if (!state.user) return;
    if (lastHandledUserId.current === state.user.userId) return;
    lastHandledUserId.current = state.user.userId;

    const returnUrl = getReturnUrl();
    if (returnUrl) {
      clearReturnUrl();
      // Defer one tick so the role-based route mounts first.
      const t = setTimeout(() => navigate(returnUrl, { replace: true }), 50);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [state.user, state.isLoading, navigate]);

  const loginWithGoogle = async (opts?: { role?: RoleSelection }) => {
    const response = await authService.loginWithGoogle(opts);
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      setState({ user: response.user, isAuthenticated: true, isLoading: false });
    }
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('authToken');
    localStorage.removeItem('devUser');
    clearSelectedRole();
    clearReturnUrl();
    lastHandledUserId.current = null;
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
