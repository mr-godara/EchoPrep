import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import SignupForm from './components/SignupForm';
import HRDashboard from './components/HRDashboard';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SetupPage from './pages/SetupPage';
import InterviewPage from './pages/InterviewPage';
import ResultsPage from './pages/ResultsPage';
import ResultDetailPage from './pages/ResultDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import CandidateDashboardPage from './pages/CandidateDashboardPage';
import { InterviewProvider } from './contexts/InterviewContext';
import { HRProvider } from './contexts/HRContext';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
      <HRProvider>
        <InterviewProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
            <Route
              path="signup"
              element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <SignupForm />}
            />
            <Route
              path="login"
              element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <LoginPage />}
            />
            <Route
              path="setup"
              element={user ? <SetupPage /> : <Navigate to="/login" />}
            />
            <Route
              path="interview"
              element={user ? <InterviewPage /> : <Navigate to="/login" />}
            />
            <Route
              path="results"
              element={user ? <ResultsPage /> : <Navigate to="/login" />}
            />
            <Route
              path="results/:id"
              element={user ? <ResultDetailPage /> : <Navigate to="/login" />}
            />
            <Route
              path="hr/dashboard"
              element={
                user?.role === 'hr' ? (
                  <HRDashboard />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="candidate/dashboard"
              element={
                user?.role === 'candidate' ? (
                  <CandidateDashboardPage />
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="interview-room/:id"
              element={user ? <InterviewRoomPage /> : <Navigate to="/login" />}
            />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </InterviewProvider>
      </HRProvider>
  );
};

export default App;