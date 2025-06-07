import { useState, useEffect, useRef } from 'react'; // Removed React
import { useNavigate } from 'react-router-dom';
import { useInterview } from '../contexts/InterviewContext';
import QuestionDisplay from '../components/Interview/QuestionDisplay';
import ProgressBar from '../components/Interview/ProgressBar';
import QuestionNavigation from '../components/Interview/QuestionNavigation';
import { formatTime } from '../utils/formatters';
import classNames from 'classnames';

// Define typings for SpeechRecognition API which is missing from TS definitions
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition;
    webkitSpeechRecognition?: new () => SpeechRecognition;
  }
}

// Define types for Gemini API responses (Currently unused, remove if not planned for this page)
// interface GeminiQuestionResponse {
//   question: string;
//   context?: string;
// }

// interface GeminiAnalysisResponse {
//   score: number;
//   feedback: string;
//   strengths: string[];
//   weaknesses: string[];
// }

const QUESTION_TIME_LIMIT = 180; // 3 minutes per question
const CAMERA_RETRY_ATTEMPTS = 3;
const CAMERA_RETRY_DELAY = 1000;

const InterviewPage = () => {
  const navigate = useNavigate();
  const {
    questions,
    currentQuestionIndex,
    answers,
    nextQuestion,
    previousQuestion,
    saveAnswer,
    finishInterview,
    isInterviewInProgress,
    mediaStream,
    isLoadingQuestions,
    startInterview,
    mediaStreamError,
    isInitializingMedia,
    retryMediaStream
  } = useInterview();
  
  // Check if questions array is valid and has items
  const hasQuestions = Array.isArray(questions) && questions.length > 0;
  // Safely get current question
  const currentQuestion = hasQuestions && currentQuestionIndex >= 0 && currentQuestionIndex < questions.length 
    ? questions[currentQuestionIndex] 
    : null;
  
  const [isRecording, setIsRecording] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(QUESTION_TIME_LIMIT);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraConnected, setCameraConnected] = useState(false);
  const [initialStartupComplete, setInitialStartupComplete] = useState(false);
  
  const timerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const interimTranscriptRef = useRef<string>('');
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  // State for recording functionality
  // const [recordingTime, setRecordingTime] = useState(0); // recordingTime is unread, setRecordingTime is used.
                                                          // If recordingTime is not needed for display/logic, remove both.
                                                          // For now, addressing the direct "unread" error.
                                                          // Let's assume setRecordingTime is still needed for the timer logic.
  const [, setRecordingTime] = useState(0); // Keep setter if logic depends on it, remove value if unread.
  const [answer, setAnswer] = useState('');
  
  // UI status states
  const [isReading, setIsReading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Add a state to track if we've already auto-read the first question
  const [hasReadFirstQuestion, setHasReadFirstQuestion] = useState(false);
  
  // Track which questions have been read already
  const [spokenQuestionIds, setSpokenQuestionIds] = useState<Set<string>>(new Set());
  
  // Add state for camera setup attempts
  const [cameraAttempts, setCameraAttempts] = useState(0);
  const [isCameraSetupFailed, setIsCameraSetupFailed] = useState(false);
  
  // Add overall interview time tracking
  // const [totalInterviewTime, setTotalInterviewTime] = useState(0); // totalInterviewTime is unread.
                                                                  // setTotalInterviewTime is used.
                                                                  // If not displayed here, remove.
  const [, setTotalInterviewTime] = useState(0); // Keep setter, remove value if unread on this page.
  const [interviewTimeRemaining, setInterviewTimeRemaining] = useState(0);
  const [isInterviewTimeInitialized, setIsInterviewTimeInitialized] = useState(false);
  
  const interviewTimerRef = useRef<number | null>(null);
  
  // Modified initial startup with camera retry logic
  useEffect(() => {
    // console.log("Initial startup effect running");
    // Set a flag after initial render to prevent immediate redirects
    // and give time for camera initialization
    const initTimer = setTimeout(() => {
      setInitialStartupComplete(true);
    }, 3000); // Increased to 3 seconds to give more time for camera setup
    
    return () => clearTimeout(initTimer);
  }, []);
  
  // Try to request media access if it wasn't provided by the context
  useEffect(() => {
    // Only run if we have no media stream, interview is in progress, not loading questions,
    // not currently initializing media, and haven't exhausted retry attempts.
    if (!mediaStream && isInterviewInProgress && !isLoadingQuestions && !isInitializingMedia && cameraAttempts < CAMERA_RETRY_ATTEMPTS) {
      const attemptToGetMediaViaContext = async () => {
        // console.log(`[InterviewPage] Attempting to get media via context retry (attempt ${cameraAttempts + 1} of ${CAMERA_RETRY_ATTEMPTS})`);
        const success = await retryMediaStream(); // This function is from useInterview context
        if (success) {
          // console.log("[InterviewPage] retryMediaStream reported success. Video setup effect should run.");
          // setCameraAttempts(0); // Optionally reset attempts on success
        } else {
          console.warn(`[InterviewPage] retryMediaStream reported failure on attempt ${cameraAttempts + 1}.`);
          const nextAttempts = cameraAttempts + 1;
          setCameraAttempts(nextAttempts);
          if (nextAttempts >= CAMERA_RETRY_ATTEMPTS) {
            setIsCameraSetupFailed(true);
            console.error("[InterviewPage] All camera retry attempts via context failed.");
          }
        }
      };

      // Add a delay before trying to get camera access again.
      // Increase delay for subsequent attempts to avoid hammering the API or browser.
      const delay = CAMERA_RETRY_DELAY * (cameraAttempts + 1);
      // console.log(`[InterviewPage] Scheduling media retry attempt ${cameraAttempts + 1} in ${delay}ms.`);
      const retryTimer = setTimeout(() => {
        attemptToGetMediaViaContext();
      }, delay);

      return () => clearTimeout(retryTimer);
    }
  }, [mediaStream, isInterviewInProgress, isLoadingQuestions, cameraAttempts, retryMediaStream, isInitializingMedia]);
  
  // Enhanced video setup with improved troubleshooting
  useEffect(() => {
    // console.log("Media stream status:", mediaStream ? "Available" : "Not available");
    
    if (mediaStream && videoRef.current) {
      // console.log("Setting up video element with media stream");
      try {
        // Set the srcObject property
        videoRef.current.srcObject = mediaStream;
        
        // Ensure all required attributes are set
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        
        // Explicitly start playing the video
        const playPromise = videoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // console.log("Video playback started successfully");
              setCameraConnected(true);

              // Auto-speak the FIRST question only after video has successfully started
              if (
                currentQuestion &&
                currentQuestion.id &&
                currentQuestionIndex === 0 && // Only for the very first question
                !spokenQuestionIds.has(currentQuestion.id) &&
                !isReading // Check if not already reading (e.g. user clicked button)
              ) {
                // Ensure timer is clear before speaking first question
                if (timerRef.current) {
                    window.clearInterval(timerRef.current);
                    timerRef.current = null;
                    // console.log("[InterviewPage] Video effect: Explicitly cleared timerRef before speaking first question.");
                }
                // console.log(`[InterviewPage] Video started, auto-speaking first question ID: ${currentQuestion.id}`);
                readQuestionAloud();
                setSpokenQuestionIds(prev => {
                  const updated = new Set(prev);
                  updated.add(currentQuestion.id); // Mark as spoken
                  return updated;
                });
              }
            })
            .catch(err => {
              console.error("Error playing video:", err);
              // Try one more time with a delay
              setTimeout(() => {
                if (videoRef.current) {
                  // console.log("Attempting to play video again...");
                  videoRef.current.play()
                    .then(() => setCameraConnected(true))
                    .catch(e => {
                      console.error("Second attempt to play video failed:", e);
                      setCameraConnected(false);
                    });
                }
              }, 1000);
            });
        }
      } catch (err) {
        console.error("Error setting up video element:", err);
        setCameraConnected(false);
      }
    } else if (!mediaStream) {
      console.warn("No media stream available for camera preview");
      setCameraConnected(false);
    } else if (!videoRef.current) {
      console.warn("Video element reference not available");
      setCameraConnected(false);
        }
    
    // Check if we have access to required browser APIs
    if (!('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) ||
        !('speechSynthesis' in window)) {
      console.warn('Speech recognition or synthesis not supported in this browser');
    }

    // Return cleanup function
    return () => {
      // Clean up any streams in the video element
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          // const stream = videoRef.current.srcObject as MediaStream; // Tracks are managed by InterviewContext
          // if (stream && typeof stream.getTracks === 'function') {
          //   stream.getTracks().forEach(track => track.stop()); // Do NOT stop tracks here; context handles it
          // }
          videoRef.current.srcObject = null; // Only detach from this element
        } catch (e) {
          console.error('Error cleaning up video stream:', e);
        }
      }
      
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {
          console.error('Error stopping speech recognition:', e);
        }
      }
      if (synthesisRef.current && window.speechSynthesis.speaking) {
        try {
          window.speechSynthesis.cancel();
        } catch (e) {
          console.error('Error cancelling speech synthesis:', e);
        }
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [mediaStream, isLoading, currentQuestion]);
  
  // Updated redirect for interview not in progress with better timing and camera failure
  useEffect(() => {
    if (initialStartupComplete && !isInterviewInProgress && !isLoadingQuestions) {
      // console.log("Interview not in progress, redirecting to setup");
      navigate('/setup', { state: { error: 'Interview not started or timed out' } });
      return;
    }
    
    // If camera setup failed after all attempts, still allow the interview but show a message
    if (isCameraSetupFailed && initialStartupComplete) {
      console.warn("Camera setup failed, but proceeding with interview without camera");
      // You could show a message to the user here
    }
    
    // Set loading to false after a short delay to ensure other resources are loaded
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [isInterviewInProgress, isLoadingQuestions, navigate, initialStartupComplete, isCameraSetupFailed]);
  
  // Effect to reset state when the current question changes
  useEffect(() => {
    if (currentQuestion && currentQuestion.id) {
      const existingAnswer = answers.find(a => a.questionId === currentQuestion.id);
      setAnswer(existingAnswer?.text || '');
      
      // Reset visual time remaining for the question
      setTimeRemaining(QUESTION_TIME_LIMIT);
      
      // Clear any existing timer interval ONLY when the question ID actually changes
      if (timerRef.current) {
        // console.log(`[InterviewPage] New question (ID: ${currentQuestion.id}), clearing existing timerRef: ${timerRef.current}`);
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [currentQuestion?.id, answers]); // Depend on currentQuestion.id and answers

  // Effect to auto-speak subsequent questions (first question speech handled by video effect)
  useEffect(() => {
    if (currentQuestion && currentQuestion.id &&
        !spokenQuestionIds.has(currentQuestion.id) &&
        cameraConnected &&
        !isReading) {
      
      // Ensure timer is clear before attempting to auto-speak subsequent questions
      if (timerRef.current) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
          // console.log(`[InterviewPage] Auto-speak effect: Explicitly cleared timerRef before speaking QID: ${currentQuestion.id}`);
      }
      // This check ensures this effect primarily handles questions *after* the first,
      // or the first if the video effect didn't manage to speak it and set spokenQuestionIds.
      // The video effect should set spokenQuestionIds for the first question.
      // console.log(`[InterviewPage] Auto-speak check for QID: ${currentQuestion.id}. Spoken: ${spokenQuestionIds.has(currentQuestion.id)}, Camera: ${cameraConnected}, Not Reading: ${!isReading}`);

      // Small delay to ensure UI is updated and video is stable before speaking
      const speakTimeout = setTimeout(() => {
        // Double-check conditions inside timeout, especially isReading and spokenQuestionIds
        if (currentQuestion && currentQuestion.id && !spokenQuestionIds.has(currentQuestion.id) && !isReading) {
          // console.log(`[InterviewPage] Auto-speaking question ${currentQuestionIndex + 1} (QID: ${currentQuestion.id}) from dedicated auto-speak useEffect.`);
          readQuestionAloud();
          setSpokenQuestionIds(prev => {
            const updated = new Set(prev);
            updated.add(currentQuestion.id);
            return updated;
          });
        } else {
          // console.log(`[InterviewPage] Auto-speak conditions no longer met in timeout for QID: ${currentQuestion?.id}. Spoken: ${spokenQuestionIds.has(currentQuestion?.id || '')}, Not Reading: ${!isReading}`);
        }
      }, 800);
      
      return () => clearTimeout(speakTimeout);
    }
  }, [currentQuestion, spokenQuestionIds, cameraConnected, isReading, currentQuestionIndex]);

  // Handler for reading question aloud
  const readQuestionAloud = () => {
    if (!currentQuestion || !currentQuestion.text || !('speechSynthesis' in window)) return;
    
    // Cancel any ongoing speech
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error('Error cancelling previous speech:', e);
    }
    
    // Set reading state to prevent multiple reads
    setIsReading(true);
    
    const utterance = new SpeechSynthesisUtterance(currentQuestion.text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Get available voices and set a neutral voice if available
    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      // Try to find a neutral English voice
      const englishVoice = voices.find(voice => 
        voice.lang.includes('en') && !voice.name.includes('Google')
      );
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
    }
    
    utterance.onstart = () => {
      // console.log('Started speaking question');
      setIsReading(true);
    };
    
    utterance.onend = () => {
      // console.log('Finished speaking question');
      setIsReading(false);
      // Automatically start recording (which includes the timer) if:
      // 1. Not already recording.
      // 2. The currentQuestion (that was just read) is still the active question.
      // 3. No answer text has been saved for this question yet.
      // This prevents auto-start if user navigated away, or if question changed during speech,
      // or if they've already started answering.
      if (currentQuestion && currentQuestion.id && !isRecording && synthesisRef.current?.text === currentQuestion.text) {
        const existingAnswerForCurrentQuestion = answers.find(a => a.questionId === currentQuestion.id);
        if (!existingAnswerForCurrentQuestion?.text) {
            // console.log(`[InterviewPage] Auto-starting recording & timer for question ID ${currentQuestion.id} as it finished speaking.`);
            startRecording();
        } else {
            // console.log(`[InterviewPage] Question ID ${currentQuestion.id} finished speaking, but an answer already exists. Not auto-starting.`);
        }
      } else {
          // Original if conditions were for logging only and are now empty.
          // // console.log("[InterviewPage] Question finished speaking, but currentQuestion is invalid.");
          // // console.log("[InterviewPage] Question finished speaking, but recording is already active.");
          // // console.log("[InterviewPage] Question finished speaking, but active question seems to have changed or utterance mismatch.");
      }
    };
    
    utterance.onerror = (e) => {
      console.error('Speech synthesis error:', e);
      setIsReading(false);
    };
    
    synthesisRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Initialize speech recognition
  const initializeSpeechRecognition = () => {
    // Handle compatibility issues across browsers
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return null;
    
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (finalTranscript) {
          setAnswer(prev => prev + ' ' + finalTranscript);
        }
        
        interimTranscriptRef.current = interimTranscript;
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
      };
      
      return recognition;
    } catch (e) {
      console.error('Error initializing speech recognition:', e);
      return null;
    }
  };

  // Start recording answer
  const startRecording = () => {
    // console.log(`[InterviewPage] startRecording called. isRecording: ${isRecording}, timerRef.current: ${timerRef.current}`);
    if (isRecording) {
      // console.log("[InterviewPage] startRecording: Already recording, returning.");
      return;
    }
    
    // Initialize speech recognition if needed
    if (!speechRecognitionRef.current) {
      speechRecognitionRef.current = initializeSpeechRecognition();
    }
    
    // Start speech recognition if available
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.start();
      } catch (e) {
        console.error('Error starting speech recognition:', e);
      }
    }
    
    // Start timer for this question
    if (timerRef.current === null) {
      // console.log("[InterviewPage] startRecording: timerRef.current is null, setting up new interval.");
      timerRef.current = window.setInterval(() => {
        setTimeRemaining(prev => {
          // // console.log(`[InterviewPage] timerRef interval firing. Current timeRemaining: ${prev}, isRecording: ${isRecording}`); // Reduced logging
          if (prev <= 1) {
            // console.log("[InterviewPage] Question Timer: Time is up!");
            if(isRecording) stopRecording();
            handleSubmitAnswer();
            return 0;
          }
          return prev - 1;
        });
        
        if (isRecording) {
            setRecordingTime(prev => prev + 1);
        }
      }, 1000);
    } else {
      // console.log(`[InterviewPage] startRecording: timerRef.current is NOT null (${timerRef.current}), timer not started or already running.`);
    }
    
    setIsRecording(true);
    // console.log("[InterviewPage] startRecording: setIsRecording(true) now.");
  };

  // Stop recording answer
  const stopRecording = () => {
    if (!isRecording) return;
    
    // Stop speech recognition if active
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping speech recognition:', e);
      }
    }
    
    // DO NOT stop the question timer (timerRef) here.
    // The question timer should continue until the time is up or the question changes.
    // Only stop the speech recognition and update recording state.
    
    setIsRecording(false);
    interimTranscriptRef.current = '';
  };
  
  // Toggle microphone on/off
  const toggleMicrophone = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };
  
  // Submit answer and move to next question
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;
    
    setIsProcessing(true);
    
    // Stop recording if still active
    if (isRecording) {
      stopRecording();
    }
    
    // Combine answer with interim transcript if any
    const finalAnswer = (answer + ' ' + interimTranscriptRef.current).trim();
    
    try {
      // Save the answer (this will now perform analysis via Gemini)
      await saveAnswer({
        questionId: currentQuestion.id,
        text: finalAnswer
      });
      
      // Check if this was the last question
      if (currentQuestionIndex >= questions.length - 1) {
        // console.log("Last question answered, completing interview...");
        
        // Get interview ID from session storage or local storage
        const interviewId = sessionStorage.getItem('currentInterviewId');
        const roomId = localStorage.getItem('interviewRoomId');
        
        // Try to mark the interview as completed before navigating
        if (interviewId || roomId) {
          try {
            const token = localStorage.getItem('token');
            
            if (interviewId) {
              // console.log(`Marking interview ${interviewId} as completed`);
              try {
                await fetch(`/api/interviews/auto-complete/${interviewId}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                  }
                });
                // console.log("Successfully completed interview via ID");
    } catch (err) {
                console.error("Error completing interview via ID:", err);
    }
            }
            
            if (roomId) {
              // console.log(`Marking interview room ${roomId} as completed`);
              try {
                await fetch(`/api/interviews/room/${roomId}/complete`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                  }
                });
                // console.log("Successfully completed interview via room ID");
              } catch (err) {
                console.error("Error completing interview via room ID:", err);
      }
            }
          } catch (error) {
            console.error("Error marking interview as complete:", error);
          }
        } else {
          // console.log("No interview ID found to mark as completed");
        }
        
        // Finish the interview and navigate to results
        finishInterview();
        navigate('/results');
      } else {
        // Move to next question
        nextQuestion();
        // Reset answer state for next question
        setAnswer('');
        setRecordingTime(0);
        setTimeRemaining(QUESTION_TIME_LIMIT);
    }
    } catch (error) {
      console.error('Error submitting answer:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle skipping current question
  const handleSkipQuestion = async () => {
    if (!currentQuestion) return;
    
    if (isRecording) {
      stopRecording();
    }
    
    // If there's partial answer text, save it
    if (answer.trim() || interimTranscriptRef.current.trim()) {
      const finalAnswer = (answer + ' ' + interimTranscriptRef.current).trim();
      saveAnswer({
        questionId: currentQuestion.id,
        text: finalAnswer
      });
    }
      
    if (currentQuestionIndex >= questions.length - 1) {
      // console.log("Last question skipped, completing interview...");
      
      // Get interview ID from session storage or local storage
      const interviewId = sessionStorage.getItem('currentInterviewId');
      const roomId = localStorage.getItem('interviewRoomId');
      
      // Try to mark the interview as completed before navigating
      if (interviewId || roomId) {
        try {
          const token = localStorage.getItem('token');
          
          if (interviewId) {
            // console.log(`Marking interview ${interviewId} as completed`);
            try {
              await fetch(`/api/interviews/auto-complete/${interviewId}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': token ? `Bearer ${token}` : '',
                }
              });
              // console.log("Successfully completed interview via ID");
            } catch (err) {
              console.error("Error completing interview via ID:", err);
            }
          }
          
          if (roomId) {
            // console.log(`Marking interview room ${roomId} as completed`);
            try {
              await fetch(`/api/interviews/room/${roomId}/complete`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': token ? `Bearer ${token}` : '',
                }
              });
              // console.log("Successfully completed interview via room ID");
            } catch (err) {
              console.error("Error completing interview via room ID:", err);
            }
          }
        } catch (error) {
          console.error("Error marking interview as complete:", error);
        }
      } else {
        // console.log("No interview ID found to mark as completed");
      }
      
      // Finish the interview and navigate to results
        finishInterview();
        navigate('/results');
    } else {
      nextQuestion();
      setAnswer('');
      setRecordingTime(0);
      setTimeRemaining(QUESTION_TIME_LIMIT);
    }
  };
  
  // We can simplify or remove the existing read-first-question useEffect
  // since we're now handling reading through the question change tracking
  useEffect(() => {
    // Only read the first question automatically once when the page loads
    if (currentQuestion && currentQuestionIndex === 0 && !isReading && !isLoading && !hasReadFirstQuestion) {
      // This will be handled by the question ID tracking now,
      // but keeping for backward compatibility with a smaller delay
      const timeout = setTimeout(() => {
        // Mark as first question read - the actual reading will happen in the other effect
        setHasReadFirstQuestion(true);
      }, 500);
      
      return () => clearTimeout(timeout);
    }
  }, [currentQuestion, currentQuestionIndex, isReading, isLoading, hasReadFirstQuestion]);

  // Streamlined useEffect for handling video setup
  useEffect(() => {
    // Start the interview if it's not already in progress
    if (!isInterviewInProgress && !isInitializingMedia) {
      // console.log("Starting interview from InterviewPage");
      startInterview();
    }
    
    // Only set video source if we have a mediaStream and a valid videoRef
    if (mediaStream && videoRef.current) {
      // console.log("Setting media stream to video element");
      videoRef.current.srcObject = mediaStream;
      
      // Handle successful video load
      const handleVideoLoad = () => {
        // console.log("Video loaded successfully");
        setIsLoading(false);
      };
      
      videoRef.current.addEventListener('loadedmetadata', handleVideoLoad);
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleVideoLoad);
        }
      };
    } else if (!isInitializingMedia && !mediaStream) {
      // If we're done initializing and still have no stream, we can mark as not loading
      setIsLoading(false);
    }
  }, [mediaStream, isInterviewInProgress, startInterview, isInitializingMedia]);
  
  // Handle retry for camera access
  const handleRetryCamera = async () => {
    setIsLoading(true);
    const success = await retryMediaStream();
    if (!success) {
      setIsLoading(false);
    }
  };

  // Add new useEffect for tracking overall interview time
  useEffect(() => {
    // console.log(`[InterviewPage] Total interview timer useEffect running. Qs: ${questions.length}, InProgress: ${isInterviewInProgress}, Initialized: ${isInterviewTimeInitialized}`);
    // Initialize interview timer when questions are loaded and interview starts
    if (questions.length > 0 && isInterviewInProgress) { // Condition changed: removed !isInterviewTimeInitialized for setInterval
      
      // Set initial time remaining and flag only if not already initialized
      if (!isInterviewTimeInitialized) {
        // console.log("[InterviewPage] Total interview timer: Initializing time and flag.");
        const TOTAL_INTERVIEW_TIME = questions.length * QUESTION_TIME_LIMIT;
        setInterviewTimeRemaining(TOTAL_INTERVIEW_TIME);
        setIsInterviewTimeInitialized(true);
        // console.log(`[InterviewPage] Total interview timer: Set initial interviewTimeRemaining to ${TOTAL_INTERVIEW_TIME}, isInterviewTimeInitialized to true.`);
      }
      
      // Start the overall interview timer if it's not already running
      if (!interviewTimerRef.current) { // Check if timer is not already set
        // console.log("[InterviewPage] Total interview timer: Setting up setInterval for interviewTimerRef.");
        interviewTimerRef.current = window.setInterval(() => {
        // console.log("[InterviewPage] interviewTimerRef interval FIRED.");
        setInterviewTimeRemaining(prev => {
          // This state update for total time should be reliable
          setTotalInterviewTime(currentTime => {
            // console.log(`[InterviewPage] Incrementing totalInterviewTime from ${currentTime} to ${currentTime + 1}`);
            return currentTime + 1;
          });
          
          // If interview time is up, automatically finish and navigate to results
          if (prev <= 1) {
            if (interviewTimerRef.current) {
              clearInterval(interviewTimerRef.current);
            }
            
            // Stop any active recording
            if (isRecording) {
              stopRecording();
            }
            
            // Save current answer if any
            if ((answer.trim() || interimTranscriptRef.current.trim()) && currentQuestion) {
              const finalAnswer = (answer + ' ' + interimTranscriptRef.current).trim();
              saveAnswer({
                questionId: currentQuestion.id,
                text: finalAnswer
              });
            }
            
            // Finish interview and navigate to results
            finishInterview();
            navigate('/results');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      } // End of if (!interviewTimerRef.current)
      
      // This cleanup function should be returned by the main 'if' block of the useEffect
      return () => {
        // console.log("[InterviewPage] Cleanup for Total interview timer useEffect. Clearing interval if exists:", interviewTimerRef.current);
        if (interviewTimerRef.current) {
          clearInterval(interviewTimerRef.current);
          interviewTimerRef.current = null;
          // console.log("[InterviewPage] Total interview timer: Interval CLEARED.");
        }
      };
    } else { // This 'else' corresponds to 'if (questions.length > 0 && isInterviewInProgress)'
      // console.log(`[InterviewPage] Total interview timer: Conditions NOT MET. Qs: ${questions.length}, InProgress: ${isInterviewInProgress}, Initialized: ${isInterviewTimeInitialized}`);
      // Ensure any existing timer is cleared if conditions are no longer met
      if (interviewTimerRef.current) {
        // console.log("[InterviewPage] Total interview timer: Conditions no longer met, clearing existing timer:", interviewTimerRef.current);
        clearInterval(interviewTimerRef.current);
        interviewTimerRef.current = null;
      }
    }
  }, [isInterviewInProgress, isInterviewTimeInitialized, questions.length]); // Further reduced dependencies

  if (isLoading || isLoadingQuestions) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xl">Loading interview questions...</p>
      </div>
    );
  }
  
  if (!currentQuestion || !hasQuestions) {
    return (
      <div className="text-center py-10">
        <p>No questions available. Please try again.</p>
          <button 
            onClick={() => navigate('/setup')} 
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          Back to Setup
        </button>
      </div>
    );
  }

  if (mediaStreamError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Camera Access Error</h2>
          <p className="text-gray-500 mb-4">{mediaStreamError}</p>
          <button
            onClick={handleRetryCamera}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retry Camera Access
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-2xl font-bold">Interview in Progress</h1>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`}></div>
              <span className="text-sm font-medium">{isRecording ? 'Recording' : 'Not Recording'}</span>
            </div>
            {isInterviewTimeInitialized && (
              <div className="text-sm font-medium">
                Total Time: <span className={interviewTimeRemaining < 60 ? 'text-red-500' : ''}>{formatTime(interviewTimeRemaining)}</span>
            </div>
            )}
          </div>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Interview Progress</h3>
        <ProgressBar 
          current={currentQuestionIndex + 1} 
          total={questions.length} 
        />
            </div>
            
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <QuestionDisplay question={currentQuestion.text} questionNumber={currentQuestionIndex + 1} />
          
          <div className="bg-white shadow rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium">Your Answer</h3>
              <div className="text-sm font-medium">
                Time remaining: <span className={timeRemaining < 30 ? 'text-red-500' : ''}>{formatTime(timeRemaining)}</span>
              </div>
            </div>
            
            {/* Answer text area with interim transcript */}
            <div className="mb-4">
              <textarea
                className="w-full h-40 p-3 border rounded resize-none"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Your answer will appear here as you speak..."
                disabled={isRecording}
              />
              {interimTranscriptRef.current && (
                <div className="text-gray-500 italic mt-2">
                  {interimTranscriptRef.current}
          </div>
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleMicrophone}
                  className={classNames(
                    "p-3 rounded-full flex items-center justify-center",
                    isRecording 
                      ? "bg-red-100 text-red-600 hover:bg-red-200" 
                      : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
                  )}
                  disabled={isProcessing}
                >
                  {isRecording ? (
                    <span className="material-icons">mic_off</span>
                  ) : (
                    <span className="material-icons">mic</span>
                  )}
                </button>
                
                <button
                  onClick={readQuestionAloud}
                  className={classNames(
                    "p-3 rounded-full flex items-center justify-center",
                    isReading
                      ? "bg-amber-100 text-amber-600"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                  disabled={isReading || isProcessing}
                >
                  <span className="material-icons">volume_up</span>
                </button>
              </div>
              
              <div className="space-x-2">
                <button
                  onClick={handleSkipQuestion}
                  className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                  disabled={isProcessing}
                >
                  Skip
                </button>
                <button
                  onClick={handleSubmitAnswer}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-indigo-300"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing
                    </span>
                  ) : (
                    'Submit Answer'
                  )}
                </button>
              </div>
                    </div>
                  </div>
                </div>
        
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="font-medium mb-3">Camera Preview</h3>
            <div className="aspect-video bg-gray-900 rounded relative overflow-hidden">
              <video 
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                muted
                autoPlay
                playsInline
              />
              
              {/* Camera state messages */}
              {(!mediaStream && !cameraConnected && !isCameraSetupFailed) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-800">
                  <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin mb-2"></div>
                  <span>Requesting camera access...</span>
                </div>
              )}
              
              {(!mediaStream && !cameraConnected && isCameraSetupFailed) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gray-800">
                  <span>Camera access denied or unavailable</span>
                  <p className="text-sm mt-2">You can continue the interview without video</p>
                </div>
              )}
              
              {(mediaStream && !cameraConnected) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-75 text-white">
                  <div className="w-8 h-8 border-4 border-t-transparent border-white rounded-full animate-spin mb-2"></div>
                  <span>Connecting camera...</span>
                </div>
              )}
          </div>
        </div>
        
          <QuestionNavigation
            currentIndex={currentQuestionIndex}
            totalQuestions={questions.length}
            onPrevious={previousQuestion}
            onNext={nextQuestion}
            disablePrevious={currentQuestionIndex === 0 || isRecording || isProcessing}
            disableNext={currentQuestionIndex === questions.length - 1 || isRecording || isProcessing}
          />
          
          <div className="bg-white shadow rounded-lg p-4">
            <h3 className="font-medium mb-2">Tips</h3>
            <ul className="text-sm space-y-2">
              <li>• Speak clearly and at a moderate pace</li>
              <li>• Provide specific examples in your answers</li>
              <li>• Structure your answers with an introduction, main points, and conclusion</li>
              <li>• You have 3 minutes per question</li>
              <li>• Click the microphone to start/stop recording</li>
              <li>• Click the speaker icon to hear the question again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;