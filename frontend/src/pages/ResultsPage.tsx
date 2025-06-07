import { useEffect, useState } from 'react'; // Added useState
import { useNavigate, Link, useParams } from 'react-router-dom'; // Added useParams
import { BarChart, Trophy, Target, AlertCircle, Share2, Download, Printer, CheckCircle, XCircle } from 'lucide-react';
import { useInterview, InterviewResult, InterviewAnswer } from '../contexts/InterviewContext'; // Added InterviewResult, InterviewAnswer
import { useAuth } from '../contexts/AuthContext';
import { formatDate } from '../lib/utils.js';

const ResultsPage = () => {
  const { result: contextResult, isInterviewComplete, config: contextConfig /*, questions: contextQuestions, isHrScheduledInterview: contextIsHrScheduled */ } = useInterview(); // Removed contextQuestions and contextIsHrScheduled
  const { user } = useAuth();
  const navigate = useNavigate();
  const { interviewId } = useParams<{ interviewId?: string }>();

  const [pageResult, setPageResult] = useState<InterviewResult | null>(null);
  const [isLoadingPageResult, setIsLoadingPageResult] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  
  const displayResult = interviewId ? pageResult : contextResult;
  
  const displayConfig = contextConfig;
  
  useEffect(() => {
    if (interviewId) {
      const fetchResultById = async (id: string) => {
        setIsLoadingPageResult(true);
        setPageError(null);
        setPageResult(null);
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            setPageError("Authentication required to view this result.");
           
            return;
          }
         
          const response = await fetch(`/api/interview-results/${id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (!response.ok) {
            const errData = await response.json().catch(() => ({ message: `Error fetching result: ${response.statusText}` }));
            throw new Error(errData.message || `Failed to fetch interview result for ID ${id}`);
          }
          const data: InterviewResult = await response.json();
          setPageResult(data);
          // If the fetched result has config details, you might want to set a page-specific config here too.
        } catch (err) {
          console.error("Error fetching specific interview result:", err);
          setPageError(err instanceof Error ? err.message : "An unknown error occurred while fetching the result.");
        } finally {
          setIsLoadingPageResult(false);
        }
      };
      fetchResultById(interviewId);
    } else {
      setPageResult(null);
      setPageError(null);
    }
  }, [interviewId]); // Rerun if interviewId changes

  useEffect(() => {
    if (!interviewId && !isInterviewComplete && !contextResult) {
      
      navigate('/setup');
    }
  }, [interviewId, isInterviewComplete, contextResult, navigate]);

  
  if (interviewId && isLoadingPageResult) {
    return (
      <div className="page-transition flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-xl font-semibold">Loading Interview Result...</h2>
        </div>
      </div>
    );
  }

  // Error state for page-specific result
  if (interviewId && pageError) {
    return (
      <div className="page-transition flex min-h-[80vh] items-center justify-center">
        <div className="text-center max-w-md p-6 bg-red-50 rounded-lg shadow">
          <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Result</h2>
          <p className="text-red-600">{pageError}</p>
          <Link to={user?.role === 'hr' ? '/hr-dashboard' : (user?.role === 'candidate' ? '/candidate-dashboard' : '/')} className="btn btn-primary mt-6">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }
  
  // Loading state for context result (if no ID in URL and not yet loaded)
  if (!interviewId && !contextResult) {
   
    return (
      <div className="page-transition flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-xl font-semibold">Calculating Results...</h2>
          <p className="text-muted-foreground">Analyzing your interview performance...</p>
        </div>
      </div>
    );
  }
  
  // If no result to display after all checks
  if (!displayResult) {
    return (
      <div className="page-transition flex min-h-[80vh] items-center justify-center">
        <div className="text-center max-w-md p-6">
          <AlertCircle size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Result Not Available</h2>
          <p className="text-gray-600">The interview result could not be loaded or found.</p>
          <Link to={user?.role === 'hr' ? '/hr-dashboard' : (user?.role === 'candidate' ? '/candidate-dashboard' : '/')} className="btn btn-primary mt-6">
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Use displayResult for rendering the page content
  const currentResultToDisplay = displayResult;
  
  const jobRoleDisplay = displayConfig?.jobRole || "N/A";
  const experienceLevelDisplay = displayConfig?.experienceLevel || "N/A";


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

  return (
    <div className="page-transition container mx-auto px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div>
            <h1 className="text-3xl font-bold">Interview Results</h1>
            <p className="text-muted-foreground">
              {jobRoleDisplay.split('-').map((word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')} • {experienceLevelDisplay.charAt(0).toUpperCase() + experienceLevelDisplay.slice(1)} Level • {formatDate(currentResultToDisplay.date)}
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
              <div className={`${getScoreBg(currentResultToDisplay.totalScore)} flex h-20 w-20 items-center justify-center rounded-full text-white`}>
                <span className="text-3xl font-bold">{currentResultToDisplay.totalScore}</span>
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">out of 100</p>
                <p className={`${getScoreColor(currentResultToDisplay.totalScore)} text-sm font-medium`}>
                  {currentResultToDisplay.totalScore >= 90 ? 'Excellent' :
                   currentResultToDisplay.totalScore >= 75 ? 'Good' :
                   currentResultToDisplay.totalScore >= 60 ? 'Satisfactory' :
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
              {currentResultToDisplay.strengths.map((strength: string, index: number) => (
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
              {currentResultToDisplay.improvements.map((improvement: string, index: number) => (
                <li key={index} className="flex items-start">
                  <Target size={16} className="mr-2 mt-0.5 text-warning" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Cheating Detection Alert */}
        {currentResultToDisplay.cheatingDetected && (
          <div className="mb-10 rounded-lg border border-destructive bg-destructive/10 p-4">
            <div className="flex items-start">
              <AlertCircle size={24} className="mr-3 mt-0.5 text-destructive" />
              <div>
                <h3 className="font-semibold text-destructive">Potential Cheating Detected</h3>
                <p className="mt-1 text-sm">
                  Our system detected potential integrity concerns during the interview.
                  In a real interview, maintaining academic and professional honesty is crucial.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Detailed Feedback */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Detailed Feedback</h2>
          <p className="mb-6">{currentResultToDisplay.feedback}</p>

          <div className="space-y-6">
            {currentResultToDisplay.answers.map((answer: InterviewAnswer, index: number) => (
              <div key={answer.questionId || index} className="rounded-lg border">
                <div className="border-b p-4">
                  <h3 className="mb-1 font-medium">Question {index + 1}:</h3>
                  <p>{answer.questionText || "Question not available"}</p>
                </div>
                <div className="p-4">
                  <div className="mb-4">
                    <h4 className="mb-2 text-sm font-medium">Answer Provided:</h4>
                    <p className="text-sm">{answer.text === "Skipped" || !answer.text ? <em>Skipped / No answer</em> : answer.text}</p>
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
                         (answer.text === "Skipped" ? 'Skipped' : 'Needs Improvement')}
                      </span>
                    </div>
                    
                    {answer.text && answer.text !== "Skipped" ? (
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
                    <p className="text-sm text-muted-foreground">{answer.feedback || (answer.text === "Skipped" ? "Question was skipped." : "No specific feedback available.")}</p>
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

export default ResultsPage;