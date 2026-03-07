export interface User {
  userId: string;
  name: string;
  email: string;
  role: 'Lecturer' | 'Admin' | 'Student';
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}