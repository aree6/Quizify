import { useAuth } from '../../context/AuthContext';

type Role = 'Lecturer' | 'Admin' | 'Student';

interface RequireRoleProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen text-slate-500">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <>{fallback}</>;
  }

  if (!roles.includes(user.role as Role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function useRole() {
  const { user } = useAuth();
  return {
    isLecturer: user?.role === 'Lecturer',
    isAdmin: user?.role === 'Admin',
    isStudent: user?.role === 'Student',
    role: user?.role || null,
  };
}