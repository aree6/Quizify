import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

type Role = 'Lecturer' | 'Admin' | 'Student';

interface RequireRoleProps {
  roles: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({ roles, children, fallback }: RequireRoleProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (!roles.includes(user.role as Role)) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} />;
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
