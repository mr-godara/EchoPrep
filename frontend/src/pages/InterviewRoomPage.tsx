import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useInterview } from '../contexts/InterviewContext';
import { format, addMinutes, differenceInSeconds } from 'date-fns';
import { Clock, AlertCircle, Video, VideoOff, Mic, MicOff } from 'lucide-react';

interface Interview {
  _id: string;
  title: string;
  hr: {
    firstName: string;
    lastName: string;
    email: string;
    company: string;
  };
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

const InterviewRoomPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startInterview } = useInterview();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [canStart, setCanStart] = useState(false);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [roomExpired, setRoomExpired] = useState(false);
  
  // Media stream states
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [deviceError, setDeviceError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const response = await fetch(`/api/interviews/room/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch interview');
        }
        
        const data = await response.json();
        setInterview(data);
        
        // Store the interview room ID in localStorage for later reference
        if (id) {
          localStorage.setItem('interviewRoomId', id);
          // console.log("Stored interview room ID in localStorage:", id);
          
          // Also store the direct interview ID if available
          if (data._id) {
            sessionStorage.setItem('currentInterviewId', data._id);
            // console.log("Stored interview ID in sessionStorage:", data._id);
          }
        }
        
        if (data.status === 'cancelled') {
          setError('This interview has been cancelled');
      setIsLoading(false);
      return;
    }

        if (data.status === 'completed') {
          setError('This interview has already been completed');
          setRoomExpired(true);
          setCanStart(false);
      setIsLoading(false);
      return;
    }

    const now = new Date();
        const interviewTime = new Date(data.scheduledFor);
    const timeDiff = interviewTime.getTime() - now.getTime();
    
        // Check if interview time has passed more than the duration
        const endTime = addMinutes(interviewTime, data.duration || 60);
        if (now > endTime) {
          setError('This interview has already ended');
          setRoomExpired(true);
          setCanStart(false);
          
          // Automatically mark interview as completed if it's expired
          if (data.status === 'scheduled') {
            try {
              await fetch(`/api/interviews/auto-complete/${data._id}`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
            } catch (err) {
              console.error('Error auto-completing expired interview:', err);
            }
          }
        }
    // Allow joining 5 minutes before scheduled time
        else if (timeDiff > 300000) { // 5 minutes in milliseconds
      setError('This interview has not started yet');
      setCanStart(false);
    } else {
      setCanStart(true);
          
          // Calculate and set remaining time
          const remainingSecs = differenceInSeconds(endTime, now);
          setRemainingTime(remainingSecs > 0 ? remainingSecs : 0);
          
          // Start the countdown timer
          if (remainingSecs > 0) {
            timerRef.current = window.setInterval(() => {
              setRemainingTime(prev => {
                if (prev === null || prev <= 1) {
                  if (timerRef.current) {
                    clearInterval(timerRef.current);
                  }
                  setRoomExpired(true);
                  setError('Interview time has expired');
                  setCanStart(false);
                  
                  // If interview was in progress, automatically finalize it
                  if (interview && interview.status === 'scheduled' && stream) {
                    // Automatically complete the interview if it was active
                    fetch(`/api/interviews/${interview._id}/complete`, {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                      }
                    }).catch(err => console.error('Error completing interview:', err));
                    
                    // If a stream exists, the interview was in progress
                    stream.getTracks().forEach(track => track.stop());
                  }
                  
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          }
        }
      } catch (err) {
        console.error('Error fetching interview:', err);
        setError('Interview not found');
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchInterview();
    }
    
    // Clean up the timer on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [id]);

  // Format remaining time as HH:MM:SS
  const formatRemainingTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Setup media devices (camera & mic)
  useEffect(() => {
    const setupMediaDevices = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setStream(mediaStream);
        
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          // Ensure video plays properly
          videoRef.current.muted = true;
          videoRef.current.autoplay = true;
          videoRef.current.playsInline = true;
          
          // Force the video to start playing
          videoRef.current.play().catch(e => {
            console.error("Error playing video:", e);
          });
        }
      } catch (err) {
        console.error('Error accessing media devices:', err);
        setDeviceError('Failed to access camera or microphone. Please ensure they are connected and you have granted permission.');
      }
    };

    if (!isLoading && interview && canStart && !roomExpired) {
      setupMediaDevices();
    }

    // Cleanup function to stop all tracks when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isLoading, interview, canStart, roomExpired]);

  const toggleVideo = () => {
    if (stream) {
      const videoTracks = stream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !videoEnabled;
      });
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  // Add helper functions to format these values
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

  // Update the handleStart function to pass job role and experience level to the interview context
  const handleStart = () => {
    if (!interview || !canStart || roomExpired) return;

    if (!name.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (email.toLowerCase() !== interview.candidate.email.toLowerCase()) {
      setError('Email does not match the scheduled interview');
      return;
    }

    // Store stream in session storage or context for use in the interview
    if (stream) {
      // Store ID information before navigating
      if (id) {
        localStorage.setItem('interviewRoomId', id);
      }
      if (interview._id) {
        sessionStorage.setItem('currentInterviewId', interview._id);
      }
      
      // Pass stream and interview details to interview context
      startInterview({ 
        mediaStream: stream,
        jobRole: interview.jobRole as any,
        experienceLevel: interview.experienceLevel as any,
        interviewId: interview._id
      });
      
      // console.log("Starting interview with ID:", interview._id);
    navigate('/interview');
    } else {
      setError('Camera and microphone are required for the interview');
    }
  };

  if (isLoading) {
    return (
      <div className="page-transition flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <h2 className="text-xl font-semibold">Loading Interview</h2>
        </div>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="page-transition flex min-h-[80vh] items-center justify-center">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto mb-4 text-destructive" />
          <h2 className="mb-2 text-xl font-semibold">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          {roomExpired && (
            <button 
              onClick={() => navigate('/candidate/dashboard')}
              className="mt-4 btn btn-primary"
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page-transition container mx-auto px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="card">
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-2xl font-bold">Welcome to Your Interview</h1>
            <p className="text-muted-foreground">
              Please verify your details and check your camera/microphone before starting
            </p>
          </div>

          <div className="mb-6 rounded-md bg-muted p-4">
            <h2 className="mb-3 font-semibold">Interview Details</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Title:</strong> {interview.title}</p>
              <p><strong>Company:</strong> {interview.hr.company}</p>
              <p><strong>Position:</strong> {formatJobRole(interview.jobRole)}</p>
              <p><strong>Level:</strong> {formatExperienceLevel(interview.experienceLevel)}</p>
              <p><strong>Date:</strong> {format(new Date(interview.scheduledFor), 'PPP')}</p>
              <p className="flex items-center">
                <Clock size={16} className="mr-2" />
                <span>
                  {format(new Date(interview.scheduledFor), 'p')}
                </span>
              </p>
              <p><strong>Duration:</strong> {interview.duration} minutes</p>
              {remainingTime !== null && (
                <p className="flex items-center text-primary font-medium">
                  <Clock size={16} className="mr-2" />
                  <span>
                    Time Remaining: {formatRemainingTime(remainingTime)}
                  </span>
                </p>
              )}
            </div>
          </div>
          
          {/* Camera preview */}
          <div className="mb-6">
            <h2 className="mb-3 font-semibold">Camera Preview</h2>
            <div className="relative aspect-video w-full bg-black rounded-md overflow-hidden">
              {deviceError ? (
                <div className="absolute inset-0 flex items-center justify-center text-white text-center p-4">
                  <p>{deviceError}</p>
                </div>
              ) : (
                <>
                  <video 
                    ref={videoRef} 
                    autoPlay 
                    muted 
                    playsInline
                    className={`w-full h-full object-cover ${!videoEnabled ? 'opacity-0' : ''}`}
                  />
                  {!videoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                      <p className="text-white">Camera Off</p>
                    </div>
                  )}
                </>
              )}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center space-x-4">
                <button
                  type="button"
                  onClick={toggleVideo}
                  className={`p-2 rounded-full ${videoEnabled ? 'bg-gray-700' : 'bg-red-600'}`}
                >
                  {videoEnabled ? <Video size={20} className="text-white" /> : <VideoOff size={20} className="text-white" />}
                </button>
                <button
                  type="button"
                  onClick={toggleAudio}
                  className={`p-2 rounded-full ${audioEnabled ? 'bg-gray-700' : 'bg-red-600'}`}
                >
                  {audioEnabled ? <Mic size={20} className="text-white" /> : <MicOff size={20} className="text-white" />}
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleStart(); }}>
            <div className="mb-4">
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                className="input w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="input w-full"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-destructive/10 p-3 text-destructive">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={!canStart || !stream || roomExpired}
            >
              Start Interview
            </button>

            {!canStart && !roomExpired && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                The interview will be available to start 5 minutes before the scheduled time.
              </p>
            )}
            
            {!stream && !deviceError && !roomExpired && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                Please allow access to your camera and microphone to proceed.
              </p>
            )}
            
            {roomExpired && (
              <p className="mt-3 text-center text-sm text-muted-foreground">
                This interview has expired. Please contact the interviewer for rescheduling.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default InterviewRoomPage;