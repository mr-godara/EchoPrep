import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getRandomId } from '../lib/utils.js';

// Define constants for question counts and time limits
const QUESTION_TIME_LIMIT_SECONDS = 180; // 3 minutes per question
const DEFAULT_PRACTICE_QUESTION_COUNT = 10; // As per previous update
const DEFAULT_SCHEDULED_QUESTION_COUNT = 5; // Fallback if duration isn't available for a scheduled interview

// Define the types
export type JobRole = 'web-developer' | 'app-developer' | 'ml-ai' | 'ux-designer' | 'data-scientist';
export type ExperienceLevel = 'fresher' | 'junior' | 'mid-level' | 'senior';

export interface InterviewConfig {
  jobRole: JobRole;
  experienceLevel: ExperienceLevel;
}

// Add interface for media stream options
export interface InterviewStartOptions {
  mediaStream?: MediaStream;
  jobRole?: JobRole;
  experienceLevel?: ExperienceLevel;
  interviewId?: string; // Add interview ID option
  durationInSeconds?: number; // Added for HR scheduled interviews
  isHrScheduled?: boolean; // Added to flag HR scheduled interviews
}

export interface InterviewQuestion {
  id: string;
  text: string;
  audioUrl?: string;
}

export interface InterviewAnswer {
  questionId: string;
  text: string;
  audioUrl?: string;
  score?: number; // 0-100
  feedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  questionText?: string; // Added for displaying the question text on results page
}

export interface InterviewResult {
  totalScore: number; // 0-100
  answers: InterviewAnswer[];
  feedback: string;
  cheatingDetected: boolean;
  strengths: string[];
  improvements: string[];
  date: Date;
  isHrScheduled?: boolean; // Added to persist if the interview was HR-scheduled
}

// Example questions for different roles and experience levels
const MOCK_QUESTIONS: Record<JobRole, Record<ExperienceLevel, string[]>> = {
  'web-developer': {
    'fresher': [
      'Tell me about yourself and your interest in web development.',
      'What HTML and CSS concepts are you familiar with?',
      'Have you worked with JavaScript before? What basic concepts do you understand?',
      'Describe a simple web project you\'ve worked on.'
    ],
    'junior': [
      'Tell me about your experience with responsive design.',
      'How do you approach debugging in JavaScript?',
      'Explain the difference between let, const, and var in JavaScript.',
      'What frontend frameworks or libraries have you worked with?'
    ],
    'mid-level': [
      'Explain the concept of closures in JavaScript.',
      'How do you handle state management in a React application?',
      'Describe your experience with RESTful APIs.',
      'How do you optimize website performance?'
    ],
    'senior': [
      'Describe a complex architecture you\'ve designed for a web application.',
      'How do you approach testing in a large-scale web application?',
      'Explain your experience with microservices in web development.',
      'How do you mentor junior developers in your team?'
    ]
  },
  'app-developer': {
    'fresher': [
      'Why are you interested in mobile app development?',
      'What programming languages have you learned?',
      'Describe a simple app idea you would like to build.',
      'What do you know about the app development lifecycle?'
    ],
    'junior': [
      'Tell me about an app you\'ve worked on.',
      'How familiar are you with native vs cross-platform development?',
      'Describe your experience with state management in mobile apps.',
      'How do you handle user input validation?'
    ],
    'mid-level': [
      'Explain your approach to app architecture.',
      'How do you handle offline capabilities in mobile apps?',
      'Describe your experience with consuming APIs in mobile applications.',
      'How do you approach testing for mobile applications?'
    ],
    'senior': [
      'Describe a complex mobile architecture you\'ve designed.',
      'How do you approach performance optimization in mobile apps?',
      'Explain your experience with CI/CD for mobile applications.',
      'How do you manage dependencies in large-scale mobile applications?'
    ]
  },
  'ml-ai': {
    'fresher': [
      'Why are you interested in AI and machine learning?',
      'What ML/AI concepts have you studied?',
      'Have you completed any ML projects or courses?',
      'What programming languages do you know for data analysis?'
    ],
    'junior': [
      'Explain the difference between supervised and unsupervised learning.',
      'Describe a simple ML project you\'ve worked on.',
      'How familiar are you with Python libraries for ML?',
      'What do you know about data preprocessing?'
    ],
    'mid-level': [
      'Explain how you would approach a classification problem.',
      'Describe your experience with neural networks.',
      'How do you evaluate ML model performance?',
      'What experience do you have with NLP or computer vision?'
    ],
    'senior': [
      'Describe a complex ML system you\'ve designed and deployed.',
      'How do you approach ML model optimization and maintenance?',
      'Explain your experience with distributed computing for ML.',
      'How do you stay current with the rapidly evolving field of AI?'
    ]
  },
  'ux-designer': {
    'fresher': [
      'Why are you interested in UX design?',
      'What design tools have you learned to use?',
      'Describe your understanding of user-centered design.',
      'Have you created any design projects yet?'
    ],
    'junior': [
      'Tell me about your design process.',
      'How do you conduct user research?',
      'Describe a design project you\'ve worked on.',
      'How do you handle feedback on your designs?'
    ],
    'mid-level': [
      'How do you translate user needs into design solutions?',
      'Describe your experience with usability testing.',
      'How do you collaborate with developers?',
      'Tell me about a challenging design problem you solved.'
    ],
    'senior': [
      'How do you approach UX strategy for large products?',
      'Describe how you\'ve built or managed a design system.',
      'How do you measure the success of your UX designs?',
      'Tell me about how you mentor junior designers.'
    ]
  },
  'data-scientist': {
    'fresher': [
      'Why are you interested in data science?',
      'What statistical concepts are you familiar with?',
      'What programming languages do you know for data analysis?',
      'Have you worked on any data projects?'
    ],
    'junior': [
      'Describe a data analysis project you\'ve worked on.',
      'How do you approach data cleaning and preparation?',
      'What visualization tools have you worked with?',
      'How do you determine which statistical test to use?'
    ],
    'mid-level': [
      'How do you approach feature engineering?',
      'Describe your experience with big data technologies.',
      'How do you communicate technical findings to non-technical stakeholders?',
      'Tell me about a challenging data problem you solved.'
    ],
    'senior': [
      'How do you build data science teams and processes?',
      'Describe a complex data pipeline you\'ve designed.',
      'How do you approach model deployment and monitoring?',
      'How do you ensure ethical use of data in your projects?'
    ]
  }
};

// Context interface
interface InterviewContextType {
  config: InterviewConfig | null;
  setConfig: (config: InterviewConfig) => void;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: InterviewAnswer[];
  result: InterviewResult | null;
  mediaStream: MediaStream | null;
  isLoadingQuestions: boolean;
  startInterview: (options?: InterviewStartOptions) => Promise<void>;
  nextQuestion: () => void;
  previousQuestion: () => void;
  saveAnswer: (answer: Omit<InterviewAnswer, 'score' | 'feedback'>) => Promise<void>;
  finishInterview: () => void;
  isInterviewInProgress: boolean;
  isInterviewComplete: boolean;
  mediaStreamError: string | null;
  isInitializingMedia: boolean;
  retryMediaStream: () => Promise<boolean>;
  isHrScheduledInterview: boolean; // Added
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export const useInterview = () => {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
};

export const InterviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<InterviewConfig | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [result, setResult] = useState<InterviewResult | null>(null);
  const [isInterviewInProgress, setIsInterviewInProgress] = useState(false);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [mediaStreamError, setMediaStreamError] = useState<string | null>(null);
  const [isInitializingMedia, setIsInitializingMedia] = useState(false);
  const [isHrScheduledInterview, setIsHrScheduledInterview] = useState(false); // New state

  // Enhanced cleanup for media streams when ending interview
  const finishInterview = useCallback(async () => {
    console.log("[InterviewContext] finishInterview called.");
    console.log("[InterviewContext] Current answers:", JSON.parse(JSON.stringify(answers)));
    console.log("[InterviewContext] Current config:", config);
    console.log("[InterviewContext] Current questions:", JSON.parse(JSON.stringify(questions)));

    // Clean up media streams if they exist
    if (mediaStream) {
      console.log("[InterviewContext] Stopping media stream tracks.");
      try {
        mediaStream.getTracks().forEach(track => {
          // console.log(`[InterviewContext] Stopping track: ${track.kind}`);
          track.stop();
        });
      } catch (error) {
        console.error('[InterviewContext] Error stopping media tracks:', error);
      }
      setMediaStream(null);
    }
    
    if (answers.length > 0 && config) {
      console.log("[InterviewContext] Calculating final result.");
      const answersWithScores = answers.filter(answer => answer.score !== undefined);
      const totalScore = answersWithScores.length > 0
        ? Math.round(answersWithScores.reduce((sum, answer) => sum + (answer.score || 0), 0) / answersWithScores.length)
        : 0;
      console.log("[InterviewContext] Calculated totalScore:", totalScore);

      const allStrengths = answers.flatMap(answer => answer.strengths || []).filter(strength => strength);
      const allWeaknesses = answers.flatMap(answer => answer.weaknesses || []).filter(weakness => weakness);
      const uniqueStrengths = [...new Set(allStrengths)].slice(0, 5);
      const uniqueImprovements = [...new Set(allWeaknesses)].slice(0, 5);
      
      const feedback = totalScore >= 80
        ? "Excellent job! You demonstrated strong communication skills and provided comprehensive answers."
        : totalScore >= 70
          ? "Good job! Your answers were solid with some room for improvement in specific areas."
          : totalScore >= 60
            ? "Satisfactory performance. With some preparation, you can improve your interview skills."
            : "You need more practice with interview questions. Focus on being more specific and structured in your answers.";
      
      // Ensure all questions are represented in the final result,
      // including those that might have been skipped and have no answer recorded.
      const finalAnswers = questions.map(question => {
        const existingAnswer = answers.find(a => a.questionId === question.id);
        if (existingAnswer) {
          return {
            ...existingAnswer,
            questionText: question.text, // Ensure question text is from the definitive question object
          };
        } else {
          // This question was skipped and no answer (not even an empty one) was saved.
          // Or, if saveAnswer is always called on skip, this path might not be hit often.
          return {
            questionId: question.id,
            questionText: question.text,
            text: "Skipped", // Or "No answer recorded"
            score: 0, // Or a specific marker for skipped questions
            feedback: "This question was skipped.",
            strengths: [],
            weaknesses: []
          };
        }
      });

      const resultToSave: InterviewResult = {
        totalScore,
        answers: finalAnswers,
        feedback,
        cheatingDetected: false, // Assuming no cheating detection for now
        strengths: uniqueStrengths,
        improvements: uniqueImprovements,
        date: new Date(),
        isHrScheduled: isHrScheduledInterview, // Persist this flag
      };
      
      console.log("[InterviewContext] Final result object created:", JSON.parse(JSON.stringify(resultToSave)));
      setResult(resultToSave);
      console.log("[InterviewContext] setResult called with the final result.");
      
      // Save to backend API
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.warn("[InterviewContext] No auth token found. Cannot save results to backend.");
        }

        let interviewRoomId: string | null = null;
        const storedRoomId = localStorage.getItem('interviewRoomId');
        const urlPath = window.location.pathname;
        const sessionInterviewId = sessionStorage.getItem('currentInterviewId');

        if (urlPath.includes('/interview-room/')) {
          interviewRoomId = urlPath.split('/interview-room/')[1];
          console.log("[InterviewContext] Found interview room ID in URL:", interviewRoomId);
        } else if (storedRoomId) {
          interviewRoomId = storedRoomId;
          console.log("[InterviewContext] Found interview room ID in localStorage:", interviewRoomId);
        } else if (sessionInterviewId) {
          interviewRoomId = sessionInterviewId;
          console.log("[InterviewContext] Found interview ID in sessionStorage:", interviewRoomId);
        } else {
          console.log("[InterviewContext] No interviewRoomId found from URL, localStorage, or sessionStorage.");
        }
        
        if (token && config) { // Ensure config is available for jobRole/experienceLevel
          if (interviewRoomId) {
            console.log("[InterviewContext] Attempting to mark interview as completed for ID:", interviewRoomId);
            try {
              const completeResponse = await fetch(`/api/interviews/room/${interviewRoomId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
              });
              if (completeResponse.ok) {
                console.log("[InterviewContext] Successfully marked interview as completed via room ID:", interviewRoomId);
              } else {
                console.error("[InterviewContext] Failed to mark interview as completed via room ID. Status:", completeResponse.status);
                // Fallback attempt for auto-complete
                try {
                    const autoCompleteResponse = await fetch(`/api/interviews/auto-complete/${interviewRoomId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                    });
                    if (autoCompleteResponse.ok) {
                        console.log("[InterviewContext] Successfully marked interview as completed via auto-complete for ID:", interviewRoomId);
                    } else {
                        console.error("[InterviewContext] Failed to mark interview as completed via auto-complete. Status:", autoCompleteResponse.status);
                    }
                } catch (autoCompleteErr) {
                    console.error('[InterviewContext] Error with direct interview auto-completion API call:', autoCompleteErr);
                }
              }
            } catch (roomErr) {
              console.error('[InterviewContext] Error calling complete interview room API:', roomErr);
            }
          } else {
            console.log("[InterviewContext] No interview room ID found to mark as completed. Results will be saved without specific interview link if it's a practice session.");
          }
          
          const backendPayload = {
            interviewId: interviewRoomId || undefined, // Send undefined if no ID, backend can handle generic practice results
            jobRole: config.jobRole,
            experienceLevel: config.experienceLevel,
            totalScore: resultToSave.totalScore,
            feedback: resultToSave.feedback,
            strengths: resultToSave.strengths,
            improvements: resultToSave.improvements,
            answers: resultToSave.answers.map(answer => ({
              questionId: answer.questionId,
              questionText: answer.questionText,
              answerText: answer.text,
              score: answer.score || 0,
              feedback: answer.feedback || '',
              strengths: answer.strengths || [],
              weaknesses: answer.weaknesses || []
            }))
          };
          console.log("[InterviewContext] Saving interview results to backend. Payload:", JSON.parse(JSON.stringify(backendPayload)));
          
          fetch('/api/interview-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(backendPayload)
          }).then(response => {
            if (response.ok) {
              console.log("[InterviewContext] Interview results saved successfully to backend.");
            } else {
              response.json().then(errData => {
                console.error("[InterviewContext] Failed to save interview results to backend. Status:", response.status, "Error:", errData);
              }).catch(() => {
                console.error("[InterviewContext] Failed to save interview results to backend. Status:", response.status, "Could not parse error response.");
              });
            }
          }).catch(error => {
            console.error('[InterviewContext] Error during fetch to save interview result to backend:', error);
          });
        } else {
          if (!token) console.warn("[InterviewContext] No token, skipping backend save.");
          if (!config) console.warn("[InterviewContext] No config, skipping backend save as jobRole/experienceLevel are missing.");
        }
      } catch (error) {
        console.error('[InterviewContext] Error preparing or sending result to backend:', error);
      }
    } else {
      if (answers.length === 0) console.warn("[InterviewContext] No answers recorded, not calculating or saving result.");
      if (!config) console.warn("[InterviewContext] No config available, not calculating or saving result.");
      setResult(null); // Explicitly set result to null if not calculated
    }
    
    setIsInterviewInProgress(false);
    setCurrentQuestionIndex(0);
    // setQuestions([]); // Keep questions for the result page to display question text
    // Don't clear answers here, as they're needed for the result page
    setIsInterviewComplete(true);
    console.log("[InterviewContext] finishInterview completed. isInterviewComplete set to true.");
  }, [mediaStream, answers, config, questions]);

  // Cleanup function for media stream when component unmounts
  useEffect(() => {
    return () => {
      if (mediaStream) {
        try {
          mediaStream.getTracks().forEach(track => track.stop());
        } catch (error) {
          console.error('Error stopping media tracks on unmount:', error);
        }
      }
    };
  }, [mediaStream]);

  const startInterview = useCallback(async (options?: InterviewStartOptions): Promise<void> => {
    console.log("[InterviewContext] Attempting to start interview. Options:", options);
    console.log("[InterviewContext] Current config state BEFORE setConfig:", config);

    setIsLoadingQuestions(true);
    setIsInitializingMedia(true);
    setIsInterviewComplete(false); // Reset completion status
    setResult(null); // Clear previous results
    setAnswers([]); // Clear previous answers
    
    // Determine if this is an HR scheduled interview and set the flag
    // Explicit `isHrScheduled: false` in options will mark it as not HR scheduled even if interviewId is present.
    // If `isHrScheduled` is undefined in options, but `interviewId` is present, assume it's HR scheduled.
    const hrScheduledCheck = options?.isHrScheduled !== undefined ? options.isHrScheduled : !!options?.interviewId;
    setIsHrScheduledInterview(hrScheduledCheck);
    console.log(`[InterviewContext] Is HR Scheduled Interview: ${hrScheduledCheck}`);

    // Store interview ID if provided (relevant for both HR scheduled and potentially rejoining practice)
    if (options?.interviewId) {
      console.log("[InterviewContext] Setting current interview ID in sessionStorage:", options.interviewId);
      sessionStorage.setItem('currentInterviewId', options.interviewId);
    } else {
      sessionStorage.removeItem('currentInterviewId'); // Clear if no ID provided (new practice session)
    }

    let questionCount = DEFAULT_PRACTICE_QUESTION_COUNT;

    if (hrScheduledCheck) { // If determined to be an HR scheduled interview
        if (options?.durationInSeconds && options.durationInSeconds > 0) {
            questionCount = Math.max(1, Math.floor(options.durationInSeconds / QUESTION_TIME_LIMIT_SECONDS));
            console.log(`[InterviewContext] HR Scheduled. Duration: ${options.durationInSeconds}s, Calculated Question Count: ${questionCount}`);
        } else {
            // TODO: In a real scenario, fetch interview details from backend using options.interviewId
            // This fetch would provide duration, jobRole, experienceLevel.
            // For now, if durationInSeconds is not provided with interviewId, use a default for scheduled.
            questionCount = DEFAULT_SCHEDULED_QUESTION_COUNT;
            console.log(`[InterviewContext] HR Scheduled (ID: ${options?.interviewId || 'N/A'}) but no duration provided. Using default scheduled count: ${questionCount}`);
        }
    } else {
        // This is a practice interview (not HR scheduled)
        console.log(`[InterviewContext] Practice Interview. Using default practice count: ${questionCount}`);
    }
    
    // Determine the config for this interview session
    let sessionConfig: InterviewConfig | null = null;
    if (options?.jobRole && options?.experienceLevel) {
      sessionConfig = {
        jobRole: options.jobRole,
        experienceLevel: options.experienceLevel
      };
      setConfig(sessionConfig); // Update context state
      console.log("[InterviewContext] Config set from options:", sessionConfig);
    } else if (config) {
      sessionConfig = config; // Use existing context config if options not provided
      console.log("[InterviewContext] Using existing config state:", sessionConfig);
    } else {
      console.error("[InterviewContext] No job role or experience level provided, and no existing config. Cannot fetch questions.");
      // Fallback to generic mock questions if no config can be determined
      const defaultQuestions = [
        { id: getRandomId(), text: "No role/level selected. Tell me about yourself." },
      ];
      setQuestions(defaultQuestions);
      setIsLoadingQuestions(false);
      setIsInitializingMedia(false);
      setIsInterviewInProgress(true); // Or handle this state differently
      return;
    }
    
    // Handle media stream initialization
    if (options?.mediaStream) {
      setMediaStream(options.mediaStream);
      console.log("[InterviewContext] Media stream provided via options.");
    } else {
      try {
        console.log("[InterviewContext] Requesting media stream via navigator.mediaDevices.getUserMedia");
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setMediaStream(userStream);
        setMediaStreamError(null);
        console.log("[InterviewContext] Media stream acquired successfully.");
      } catch (error) {
        console.error("[InterviewContext] Error getting media stream:", error);
        setMediaStreamError(error instanceof Error ? error.message : "Unknown media stream error");
      }
    }
    
    // Try to fetch questions from API first
    console.log("[InterviewContext] Attempting to fetch questions from API.");
    try {
      const roleToFetch = sessionConfig.jobRole; // Use sessionConfig which is guaranteed to be set if we reach here
      const levelToFetch = sessionConfig.experienceLevel;

      console.log(`[InterviewContext] Fetching questions for role: ${roleToFetch}, level: ${levelToFetch}`);
      
      const apiRequestBody = {
        jobRole: roleToFetch,
        experienceLevel: levelToFetch,
        count: questionCount // Use the determined questionCount
      };
      console.log("[InterviewContext] API Request Body:", apiRequestBody);

      const response = await fetch('/api/interviews/gemini/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequestBody),
      });

      console.log(`[InterviewContext] API Response Status: ${response.status}, OK: ${response.ok}`);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          console.error("[InterviewContext] API Error Response Data:", errorData);
        } catch (e) {
          errorData = { message: `Failed to fetch questions: ${response.status}. Could not parse error response.` };
          console.error("[InterviewContext] API Error: Could not parse error response body.");
        }
        throw new Error(errorData.message || `Failed to fetch questions: ${response.status}`);
      }

      const data = await response.json();
      console.log("[InterviewContext] Data received from API:", data);
      
      if (data.questions && Array.isArray(data.questions)) {
        const formattedQuestions: InterviewQuestion[] = data.questions.map((text: string) => ({
          id: getRandomId(),
          text,
        }));
        setQuestions(formattedQuestions);
        console.log("[InterviewContext] Successfully fetched and set questions from API:", formattedQuestions);
      } else {
        console.error("[InterviewContext] Invalid question format received from API:", data);
        throw new Error("Invalid question format received from API");
      }

    } catch (error) {
      console.error("[InterviewContext] Error fetching questions from API, falling back to mock:", error);
      
      // Use sessionConfig for fallback, which should be set
      if (sessionConfig) {
        console.log("[InterviewContext] Using mock questions as fallback for:", sessionConfig);
        const mock = MOCK_QUESTIONS[sessionConfig.jobRole]?.[sessionConfig.experienceLevel] || [];
        const mockQuestions = mock.map(text => ({
          id: getRandomId(),
          text
        }));
        setQuestions(mockQuestions.length > 0 ? mockQuestions : [
          { id: getRandomId(), text: `Mock questions for ${sessionConfig.jobRole}/${sessionConfig.experienceLevel} not defined. Tell me about a project you are proud of.`}
        ]);
      } else {
        // This case should ideally not be reached if sessionConfig logic above is correct
        console.error("[InterviewContext] No sessionConfig available for mock questions fallback, using generic defaults.");
        const defaultQuestions = [
          { id: getRandomId(), text: "Tell me about yourself and your background (generic default)." },
        ];
        setQuestions(defaultQuestions);
      }
    } finally {
      setCurrentQuestionIndex(0);
      setIsInterviewInProgress(true);
      setIsLoadingQuestions(false);
      setIsInitializingMedia(false);
      console.log("[InterviewContext] startInterview finished processing.");
    }
  }, [config]);
  
  // Analyze answer with Gemini
  const analyzeAnswer = async (question: string, answer: string, jobRole?: JobRole, experienceLevel?: ExperienceLevel) => {
    console.log("[InterviewContext] analyzeAnswer called. Question:", question, "Answer:", answer.substring(0, 50) + "...", "Role:", jobRole, "Level:", experienceLevel);
    try {
      const requestBody = {
        question,
        answer,
        jobRole: jobRole || config?.jobRole,
        experienceLevel: experienceLevel || config?.experienceLevel
      };
      console.log("[InterviewContext] analyzeAnswer - Request Body to /api/interviews/gemini/analyze:", requestBody);

      const response = await fetch('/api/interviews/gemini/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      console.log(`[InterviewContext] analyzeAnswer - API Response Status: ${response.status}, OK: ${response.ok}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to analyze answer: ${response.status}` }));
        console.error("[InterviewContext] analyzeAnswer - API Error Data:", errorData);
        throw new Error(errorData.message || `Failed to analyze answer: ${response.status}`);
      }
      
      const analysisResult = await response.json();
      console.log("[InterviewContext] analyzeAnswer - Successfully received analysis:", analysisResult);
      return analysisResult; // Expected: { score: number (0-100), feedback: string, strengths?: string[], weaknesses?: string[] }
    } catch (error) {
      console.error('[InterviewContext] Error in analyzeAnswer:', error);
      // Return mock analysis if API fails
      const mockAnalysis = {
        score: Math.floor(Math.random() * 21) + 50, // 50-70 range for mock error
        feedback: "Error analyzing your answer with the AI service. This is fallback feedback.",
        strengths: [],
        weaknesses: ["AI analysis unavailable"]
      };
      console.log("[InterviewContext] analyzeAnswer - Returning mock analysis due to error:", mockAnalysis);
      return mockAnalysis;
    }
  };

  // Add a method to retry getting the media stream
  const retryMediaStream = useCallback(async () => {
    setIsInitializingMedia(true);
    setMediaStreamError(null);
    
    try {
      console.log("Retrying media stream request");
      // Stop any existing tracks first
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      
      const userStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setMediaStream(userStream);
      setMediaStreamError(null);
      return true;
    } catch (error) {
      console.error("Error retrying media stream:", error);
      setMediaStreamError(error instanceof Error ? error.message : "Unknown media stream error");
      return false;
    } finally {
      setIsInitializingMedia(false);
    }
  }, [mediaStream]);

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Update saveAnswer to analyze the answer with Gemini
  const saveAnswer = async (answerData: Omit<InterviewAnswer, 'score' | 'feedback' | 'strengths' | 'weaknesses'>) => {
    console.log("[InterviewContext] saveAnswer called for questionId:", answerData.questionId, "Answer text:", answerData.text.substring(0,50)+"...");
    if (!config || !questions[currentQuestionIndex]) {
      console.warn("[InterviewContext] saveAnswer - No config or current question, cannot save/analyze.");
      return;
    }
    
    try {
      let finalAnswerData: InterviewAnswer;
      if (answerData.text && answerData.text.trim().length > 10) { // Only analyze if there's meaningful text content
        const questionText = questions[currentQuestionIndex].text;
        console.log("[InterviewContext] saveAnswer - Meaningful answer, proceeding to analyze.");
        const analysis = await analyzeAnswer(questionText, answerData.text, config.jobRole, config.experienceLevel);
        
        finalAnswerData = {
          ...answerData,
          score: analysis.score, // score should be 0-100 from analyzeAnswer
          feedback: analysis.feedback,
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || []
        };
        console.log("[InterviewContext] saveAnswer - Answer analyzed. Score:", finalAnswerData.score, "Feedback:", finalAnswerData.feedback);
      } else {
        console.log("[InterviewContext] saveAnswer - Answer too short or empty, saving without AI analysis.");
        finalAnswerData = {
          ...answerData,
          score: 0, // Default score for unanalyzed answers
          feedback: "Answer was too short for analysis.",
          strengths: [],
          weaknesses: []
        };
      }
        
      setAnswers(prevAnswers => {
        const existingIndex = prevAnswers.findIndex(a => a.questionId === answerData.questionId);
        let updatedAnswers;
        if (existingIndex >= 0) {
          updatedAnswers = [...prevAnswers];
          updatedAnswers[existingIndex] = { ...updatedAnswers[existingIndex], ...finalAnswerData };
          console.log("[InterviewContext] saveAnswer - Updated existing answer for questionId:", answerData.questionId);
        } else {
          updatedAnswers = [...prevAnswers, finalAnswerData];
          console.log("[InterviewContext] saveAnswer - Added new answer for questionId:", answerData.questionId);
        }
        console.log("[InterviewContext] saveAnswer - Updated answers state:", JSON.parse(JSON.stringify(updatedAnswers)));
        return updatedAnswers;
      });
    } catch (error) {
      console.error('[InterviewContext] Error in saveAnswer:', error);
      // Still save the basic answer even if analysis fails catastrophically (should be caught by analyzeAnswer's try/catch)
      setAnswers(prevAnswers => {
        const existingIndex = prevAnswers.findIndex(a => a.questionId === answerData.questionId);
        if (existingIndex >= 0) {
          const updated = [...prevAnswers];
          updated[existingIndex] = { ...updated[existingIndex], ...answerData, score: 0, feedback: "Error during analysis." };
          return updated;
        } else {
          return [...prevAnswers, { ...answerData, score: 0, feedback: "Error during analysis." } as InterviewAnswer];
        }
      });
    }
  };

  return (
    <InterviewContext.Provider
      value={{
        config,
        setConfig,
        questions,
        currentQuestionIndex,
        answers,
        result,
        mediaStream,
        isLoadingQuestions,
        startInterview,
        nextQuestion,
        previousQuestion,
        saveAnswer,
        finishInterview,
        isInterviewInProgress,
        isInterviewComplete,
        mediaStreamError,
        isInitializingMedia,
        retryMediaStream,
        isHrScheduledInterview, // Added missing property
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};