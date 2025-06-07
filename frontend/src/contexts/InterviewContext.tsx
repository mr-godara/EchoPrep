import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getRandomId } from '../lib/utils.js';

// Define constants for question counts and time limits
const QUESTION_TIME_LIMIT_SECONDS = 180; // 3 minutes per question
const DEFAULT_PRACTICE_QUESTION_COUNT = 10; 
const DEFAULT_SCHEDULED_QUESTION_COUNT = 5; 

// Define the types
export type JobRole = 'web-developer' | 'app-developer' | 'ml-ai' | 'ux-designer' | 'data-scientist';
export type ExperienceLevel = 'fresher' | 'junior' | 'mid-level' | 'senior';

export interface InterviewConfig {
  jobRole: JobRole;
  experienceLevel: ExperienceLevel;
}

export interface InterviewStartOptions {
  mediaStream?: MediaStream;
  jobRole?: JobRole;
  experienceLevel?: ExperienceLevel;
  interviewId?: string; 
  durationInSeconds?: number; 
  isHrScheduled?: boolean; 
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
  score?: number; 
  feedback?: string;
  strengths?: string[];
  weaknesses?: string[];
  questionText?: string; 
}

export interface InterviewResult {
  totalScore: number; 
  answers: InterviewAnswer[];
  feedback: string;
  cheatingDetected: boolean;
  strengths: string[];
  improvements: string[];
  date: Date;
  isHrScheduled?: boolean; 
}

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
  saveAnswer: (answer: Omit<InterviewAnswer, 'score' | 'feedback' | 'strengths' | 'weaknesses'>) => Promise<void>;
  finishInterview: () => void;
  isInterviewInProgress: boolean;
  isInterviewComplete: boolean;
  mediaStreamError: string | null;
  isInitializingMedia: boolean;
  retryMediaStream: () => Promise<boolean>;
  isHrScheduledInterview: boolean; 
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
  const [isHrScheduledInterview, setIsHrScheduledInterview] = useState(false); 
  const API_BASE_URL = import.meta.env.VITE_API_URL;

  const finishInterview = useCallback(async () => {
    if (mediaStream) {
      try {
        mediaStream.getTracks().forEach(track => {
          track.stop();
        });
      } catch (error) {
        console.error('[InterviewContext] Error stopping media tracks:', error);
      }
      setMediaStream(null);
    }
    
    if (answers.length > 0 && config) {
      const answersWithScores = answers.filter(answer => answer.score !== undefined);
      const totalScore = answersWithScores.length > 0
        ? Math.round(answersWithScores.reduce((sum, answer) => sum + (answer.score || 0), 0) / answersWithScores.length)
        : 0;

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
      
      const finalAnswers = questions.map(question => {
        const existingAnswer = answers.find(a => a.questionId === question.id);
        if (existingAnswer) {
          return {
            ...existingAnswer,
            questionText: question.text, 
          };
        } else {
          return {
            questionId: question.id,
            questionText: question.text,
            text: "Skipped", 
            score: 0, 
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
        cheatingDetected: false, 
        strengths: uniqueStrengths,
        improvements: uniqueImprovements,
        date: new Date(),
        isHrScheduled: isHrScheduledInterview, 
      };
      
      setResult(resultToSave);
      
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
        } else if (storedRoomId) {
          interviewRoomId = storedRoomId;
        } else if (sessionInterviewId) {
          interviewRoomId = sessionInterviewId;
        }
        
        if (token && config) { 
          if (interviewRoomId) {
            try {
              const completeResponse = await fetch(`${API_BASE_URL}/api/interviews/room/${interviewRoomId}/complete`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
              });
              if (!completeResponse.ok) {
                console.error("[InterviewContext] Failed to mark interview as completed via room ID. Status:", completeResponse.status);
                try {
                    const autoCompleteResponse = await fetch(`${API_BASE_URL}/api/interviews/auto-complete/${interviewRoomId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                    });
                    if (!autoCompleteResponse.ok) {
                        console.error("[InterviewContext] Failed to mark interview as completed via auto-complete. Status:", autoCompleteResponse.status);
                    }
                } catch (autoCompleteErr) {
                    console.error('[InterviewContext] Error with direct interview auto-completion API call:', autoCompleteErr);
                }
              }
            } catch (roomErr) {
              console.error('[InterviewContext] Error calling complete interview room API:', roomErr);
            }
          }
          
          const backendPayload = {
            interviewId: interviewRoomId || undefined, 
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
          
          fetch(`${API_BASE_URL}/api/interview-results`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(backendPayload)
          }).then(response => {
            if (!response.ok) {
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
      setResult(null); 
    }
    
    setIsInterviewInProgress(false);
    setCurrentQuestionIndex(0);
    setIsInterviewComplete(true);
  }, [mediaStream, answers, config, questions, isHrScheduledInterview, API_BASE_URL]);

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
    setIsLoadingQuestions(true);
    setIsInitializingMedia(true);
    setIsInterviewComplete(false); 
    setResult(null); 
    setAnswers([]); 
    
    const hrScheduledCheck = options?.isHrScheduled !== undefined ? options.isHrScheduled : !!options?.interviewId;
    setIsHrScheduledInterview(hrScheduledCheck);

    if (options?.interviewId) {
      sessionStorage.setItem('currentInterviewId', options.interviewId);
    } else {
      sessionStorage.removeItem('currentInterviewId'); 
    }

    let questionCount = DEFAULT_PRACTICE_QUESTION_COUNT;

    if (hrScheduledCheck) { 
        if (options?.durationInSeconds && options.durationInSeconds > 0) {
            questionCount = Math.max(1, Math.floor(options.durationInSeconds / QUESTION_TIME_LIMIT_SECONDS));
        } else {
            questionCount = DEFAULT_SCHEDULED_QUESTION_COUNT;
        }
    }
    
    let sessionConfig: InterviewConfig | null = null;
    if (options?.jobRole && options?.experienceLevel) {
      sessionConfig = {
        jobRole: options.jobRole,
        experienceLevel: options.experienceLevel
      };
      setConfig(sessionConfig); 
    } else if (config) {
      sessionConfig = config; 
    } else {
      console.error("[InterviewContext] No job role or experience level provided, and no existing config. Cannot fetch questions.");
      const defaultQuestions = [
        { id: getRandomId(), text: "No role/level selected. Tell me about yourself." },
      ];
      setQuestions(defaultQuestions);
      setIsLoadingQuestions(false);
      setIsInitializingMedia(false);
      setIsInterviewInProgress(true); 
      return;
    }
    
    if (options?.mediaStream) {
      setMediaStream(options.mediaStream);
    } else {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setMediaStream(userStream);
        setMediaStreamError(null);
      } catch (error) {
        console.error("[InterviewContext] Error getting media stream:", error);
        setMediaStreamError(error instanceof Error ? error.message : "Unknown media stream error");
      }
    }
    
    try {
      const roleToFetch = sessionConfig.jobRole; 
      const levelToFetch = sessionConfig.experienceLevel;
      
      const apiRequestBody = {
        jobRole: roleToFetch,
        experienceLevel: levelToFetch,
        count: questionCount 
      };

      const response = await fetch(`${API_BASE_URL}/api/interviews/gemini/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiRequestBody),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.questions)) {
          const formattedQuestions: InterviewQuestion[] = data.questions.map((text: string) => ({
            id: getRandomId(),
            text,
          }));
          setQuestions(formattedQuestions);
        } else {
          throw new Error('Invalid question format from API');
        }
      } else {
        throw new Error(`API request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error("[InterviewContext] Error fetching questions from API, falling back to mock:", error);
      
      if (sessionConfig) {
        const mock = MOCK_QUESTIONS[sessionConfig.jobRole]?.[sessionConfig.experienceLevel] || [];
        const mockQuestions = mock.map(text => ({
          id: getRandomId(),
          text
        }));
        setQuestions(mockQuestions.length > 0 ? mockQuestions : [
          { id: getRandomId(), text: `Mock questions for ${sessionConfig.jobRole}/${sessionConfig.experienceLevel} not defined. Tell me about a project you are proud of.`}
        ]);
      } else {
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
    }
  }, [config, isHrScheduledInterview, API_BASE_URL]); 
  
  const analyzeAnswer = async (question: string, answer: string, jobRole?: JobRole, experienceLevel?: ExperienceLevel) => {
    try {
      const requestBody = {
        question,
        answer,
        jobRole: jobRole || config?.jobRole,
        experienceLevel: experienceLevel || config?.experienceLevel
      };

      const response = await fetch(`${API_BASE_URL}/api/interviews/gemini/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Failed to analyze answer: ${response.status}` }));
        console.error("[InterviewContext] analyzeAnswer - API Error Data:", errorData);
        throw new Error(errorData.message || `Failed to analyze answer: ${response.status}`);
      }
      
      const analysisResult = await response.json();
      return analysisResult; 
    } catch (error) {
      console.error('[InterviewContext] Error in analyzeAnswer:', error);
      const mockAnalysis = {
        score: Math.floor(Math.random() * 21) + 50, 
        feedback: "Error analyzing your answer with the AI service. This is fallback feedback.",
        strengths: [],
        weaknesses: ["AI analysis unavailable"]
      };
      return mockAnalysis;
    }
  };

  const retryMediaStream = useCallback(async () => {
    setIsInitializingMedia(true);
    setMediaStreamError(null);
    
    try {
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

  const saveAnswer = async (answerData: Omit<InterviewAnswer, 'score' | 'feedback' | 'strengths' | 'weaknesses'>) => {
    if (!config || !questions[currentQuestionIndex]) {
      console.warn("[InterviewContext] saveAnswer - No config or current question, cannot save/analyze.");
      return;
    }
    
    try {
      let finalAnswerData: InterviewAnswer;
      if (answerData.text && answerData.text.trim().length > 10) { 
        const questionText = questions[currentQuestionIndex].text;
        const analysis = await analyzeAnswer(questionText, answerData.text, config.jobRole, config.experienceLevel);
        
        finalAnswerData = {
          ...answerData,
          questionText, 
          score: analysis.score, 
          feedback: analysis.feedback,
          strengths: analysis.strengths || [],
          weaknesses: analysis.weaknesses || []
        };
      } else {
        finalAnswerData = {
          ...answerData,
          questionText: questions[currentQuestionIndex].text, 
          score: 0, 
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
        } else {
          updatedAnswers = [...prevAnswers, finalAnswerData];
        }
        return updatedAnswers;
      });
    } catch (error) {
      console.error('[InterviewContext] Error in saveAnswer:', error);
      setAnswers(prevAnswers => {
        const existingIndex = prevAnswers.findIndex(a => a.questionId === answerData.questionId);
        const basicAnswerData = {
            ...answerData,
            questionText: questions[currentQuestionIndex]?.text || "Unknown question",
            score: 0,
            feedback: "Error during analysis."
        };
        if (existingIndex >= 0) {
          const updated = [...prevAnswers];
          updated[existingIndex] = { ...updated[existingIndex], ...basicAnswerData };
          return updated;
        } else {
          return [...prevAnswers, basicAnswerData as InterviewAnswer];
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
        isHrScheduledInterview, 
      }}
    >
      {children}
    </InterviewContext.Provider>
  );
};