import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CandidateDashboard from '../components/CandidateDashboard';

const CandidateDashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if user is not logged in or is not a candidate
    if (!loading && (!user || user.role !== 'candidate')) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="page-transition flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'candidate') {
    return null; // This will be handled by the redirect in useEffect
  }

  return (
    <div className="page-transition">
      <CandidateDashboard />
    </div>
  );
};

export default CandidateDashboardPage; 