import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

interface Interview {
  _id: string;
  title: string;
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
  };
  scheduledFor: string;
  duration: number; // Duration in minutes
  jobRole: string; // Job role for the interview
  experienceLevel: string; // Experience level for the interview
  roomLink: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

const HRDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate(); // Get navigate function
  const API_BASE_URL = import.meta.env.VITE_API_URL;
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [showNewInterview, setShowNewInterview] = useState(false);
  const [newInterview, setNewInterview] = useState({
    title: '',
    candidateEmail: '',
    scheduledFor: '',
    duration: 60, // Default duration: 60 minutes
    jobRole: 'web-developer', // Default job role
    experienceLevel: 'mid-level', // Default experience level
  });
  const [error, setError] = useState<string>('');
  // const [interviewResults, setInterviewResults] = useState<Record<string, any>>({}); // Unused

  useEffect(() => {
    fetchInterviews();
  }, []);

  const fetchInterviews = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
 
      const response = await fetch(`${API_BASE_URL}/api/interviews`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch interviews');
      }

      const data = await response.json();
      setInterviews(data);
    } catch (error) {
      // console.error('Error fetching interviews:', error);
      setError(error instanceof Error ? error.message : 'Error fetching interviews');
    }
  };

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
 
      const response = await fetch(`${API_BASE_URL}/api/interviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...newInterview,
          hr: user?._id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create interview');
      }

      const data = await response.json();
      setInterviews([...interviews, data]);
      setShowNewInterview(false);
      setNewInterview({
        title: '',
        candidateEmail: '',
        scheduledFor: '',
        duration: 60,
        jobRole: 'web-developer',
        experienceLevel: 'mid-level',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create interview');
    }
  };

  const handleCancelInterview = async (interviewId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
 
      const response = await fetch(`${API_BASE_URL}/api/interviews/${interviewId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to cancel interview');
      }

      await fetchInterviews();
    } catch (error) {
      // console.error('Error cancelling interview:', error);
      setError(error instanceof Error ? error.message : 'Error cancelling interview');
    }
  };

  // Add a new function to handle viewing interview results
  const handleViewResults = async (interviewId: string) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
 
      const response = await fetch(`${API_BASE_URL}/api/interview-results/interview/${interviewId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // Special handling for completed interviews with no results yet
        if (response.status === 404) {
          if (data.interviewStatus === 'completed') {
            alert('This interview is marked as completed, but results are not available yet. The candidate may not have submitted their answers.');
          } else {
            alert('No results are available for this interview yet.');
          }
          return;
        }
        
        throw new Error(data.message || 'Failed to fetch interview results');
      }
      
      // Instead of setting local state and alerting, navigate to the detailed results page
      // The ResultsPage component is now responsible for fetching and displaying the specific result.
      // setInterviewResults(prev => ({
      //   ...prev,
      //   [interviewId]: data // No longer needed here if ResultsPage fetches its own data
      // }));
      
      // Navigate to the detailed results page, adding a query param to indicate the ID type
      navigate(`/results/${interviewId}?by=schedule`);
    } catch (error) {
      // console.error('Error fetching interview results:', error);
      setError(error instanceof Error ? error.message : 'Error fetching interview results');
      alert('Could not retrieve interview results. Please try again later.');
    }
  };

  // Add a new function to determine if an interview is active (scheduled and within its time window)
  const isInterviewActive = (interview: Interview) => {
    if (interview.status !== 'scheduled') return false;
    
    const now = new Date();
    const scheduledTime = new Date(interview.scheduledFor);
    const endTime = new Date(scheduledTime.getTime() + interview.duration * 60000); // Convert minutes to milliseconds
    
    return now >= scheduledTime && now <= endTime;
  };

  // Update the getStatusColor function to include an active status
  const getStatusColor = (interview: Interview) => {
    if (isInterviewActive(interview)) {
      return 'bg-green-500 text-white';
    }
    
    switch (interview.status) {
      case 'scheduled': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get a more descriptive status text
  const getStatusText = (interview: Interview) => {
    if (isInterviewActive(interview)) {
      return 'Active Now';
    }
    
    switch (interview.status) {
      case 'scheduled': {
        const now = new Date();
        const interviewTime = new Date(interview.scheduledFor);
        
        if (now < interviewTime) {
          return 'Scheduled';
        } else {
          return 'Missed';
        }
      }
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return interview.status;
    }
  };

  // Add helper functions to format job role and experience level
  const formatJobRole = (role: string) => {
    if (!role) return 'N/A';
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatExperienceLevel = (level: string) => {
    if (!level) return 'N/A';
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">HR Dashboard</h1>
          <button
            onClick={() => setShowNewInterview(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Schedule New Interview
          </button>
        </div>

        {showNewInterview && (
          <div className="mb-8 bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Schedule New Interview</h2>
            <form onSubmit={handleCreateInterview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Interview Title
                </label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newInterview.title}
                  onChange={(e) => setNewInterview({
                    ...newInterview,
                    title: e.target.value,
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Candidate Email
                </label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newInterview.candidateEmail}
                  onChange={(e) => setNewInterview({
                    ...newInterview,
                    candidateEmail: e.target.value,
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Schedule Date & Time
                </label>
                <input
                  type="datetime-local"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newInterview.scheduledFor}
                  onChange={(e) => setNewInterview({
                    ...newInterview,
                    scheduledFor: e.target.value,
                  })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Duration (minutes)
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newInterview.duration}
                  onChange={(e) => setNewInterview({
                    ...newInterview,
                    duration: parseInt(e.target.value, 10),
                  })}
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes (1 hour)</option>
                  <option value={90}>90 minutes (1.5 hours)</option>
                  <option value={120}>120 minutes (2 hours)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Job Role
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newInterview.jobRole}
                  onChange={(e) => setNewInterview({
                    ...newInterview,
                    jobRole: e.target.value,
                  })}
                >
                  <option value="web-developer">Web Developer</option>
                  <option value="app-developer">App Developer</option>
                  <option value="ml-ai">ML/AI Engineer</option>
                  <option value="ux-designer">UX Designer</option>
                  <option value="data-scientist">Data Scientist</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Experience Level
                </label>
                <select
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={newInterview.experienceLevel}
                  onChange={(e) => setNewInterview({
                    ...newInterview,
                    experienceLevel: e.target.value,
                  })}
                >
                  <option value="fresher">Fresher</option>
                  <option value="junior">Junior</option>
                  <option value="mid-level">Mid-Level</option>
                  <option value="senior">Senior</option>
                </select>
              </div>

              {error && (
                <div className="text-red-500 text-sm">{error}</div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewInterview(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Schedule Interview
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Interviews</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Candidate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Experience Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Room Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {interviews.map((interview) => (
                    <tr key={interview._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {interview.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {`${interview.candidate.firstName} ${interview.candidate.lastName}`}
                        <div className="text-sm text-gray-500">
                          {interview.candidate.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm">
                          {formatJobRole(interview.jobRole)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm">
                          {formatExperienceLevel(interview.experienceLevel)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {format(new Date(interview.scheduledFor), 'PPp')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm">
                          {interview.duration} minutes
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${getStatusColor(interview)}`}>
                          {getStatusText(interview)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {interview.status === 'scheduled' && (
                          <div className="space-y-2">
                            <a
                              href={interview.roomLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`px-3 py-1 rounded-md text-sm font-medium flex items-center w-fit ${
                                isInterviewActive(interview) 
                                  ? 'bg-green-500 text-white hover:bg-green-600' 
                                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                              }`}
                            >
                              {isInterviewActive(interview) ? 'Join Now' : 'Join Room'}
                              <ChevronRight size={16} className="ml-1" />
                            </a>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}${interview.roomLink}`);
                                alert('Link copied to clipboard! You can now share it with the candidate.');
                              }}
                              className="text-xs text-blue-600 flex items-center hover:text-blue-800"
                            >
                              <span>Copy Link</span>
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {interview.status === 'scheduled' && (
                          <button
                            onClick={() => handleCancelInterview(interview._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        )}
                        {interview.status === 'completed' && (
                          <button
                            onClick={() => handleViewResults(interview._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Results
                          </button>
                        )}
                        {interview.status !== 'scheduled' && interview.status !== 'completed' && (
                          <span className="text-gray-400">
                            No actions available
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard; 