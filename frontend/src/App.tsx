import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { LandingPage } from './pages/LandingPage';
import { RiderDashboard } from './pages/RiderDashboard';
import { DriverDashboard } from './pages/DriverDashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ProtectedRoute = ({ children, allowedRole }: { children: React.ReactNode, allowedRole?: string }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (allowedRole && user?.role !== allowedRole) {
    // Redirect to their appropriate dashboard if they try to access the wrong one
    return <Navigate to={user?.role === 'RIDER' ? '/rider' : '/driver'} />;
  }

  return children;
};

const HomeRedirect = () => {
  const { user, isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'RIDER' ? '/rider' : '/driver'} />;
  }
  // If not authenticated, show landing page
  return <LandingPage />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            path="/rider"
            element={
              <ProtectedRoute allowedRole="RIDER">
                <RiderDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/driver"
            element={
              <ProtectedRoute allowedRole="DRIVER">
                <DriverDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<HomeRedirect />} />
        </Routes>
      </Router>
      <ToastContainer position="top-right" autoClose={5000} />
    </AuthProvider>
  );
}

export default App;
