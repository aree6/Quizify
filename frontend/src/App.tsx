import { BrowserRouter, Routes, Route, Navigate, useParams, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/common/Toast';
import { LoginPage } from './pages/Login';
import { DashboardPage } from './pages/Dashboard';
import { AttemptDetailPage } from './pages/AttemptDetail';
import { MaterialsPage } from './pages/Materials';
import { CreateCoursePage } from './pages/CreateCourse';
import { MyCoursesPage } from './pages/MyCourses';
import { AnalyticsPage } from './pages/Analytics';
import { QuizPage } from './pages/Quiz';
import { Layout } from './components/common/Layout';
import { RequireRole } from './components/auth/RequireRole';

function RoleRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} />;
}

function RoleLayout() {
  const { role } = useParams();
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" />;
  }

  if (role?.toLowerCase() !== user.role.toLowerCase()) {
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard`} />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
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
        element={isAuthenticated ? <RoleRedirect /> : <LoginPage />}
      />

      <Route path="/quiz" element={<QuizPage />} />

      <Route path="/" element={<RoleRedirect />} />
      <Route path="/dashboard" element={<RoleRedirect />} />

      <Route path="/:role" element={<RoleLayout />}>
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="attempts/:attemptId" element={<AttemptDetailPage />} />
        <Route
          path="materials"
          element={
            <RequireRole roles={['Lecturer', 'Admin']}>
              <MaterialsPage />
            </RequireRole>
          }
        />
        <Route
          path="create-course"
          element={
            <RequireRole roles={['Lecturer']}>
              <CreateCoursePage />
            </RequireRole>
          }
        />
        <Route
          path="my-courses"
          element={
            <RequireRole roles={['Lecturer']}>
              <MyCoursesPage />
            </RequireRole>
          }
        />
        <Route
          path="analytics"
          element={
            <RequireRole roles={['Lecturer']}>
              <AnalyticsPage />
            </RequireRole>
          }
        />
      </Route>

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
