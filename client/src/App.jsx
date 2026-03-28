import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }             from './context/AuthContext';
import { ThemeProvider }                     from './context/ThemeContext';
import { NotificationProvider }              from './context/NotificationContext';
import ToastContainer                        from './components/ui/Toast';

import Layout          from './components/layout/Layout';
import Landing         from './pages/Landing';
import Login           from './pages/Login';
import Signup          from './pages/Signup';
import Onboarding      from './pages/Onboarding';
import Dashboard       from './pages/Dashboard';
import Workouts        from './pages/Workouts';
import WorkoutSession  from './pages/WorkoutSession';
import WorkoutHistory  from './pages/WorkoutHistory';
import Exercises       from './pages/Exercises';
import Nutrition       from './pages/Nutrition';
import MealPlans       from './pages/MealPlans';
import Habits          from './pages/Habits';
import Progress        from './pages/Progress';
import CalendarPage    from './pages/CalendarPage';
import WeeklySchedule  from './pages/WeeklySchedule';
import Achievements    from './pages/Achievements';
import Notes           from './pages/Notes';
import Settings        from './pages/Settings';
import Export from './pages/Export';
import Reviews from './pages/Reviews';

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gray-50 dark:bg-gray-950">
      <div className="w-8 h-8 border-2 border-brand-500
                      border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.onboarding_complete && !user.onboardingComplete)
    return <Navigate to="/onboarding" replace />;
  return children;
}

function OnboardRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"       element={<Landing />} />
      <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
      <Route path="/onboarding"
        element={<OnboardRoute><Onboarding /></OnboardRoute>} />
      <Route path="/reviews" element={<Reviews />} />

      <Route element={<Layout />}>
        <Route path="/export"
        element={<PrivateRoute><Export /></PrivateRoute>} />
        <Route path="/dashboard"
          element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/workouts"
          element={<PrivateRoute><Workouts /></PrivateRoute>} />
        <Route path="/session/:workoutId"
          element={<PrivateRoute><WorkoutSession /></PrivateRoute>} />
        <Route path="/history"
          element={<PrivateRoute><WorkoutHistory /></PrivateRoute>} />
        <Route path="/exercises"
          element={<PrivateRoute><Exercises /></PrivateRoute>} />
        <Route path="/nutrition"
          element={<PrivateRoute><Nutrition /></PrivateRoute>} />
        <Route path="/meal-plans"
          element={<PrivateRoute><MealPlans /></PrivateRoute>} />
        <Route path="/habits"
          element={<PrivateRoute><Habits /></PrivateRoute>} />
        <Route path="/progress"
          element={<PrivateRoute><Progress /></PrivateRoute>} />
        <Route path="/schedule"
          element={<PrivateRoute><WeeklySchedule /></PrivateRoute>} />
        <Route path="/calendar"
          element={<PrivateRoute><CalendarPage /></PrivateRoute>} />
        <Route path="/achievements"
          element={<PrivateRoute><Achievements /></PrivateRoute>} />
        <Route path="/notes"
          element={<PrivateRoute><Notes /></PrivateRoute>} />
        <Route path="/settings"
          element={<PrivateRoute><Settings /></PrivateRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <AppRoutes />
            <ToastContainer />
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}