import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Briefcase as BriefcaseBusiness, GraduationCap, Code, Brain, Palette, Database } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useInterview, JobRole, ExperienceLevel } from '../contexts/InterviewContext';
import { cn } from '../lib/utils.js';

interface RoleCardProps {
  id: JobRole;
  title: string;
  icon: React.ReactNode;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

const RoleCard = ({ id, title, icon, description, selected, onSelect }: RoleCardProps) => (
  <div
    className={cn(
      "card relative cursor-pointer border-2 transition-all duration-200",
      selected ? "border-primary" : "border-transparent hover:border-primary/50"
    )}
    onClick={onSelect}
  >
    {selected && (
      <div className="absolute right-4 top-4 h-3 w-3 rounded-full bg-primary"></div>
    )}
    <div className="mb-4 text-primary">{icon}</div>
    <h3 className="mb-2 text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

interface LevelCardProps {
  id: ExperienceLevel;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

const LevelCard = ({ id, title, description, selected, onSelect }: LevelCardProps) => (
  <div
    className={cn(
      "card relative cursor-pointer border-2 transition-all duration-200",
      selected ? "border-primary" : "border-transparent hover:border-primary/50"
    )}
    onClick={onSelect}
  >
    {selected && (
      <div className="absolute right-4 top-4 h-3 w-3 rounded-full bg-primary"></div>
    )}
    <h3 className="mb-2 text-lg font-semibold">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

const SetupPage = () => {
  const [selectedRole, setSelectedRole] = useState<JobRole | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isRequestingMedia, setIsRequestingMedia] = useState(false);
  const { user } = useAuth();
  const { setConfig, startInterview } = useInterview();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirect to login if user is not authenticated
    if (!user) {
      navigate('/login');
    }
    
    // Check for error message in location state
    if (location.state && location.state.error) {
      setErrorMessage(location.state.error);
      // Clear the error from location state 
      window.history.replaceState({}, document.title);
    }
  }, [user, navigate, location]);

  const handleStartInterview = async () => {
    setErrorMessage("");
    
    if (!selectedRole) {
      setErrorMessage("Please select a job role");
      return;
    }
    
    if (!selectedLevel) {
      setErrorMessage("Please select an experience level");
      return;
    }
    
    // Set the interview configuration
    setConfig({
      jobRole: selectedRole,
      experienceLevel: selectedLevel
    });
    
    try {
      // Request camera and microphone access
      setIsRequestingMedia(true);
      
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        // Start the interview with the media stream
        await startInterview({
          mediaStream,
          jobRole: selectedRole, // Pass selectedRole
          experienceLevel: selectedLevel // Pass selectedLevel
        });
    
    // Navigate to the interview page
    navigate('/interview');
      } catch (err) {
        console.error('Error accessing media devices:', err);
        
        // Show a warning but allow user to continue anyway
        if (window.confirm("Unable to access camera or microphone. Would you like to continue without video?")) {
          // Start interview without media stream, but still pass role and level
          await startInterview({
            jobRole: selectedRole, // Pass selectedRole
            experienceLevel: selectedLevel // Pass selectedLevel
          });
          navigate('/interview');
        } else {
          setErrorMessage("Interview requires camera and microphone access. Please ensure they are connected and permissions are granted.");
        }
      }
    } catch (err) {
      console.error('Error starting interview:', err);
      setErrorMessage("Failed to start interview. Please try again.");
    } finally {
      setIsRequestingMedia(false);
    }
  };

  const jobRoles = [
    {
      id: 'web-developer' as JobRole,
      title: 'Web Developer',
      icon: <Code size={32} />,
      description: 'Front-end, back-end, and full-stack web development roles'
    },
    {
      id: 'app-developer' as JobRole,
      title: 'App Developer',
      icon: <BriefcaseBusiness size={32} />,
      description: 'Mobile and desktop application development roles'
    },
    {
      id: 'ml-ai' as JobRole,
      title: 'ML & AI Engineer',
      icon: <Brain size={32} />,
      description: 'Machine learning, AI, and data science positions'
    },
    {
      id: 'ux-designer' as JobRole,
      title: 'UX Designer',
      icon: <Palette size={32} />,
      description: 'User experience and interface design roles'
    },
    {
      id: 'data-scientist' as JobRole,
      title: 'Data Scientist',
      icon: <Database size={32} />,
      description: 'Data analysis, modeling, and visualization positions'
    }
  ];

  const experienceLevels = [
    {
      id: 'fresher' as ExperienceLevel,
      title: 'Fresher / Entry Level',
      description: '0-1 years of experience, new to the industry'
    },
    {
      id: 'junior' as ExperienceLevel,
      title: 'Junior',
      description: '1-3 years of experience, some professional work'
    },
    {
      id: 'mid-level' as ExperienceLevel,
      title: 'Mid-Level',
      description: '3-5 years of experience, solid professional skills'
    },
    {
      id: 'senior' as ExperienceLevel,
      title: 'Senior / Lead',
      description: '5+ years of experience, expert level skills'
    }
  ];

  return (
    <div className="page-transition container mx-auto px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-bold sm:text-4xl">Setup Your Interview</h1>
          <p className="text-lg text-muted-foreground">
            Select your target job role and experience level to receive tailored questions
          </p>
        </div>

        <div className="mb-10">
          <h2 className="mb-6 text-2xl font-semibold">1. Select a Job Role</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {jobRoles.map((role) => (
              <RoleCard
                key={role.id}
                id={role.id}
                title={role.title}
                icon={role.icon}
                description={role.description}
                selected={selectedRole === role.id}
                onSelect={() => setSelectedRole(role.id)}
              />
            ))}
          </div>
        </div>

        <div className="mb-10">
          <h2 className="mb-6 text-2xl font-semibold">2. Select Experience Level</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {experienceLevels.map((level) => (
              <LevelCard
                key={level.id}
                id={level.id}
                title={level.title}
                description={level.description}
                selected={selectedLevel === level.id}
                onSelect={() => setSelectedLevel(level.id)}
              />
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-md bg-destructive/10 p-3 text-center text-destructive">
            {errorMessage}
          </div>
        )}

        <div className="text-center">
          <button 
            className={cn(
              "btn btn-primary inline-flex items-center space-x-2 px-8 py-3 text-lg",
              isRequestingMedia && "opacity-75 cursor-not-allowed"
            )}
            onClick={handleStartInterview}
            disabled={isRequestingMedia}
          >
            <span>{isRequestingMedia ? "Requesting Camera Access..." : "Start Interview"}</span>
            <GraduationCap size={20} />
          </button>
          
          <p className="mt-4 text-sm text-muted-foreground">
            This will start a mock interview session with AI-generated questions specific to your selection.
            <br />
            <strong>Note: </strong>Camera and microphone access is required for the interview.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SetupPage;