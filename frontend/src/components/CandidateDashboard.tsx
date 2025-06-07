import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Calendar, Clock, ArrowRight, ChevronRight, Tag, Clipboard } from 'lucide-react'; // Removed Award
import { format } from 'date-fns';

// Types for our interview data
interface ScheduledInterview {
  _id: string;
  title: string;
  hr: {
    firstName: string;
    lastName: string;
    company: string;
  };
  scheduledFor: string;
  duration: number; // Duration in minutes
  roomLink: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

interface InterviewResult {
  _id: string;
  interview?: {
    title: string;
    scheduledFor: string;
  };
  jobRole: string;
  experienceLevel: string;
  totalScore: number;
  date: string;
  isHrScheduled?: boolean; // Added to match context and help filtering
}

const CandidateDashboard: React.FC = () => {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<ScheduledInterview[]>([]);
  const [results, setResults] = useState<InterviewResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch scheduled interviews
        const interviewsResponse = await fetch(`${API_BASE_URL}/api/interviews/candidate`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        // Fetch interview results
        const resultsResponse = await fetch(`${API_BASE_URL}/api/interview-results`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!interviewsResponse.ok) {
          const errorData = await interviewsResponse.json();
          throw new Error(errorData.message || 'Failed to fetch interviews');
        }

        if (!resultsResponse.ok) {
          const errorData = await resultsResponse.json();
          throw new Error(errorData.message || 'Failed to fetch results');
        }

        const interviewsData = await interviewsResponse.json();
        const resultsData = await resultsResponse.json();

        setInterviews(interviewsData);
        // Show all results to the candidate, including HR-scheduled ones, as per new requirement.
        setResults(resultsData);
      } catch (error) {
        // console.error('Error fetching dashboard data:', error);
        setError(error instanceof Error ? error.message : 'Error fetching data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL]); // Added API_BASE_URL

  // Function to format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPP'); // e.g., "April 29, 2023"
  };

  // Function to format time
  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'p'); // e.g., "12:00 PM"
  };

  // Convert job role from kebab-case to Title Case
  const formatJobRole = (role: string) => {
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  // Format experience level to Title Case
  const formatExperienceLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'text-blue-600 bg-blue-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-amber-600';
    return 'text-red-600';
  };

  // Filter upcoming interviews (scheduled and in the future)
  const upcomingInterviews = interviews.filter(interview => 
    interview.status === 'scheduled' && new Date(interview.scheduledFor) > new Date()
  );

  // Filter past interviews (completed or scheduled but in the past)
  const pastInterviews = interviews.filter(interview => 
    interview.status === 'completed' || 
    (interview.status === 'scheduled' && new Date(interview.scheduledFor) <= new Date())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.firstName}</h1>
          <p className="text-muted-foreground">Here's an overview of your interviews and performance</p>
        </div>
        <Link 
          to="/setup" 
          className="btn bg-primary text-white hover:bg-primary-dark flex items-center space-x-2 mt-4 md:mt-0"
        >
          <span>Start New Practice Interview</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
        </div>
      )}

      {/* Upcoming Interviews */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Upcoming Interviews</h2>
        {upcomingInterviews.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">No upcoming interviews scheduled.</p>
            <Link to="/setup" className="text-primary hover:underline mt-2 inline-block">
              Start a practice interview instead
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingInterviews.map((interview) => (
              <div key={interview._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="font-medium text-lg">{interview.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                    {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                  </span>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar size={16} className="mr-2" />
                    <span>{formatDate(interview.scheduledFor)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2" />
                    <span>{formatTime(interview.scheduledFor)}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Clipboard size={16} className="mr-2" />
                    <span>With {interview.hr.firstName} {interview.hr.lastName}</span>
                  </div>
                  {interview.hr.company && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Tag size={16} className="mr-2" />
                      <span>{interview.hr.company}</span>
                    </div>
                  )}
                  <div className="flex items-center text-sm text-gray-600">
                    <Clock size={16} className="mr-2" />
                    <span>Duration: {interview.duration} minutes</span>
                  </div>
                </div>
                
                <Link 
                  to={interview.roomLink} 
                  className="btn btn-outline w-full flex items-center justify-center space-x-1"
                >
                  <span>Join Interview</span>
                  <ChevronRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Interview Results */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Your Interview Results</h2>
        {results.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">You haven't completed any interviews yet.</p>
            <Link to="/setup" className="text-primary hover:underline mt-2 inline-block">
              Start your first interview
            </Link>
          </div>
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interview Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Position
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result) => (
                  <tr key={result._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(result.date)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.interview ? 'Scheduled' : 'Practice'}
                      </div>
                      {result.interview && (
                        <div className="text-xs text-gray-500">{result.interview.title}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatJobRole(result.jobRole)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatExperienceLevel(result.experienceLevel)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getScoreColor(result.totalScore)}`}>
                        {result.totalScore}/100
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <Link 
                        to={`/results/${result._id}`}
                        className="text-primary hover:text-primary-dark"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Past Interviews (that may not have results) */}
      {pastInterviews.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Interviews</h2>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interviewer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pastInterviews.map((interview) => (
                  <tr key={interview._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatDate(interview.scheduledFor)}</div>
                      <div className="text-xs text-gray-500">{formatTime(interview.scheduledFor)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{interview.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {interview.hr.firstName} {interview.hr.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{interview.hr.company || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(interview.status)}`}>
                        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                      </span>
                      {interview.status === 'scheduled' && (
                        <div className="mt-2">
                          <Link 
                            to={interview.roomLink}
                            className="text-primary hover:text-primary-dark text-sm flex items-center"
                          >
                            <span>Join Room</span>
                            <ChevronRight size={14} className="ml-1" />
                          </Link>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard; 