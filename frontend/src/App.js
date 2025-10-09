import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useIsAuthenticated, useMsal } from '@azure/msal-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Dashboard from './pages/Dashboard';
import Initiatives from './pages/Initiatives';
import InitiativeForm from './pages/InitiativeForm';
import ProjectView from './pages/ProjectView';
import FeaturedSolutions from './pages/FeaturedSolutions';
import Management from './pages/Management';
import ROIAssistant from './pages/ROIAssistant';
import ComplexityAnalyzer from './pages/ComplexityAnalyzer';
import './App.css';

function ProtectedRoute({ children }) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress, accounts } = useMsal();
  const { loading } = useAuth();

  // Wait for any authentication operations to complete
  if (inProgress !== 'none' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Authenticating...</div>
      </div>
    );
  }

  // Check both isAuthenticated hook and accounts array for redundancy
  const hasValidAuth = isAuthenticated || accounts.length > 0;

  return hasValidAuth ? children : <Navigate to="/login" replace />;
}

function AppContent() {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();

  // Show loading during startup or when handling redirect from Microsoft
  if (inProgress === 'startup' || inProgress === 'handleRedirect') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading application...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="app-container">
        {isAuthenticated && <Navigation />}
        <div className="main-content">
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/initiatives" element={
              <ProtectedRoute>
                <Initiatives />
              </ProtectedRoute>
            } />

            <Route path="/initiatives/new" element={
              <ProtectedRoute>
                <InitiativeForm />
              </ProtectedRoute>
            } />

            <Route path="/initiatives/:id/edit" element={
              <ProtectedRoute>
                <InitiativeForm />
              </ProtectedRoute>
            } />

            <Route path="/initiatives/:id" element={
              <ProtectedRoute>
                <ProjectView />
              </ProtectedRoute>
            } />

            <Route path="/featured" element={
              <ProtectedRoute>
                <FeaturedSolutions />
              </ProtectedRoute>
            } />

            <Route path="/tools/roi-assistant" element={
              <ProtectedRoute>
                <ROIAssistant />
              </ProtectedRoute>
            } />

            <Route path="/tools/complexity-analyzer" element={
              <ProtectedRoute>
                <ComplexityAnalyzer />
              </ProtectedRoute>
            } />

            <Route path="/management" element={
              <ProtectedRoute>
                <Management />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
