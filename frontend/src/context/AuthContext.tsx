import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthState, LoginCredentials, User } from '../types';
import { authService } from '../services/auth';
import { supabase } from '../services/supabase';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    const initAuth = async () => {
      // Check for dev token first
      const token = localStorage.getItem('authToken');
      if (token && token.startsWith('dev-token-')) {
        const devUser = getDevUser();
        if (devUser) {
          setState({ user: devUser, isAuthenticated: true, isLoading: false });
          return;
        }
      }

      // Check Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        try {
          const user = await authService.validateToken(session.access_token);
          setState({ user, isAuthenticated: true, isLoading: false });
        } catch {
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        setState({ user: null, isAuthenticated: false, isLoading: false });
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        authService.validateToken(session.access_token)
          .then((user) => {
            localStorage.setItem('authToken', session.access_token);
            setState({ user, isAuthenticated: true, isLoading: false });
          });
      } else {
        const token = localStorage.getItem('authToken');
        if (!token?.startsWith('dev-token-')) {
          localStorage.removeItem('authToken');
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    localStorage.setItem('authToken', response.token);
    setState({ user: response.user, isAuthenticated: true, isLoading: false });
  };

  const loginWithGoogle = async () => {
    const response = await authService.loginWithGoogle();
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      setState({ user: response.user, isAuthenticated: true, isLoading: false });
    }
  };

  const logout = async () => {
    await authService.logout();
    localStorage.removeItem('authToken');
    localStorage.removeItem('devUser');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, loginWithGoogle, logout }}>
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