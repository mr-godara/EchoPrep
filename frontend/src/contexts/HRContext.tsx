import { createContext, useContext, useState, ReactNode } from 'react'; // Removed React
import { v4 as uuidv4 } from 'uuid';
// Removed unused import: import { addMinutes, format } from 'date-fns';

export interface ScheduledInterview {
  id: string;
  employeeEmail: string;
  jobRole: string;
  scheduledTime: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled';
  joinLink: string;
}

interface HRContextType {
  scheduledInterviews: ScheduledInterview[];
  scheduleInterview: (employeeEmail: string, jobRole: string, scheduledTime: Date, duration: number) => ScheduledInterview;
  cancelInterview: (id: string) => void;
  getInterview: (id: string) => ScheduledInterview | undefined;
  updateInterviewStatus: (id: string, status: ScheduledInterview['status']) => void;
}

const HRContext = createContext<HRContextType | undefined>(undefined);

export const useHR = () => {
  const context = useContext(HRContext);
  if (!context) {
    throw new Error('useHR must be used within an HRProvider');
  }
  return context;
};

interface HRProviderProps {
  children: ReactNode;
}

export const HRProvider = ({ children }: HRProviderProps) => {
  const [scheduledInterviews, setScheduledInterviews] = useState<ScheduledInterview[]>([]);

  const scheduleInterview = (
    employeeEmail: string,
    jobRole: string,
    scheduledTime: Date,
    duration: number
  ): ScheduledInterview => {
    const id = uuidv4();
    const joinLink = `${window.location.origin}/interview-room/${id}`;
    
    const interview: ScheduledInterview = {
      id,
      employeeEmail,
      jobRole,
      scheduledTime,
      duration,
      status: 'scheduled',
      joinLink,
    };

    setScheduledInterviews(prev => [...prev, interview]);
    return interview;
  };

  const cancelInterview = (id: string) => {
    setScheduledInterviews(prev => 
      prev.map(interview => 
        interview.id === id 
          ? { ...interview, status: 'cancelled' } 
          : interview
      )
    );
  };

  const getInterview = (id: string) => {
    return scheduledInterviews.find(interview => interview.id === id);
  };

  const updateInterviewStatus = (id: string, status: ScheduledInterview['status']) => {
    setScheduledInterviews(prev => 
      prev.map(interview => 
        interview.id === id 
          ? { ...interview, status } 
          : interview
      )
    );
  };

  return (
    <HRContext.Provider value={{
      scheduledInterviews,
      scheduleInterview,
      cancelInterview,
      getInterview,
      updateInterviewStatus,
    }}>
      {children}
    </HRContext.Provider>
  );
};