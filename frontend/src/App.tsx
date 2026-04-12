import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { MaterialsPage } from './pages/Materials';
import { CreateCoursePage } from './pages/CreateCourse';
import { MyCoursesPage } from './pages/MyCourses';
import { AnalyticsPage } from './pages/Analytics';
import { QuizPage } from './pages/Quiz';
import { Layout } from './components/common/Layout';
import { RequireRole } from './components/auth/RequireRole';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }
  
  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <LoginPage />} 
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <RequireRole roles={['Lecturer', 'Admin', 'Student']} fallback={<Navigate to="/login" />}>
              <Layout>
                <DashboardPage />
              </Layout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/materials"
        element={
          <ProtectedRoute>
            <RequireRole roles={['Lecturer', 'Admin']} fallback={<Navigate to="/dashboard" />}>
              <Layout>
                <MaterialsPage />
              </Layout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-course"
        element={
          <ProtectedRoute>
            <RequireRole roles={['Lecturer', 'Admin']} fallback={<Navigate to="/dashboard" />}>
              <Layout>
                <CreateCoursePage />
              </Layout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-courses"
        element={
          <ProtectedRoute>
            <RequireRole roles={['Lecturer', 'Admin']} fallback={<Navigate to="/dashboard" />}>
              <Layout>
                <MyCoursesPage />
              </Layout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <RequireRole roles={['Lecturer', 'Admin']} fallback={<Navigate to="/dashboard" />}>
              <Layout>
                <AnalyticsPage />
              </Layout>
            </RequireRole>
          </ProtectedRoute>
        }
      />
      <Route path="/quiz" element={<QuizPage />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
