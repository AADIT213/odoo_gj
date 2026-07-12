import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthGuard from './components/AuthGuard';
// Lazy load components
const DashboardLayout = React.lazy(() => import('./layouts/DashboardLayout'));
const DashboardOverview = React.lazy(() => import('./pages/DashboardOverview'));
const Login = React.lazy(() => import('./pages/Auth/Login'));
const Departments = React.lazy(() => import('./pages/Departments'));
const Environmental = React.lazy(() => import('./pages/Environmental'));
const Social = React.lazy(() => import('./pages/Social'));
const Governance = React.lazy(() => import('./pages/Governance'));
const Gamification = React.lazy(() => import('./pages/Gamification'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Advisor = React.lazy(() => import('./pages/Advisor'));
const RewardMarketplace = React.lazy(() => import('./pages/RewardMarketplace'));
const NotificationCenter = React.lazy(() => import('./pages/NotificationCenter'));
const Badges = React.lazy(() => import('./pages/Badges'));
const Settings = React.lazy(() => import('./pages/Settings'));
function App() {
  return (
    <AuthProvider>
      <React.Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center bg-background">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Protected Routes */}
          <Route element={<AuthGuard />}>
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardOverview />} />
              <Route path="departments" element={<Departments />} />
              <Route path="environmental" element={<Environmental />} />
              <Route path="social" element={<Social />} />
              <Route path="governance" element={<Governance />} />
              <Route path="gamification" element={<Gamification />} />
              <Route path="rewards" element={<RewardMarketplace />} />
              <Route path="badges" element={<Badges />} />
              <Route path="settings" element={<Settings />} />
              <Route path="reports" element={<Reports />} />
              <Route path="advisor" element={<Advisor />} />
              <Route path="notifications" element={<NotificationCenter />} />
            </Route>
          </Route>
        </Routes>
      </React.Suspense>
    </AuthProvider>
  );
}
export default App;