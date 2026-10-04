import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { BottomNavbar } from './components/BottomNavbar';
import { Footer } from './components/Footer';

// Public pages
import { Home } from './pages/public/Home';
import { WorkersList } from './pages/public/WorkersList';
import { WorkerDetail } from './pages/public/WorkerDetail';
import { Categories } from './pages/public/Categories';
import { Login } from './pages/public/Login';
import { Register } from './pages/public/Register';
import { HowItWorks, About, Privacy, Terms } from './pages/public/InformationalPages';

// Client pages
import { ClientDashboard } from './pages/client/ClientDashboard';
import { ClientProjectDetail } from './pages/client/ClientProjectDetail';
import { ClientMessages } from './pages/client/ClientMessages';

// Worker pages
import { WorkerDashboard } from './pages/worker/WorkerDashboard';
import { WorkerProjectDetail } from './pages/worker/WorkerProjectDetail';
import { WorkerVerification } from './pages/worker/WorkerVerification';
import { WorkerPortfolioManager } from './pages/worker/WorkerPortfolioManager';
import { WorkerProfileEdit } from './pages/worker/WorkerProfileEdit';

// Admin pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminVerifications } from './pages/admin/AdminVerifications';
import { AdminAuditLogs } from './pages/admin/AdminAuditLogs';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="text-center py-20 text-slate-400">Loading auth state...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

export function App() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-900">
      <div>
        <Navbar />
        <main className="pb-20 sm:pb-24">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/workers" element={<WorkersList />} />
            <Route path="/workers/:id" element={<WorkerDetail />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />

            {/* Client Protected Routes */}
            <Route
              path="/client/dashboard"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/projects"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/projects/:id"
              element={
                <ProtectedRoute allowedRoles={['CLIENT']}>
                  <ClientProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/client/messages"
              element={
                <ProtectedRoute allowedRoles={['CLIENT', 'WORKER']}>
                  <ClientMessages />
                </ProtectedRoute>
              }
            />

            {/* Worker Protected Routes */}
            <Route
              path="/worker/dashboard"
              element={
                <ProtectedRoute allowedRoles={['WORKER']}>
                  <WorkerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/projects"
              element={
                <ProtectedRoute allowedRoles={['WORKER']}>
                  <WorkerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/projects/:id"
              element={
                <ProtectedRoute allowedRoles={['WORKER']}>
                  <WorkerProjectDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/verification"
              element={
                <ProtectedRoute allowedRoles={['WORKER']}>
                  <WorkerVerification />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/portfolio"
              element={
                <ProtectedRoute allowedRoles={['WORKER']}>
                  <WorkerPortfolioManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/profile"
              element={
                <ProtectedRoute allowedRoles={['WORKER']}>
                  <WorkerProfileEdit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/worker/messages"
              element={
                <ProtectedRoute allowedRoles={['CLIENT', 'WORKER']}>
                  <ClientMessages />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verifications"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminVerifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminAuditLogs />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
      </div>
      <Footer />
      <BottomNavbar />
    </div>
  );
}
export default App;
