import { useEffect, useState } from 'react'; // Removed React
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom'; // Added useLocation
import { BarChart, Trophy, Target, AlertCircle, Share2, Download, Printer, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { formatDate } from '../lib/utils.js';
// import { useAuth } from '../contexts/AuthContext.js'; // user is no longer used here

// Define the interface for the interview result
interface InterviewAnswer {
  questionId: string;
  text: string;
  score?: number;
  feedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  questionText?: string;
}

interface InterviewResult {
  _id: string; // This is the result's own ID
  candidate: string;
  interview?: { // This would be the original scheduled interview ID
    _id: string;
    title: string;
    scheduledFor: string;
  };
  jobRole: string;
  isHrScheduled?: boolean; // Add this field, expecting it from backend
  experienceLevel: string;
  totalScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  answers: InterviewAnswer[];
  date: string;
  cheatingDetected?: boolean;
}

const ResultDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation(); // Get location to access query params
  // const { user } = useAuth(); // user is no longer used for access control here
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchInterviewResult = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const queryParams = new URLSearchParams(location.search);
        const idType = queryParams.get('by');

        let relativeFetchUrl = `/api/interview-results/${id}`;
        if (idType === 'schedule' && id) {
          relativeFetchUrl = `/api/interview-results/interview/${id}`;
          // // console.log(`[ResultDetailPage] Fetching by schedule ID: ${id} using URL: ${API_BASE_URL}${relativeFetchUrl}`);
        } else if (id) {
          // // console.log(`[ResultDetailPage] Fetching by result ID: ${id} using URL: ${API_BASE_URL}${relativeFetchUrl}`);
        }
        const fetchUrl = `${API_BASE_URL}${relativeFetchUrl}`;

        const response = await fetch(fetchUrl, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch interview result');
        }

        const data = await response.json();
        setResult(data);
      } catch (error) {
        console.error('Error fetching interview result:', error);
        setError(error instanceof Error ? error.message : 'Error fetching interview result');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      // // console.log(`[ResultDetailPage] Fetching result for interview ID from URL: ${id}`);
      fetchInterviewResult();
    } else {
      // // console.log("[ResultDetailPage] No ID in URL params.");
      setError("No interview ID provided to fetch results.");
      setIsLoading(false);
    }
  }, [id, location.search, API_BASE_URL]); // Add API_BASE_URL

  // Access control logic removed as per new requirement for users/candidates to view HR scheduled results.
  // The page will now rely on the user being authenticated (if needed by the API for fetching results)
  // or simply display results if publicly accessible via ID.

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-primary';
    if (score >= 60) return 'text-warning-foreground';
    return 'text-destructive';
  };

  const getScoreBg = (score: number) => {
    if (score >= 90) return 'bg-success';
    if (score >= 75) return 'bg-primary';
    if (score >= 60) return 'bg-warning';
    return 'bg-destructive';
  };

  const formatJobRole = (role: string) => {
    return role.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const formatExperienceLevel = (level: string) => {
    return level.charAt(0).toUpperCase() + level.slice(1);
  };

  if (isLoading) {
    return (
      <div className="page-transition flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-xl font-semibold">Loading Results</h2>
          <p className="text-muted-foreground">Retrieving your interview performance...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-transition container mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
          <div className="text-center">
            <button 
              onClick={() => navigate('/candidate/dashboard')} 
              className="btn btn-primary"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="page-transition container mx-auto px-4 py-10">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-xl font-semibold">Interview Result Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested interview result could not be found.</p>
            <button 
              onClick={() => navigate('/candidate/dashboard')} 
              className="btn btn-primary"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition container mx-auto px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link 
          to="/candidate/dashboard" 
          className="flex items-center text-primary mb-6 hover:underline"
        >
          <ArrowLeft size={16} className="mr-1" />
          <span>Back to Dashboard</span>
        </Link>

        <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h1 className="text-3xl font-bold">Interview Results</h1>
            <p className="text-muted-foreground">
              {formatJobRole(result.jobRole)} • {formatExperienceLevel(result.experienceLevel)} Level • {formatDate(new Date(result.date))}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button className="btn btn-outline flex items-center space-x-1">
              <Share2 size={16} />
              <span>Share</span>
            </button>
            <button className="btn btn-outline flex items-center space-x-1">
              <Download size={16} />
              <span>Download</span>
            </button>
            <button className="btn btn-outline flex items-center space-x-1">
              <Printer size={16} />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Score Overview */}
        <div className="mb-10 grid gap-6 md:grid-cols-3">
          <div className="card flex flex-col items-center justify-center text-center">
            <div className="mb-2 text-primary">
              <Trophy size={36} />
            </div>
            <h2 className="mb-2 text-xl font-semibold">Overall Score</h2>
            <div className="flex items-center space-x-2">
              <div className={`${getScoreBg(result.totalScore)} flex h-20 w-20 items-center justify-center rounded-full text-white`}>
                <span className="text-3xl font-bold">{result.totalScore}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">out of 100</p>
                <p className={`${getScoreColor(result.totalScore)} text-sm font-medium`}>
                  {result.totalScore >= 90 ? 'Excellent' : 
                   result.totalScore >= 75 ? 'Good' : 
                   result.totalScore >= 60 ? 'Satisfactory' : 
                   'Needs Improvement'}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="mb-2 text-primary">
              <Target size={24} />
            </div>
            <h2 className="mb-3 text-lg font-semibold">Key Strengths</h2>
            <ul className="space-y-2">
              {result.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <CheckCircle size={16} className="mr-2 mt-0.5 text-success" />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <div className="mb-2 text-primary">
              <BarChart size={24} />
            </div>
            <h2 className="mb-3 text-lg font-semibold">Areas for Improvement</h2>
            <ul className="space-y-2">
              {result.improvements.map((improvement, index) => (
                <li key={index} className="flex items-start">
                  <Target size={16} className="mr-2 mt-0.5 text-warning" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cheating Detection Alert */}
        {result.cheatingDetected && (
          <div className="mb-10 rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-start">
              <AlertCircle size={24} className="mr-3 mt-0.5 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Potential Cheating Detected</h3>
                <p className="mt-1 text-sm">
                  Our eye-tracking system detected potential reference checking or assistance during the interview. 
                  In a real interview, this would be considered unprofessional and could disqualify you.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Feedback */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Detailed Feedback</h2>
          <p className="mb-6">{result.feedback}</p>

          <div className="space-y-6">
            {result.answers.map((answer, index) => (
              <div key={index} className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="mb-1 font-medium">Question {index + 1}:</h3>
                  <p>{answer.questionText || "Question not available"}</p>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-medium">Your Answer:</h4>
                    <p className="text-sm">{answer.text || "No answer provided"}</p>
                  </div>

                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`${getScoreBg(answer.score || 0)} rounded-full px-2 py-1 text-xs font-medium text-white`}>
                        Score: {answer.score || 0}/100
                      </div>
                      <span className={`text-sm ${getScoreColor(answer.score || 0)}`}>
                        {answer.score && answer.score >= 90 ? 'Excellent' : 
                         answer.score && answer.score >= 75 ? 'Good' : 
                         answer.score && answer.score >= 60 ? 'Satisfactory' : 
                         'Needs Improvement'}
                      </span>
                    </div>
                    
                    {answer.text ? (
                      <div className="flex items-center text-sm text-success">
                        <CheckCircle size={16} className="mr-1" />
                        <span>Answered</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-sm text-destructive">
                        <XCircle size={16} className="mr-1" />
                        <span>Skipped</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h4 className="mb-2 text-sm font-medium">Feedback:</h4>
                    <p className="text-sm text-muted-foreground">{answer.feedback || "No feedback available"}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link to="/setup" className="btn btn-primary">
            Take Another Interview
          </Link>
          <button className="btn btn-outline">
            See Recommended Resources
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDetailPage; 