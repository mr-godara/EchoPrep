import { useState } from 'react';
import { useHR } from '../contexts/HRContext';
import { Calendar, Clock, Users, Link as LinkIcon, XCircle, CheckCircle } from 'lucide-react';
import { format, addMinutes } from 'date-fns';

const HRDashboardPage = () => {
  const { scheduledInterviews, scheduleInterview, cancelInterview } = useHR();
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [jobRole, setJobRole] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [duration, setDuration] = useState(30);
  const [showScheduleForm, setShowScheduleForm] = useState(false);

  const handleScheduleInterview = (e: React.FormEvent) => {
    e.preventDefault();
    
    const interview = scheduleInterview(
      employeeEmail,
      jobRole,
      new Date(scheduledTime),
      duration
    );

    // Reset form
    setEmployeeEmail('');
    setJobRole('');
    setScheduledTime('');
    setDuration(30);
    setShowScheduleForm(false);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="page-transition container mx-auto px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">HR Dashboard</h1>
            <p className="text-muted-foreground">Manage scheduled interviews</p>
          </div>
          
          <button
            className="btn btn-primary"
            onClick={() => setShowScheduleForm(true)}
          >
            Schedule New Interview
          </button>
        </div>

        {showScheduleForm && (
          <div className="mb-8">
            <div className="card">
              <h2 className="mb-4 text-xl font-semibold">Schedule Interview</h2>
              <form onSubmit={handleScheduleInterview}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="label" htmlFor="employeeEmail">
                      Employee Email
                    </label>
                    <input
                      id="employeeEmail"
                      type="email"
                      className="input w-full"
                      value={employeeEmail}
                      onChange={(e) => setEmployeeEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="jobRole">
                      Job Role
                    </label>
                    <input
                      id="jobRole"
                      type="text"
                      className="input w-full"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="scheduledTime">
                      Interview Time
                    </label>
                    <input
                      id="scheduledTime"
                      type="datetime-local"
                      className="input w-full"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="label" htmlFor="duration">
                      Duration (minutes)
                    </label>
                    <select
                      id="duration"
                      className="select w-full"
                      value={duration}
                      onChange={(e) => setDuration(Number(e.target.value))}
                      required
                    >
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes</option>
                      <option value="90">90 minutes</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setShowScheduleForm(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Schedule Interview
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {scheduledInterviews.map((interview) => (
            <div key={interview.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="mb-2 text-lg font-semibold">{interview.jobRole}</h3>
                  <div className="space-y-2">
                    <p className="flex items-center text-sm text-muted-foreground">
                      <Users size={16} className="mr-2" />
                      {interview.employeeEmail}
                    </p>
                    <p className="flex items-center text-sm text-muted-foreground">
                      <Calendar size={16} className="mr-2" />
                      {format(interview.scheduledTime, 'PPP')}
                    </p>
                    <p className="flex items-center text-sm text-muted-foreground">
                      <Clock size={16} className="mr-2" />
                      {format(interview.scheduledTime, 'p')} - {format(addMinutes(interview.scheduledTime, interview.duration), 'p')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className={`rounded-full px-3 py-1 text-sm ${
                    interview.status === 'scheduled' ? 'bg-primary/10 text-primary' :
                    interview.status === 'completed' ? 'bg-success/10 text-success' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                  </div>
                  
                  {interview.status === 'scheduled' && (
                    <button
                      onClick={() => cancelInterview(interview.id)}
                      className="btn btn-outline text-destructive"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
              </div>

              {interview.status === 'scheduled' && (
                <div className="mt-4 flex items-center justify-between rounded-md bg-muted p-3">
                  <div className="flex items-center space-x-2">
                    <LinkIcon size={16} className="text-primary" />
                    <span className="text-sm font-medium">Interview Join Link</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(interview.joinLink)}
                    className="btn btn-outline btn-sm"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>
          ))}

          {scheduledInterviews.length === 0 && (
            <div className="card text-center">
              <p className="text-muted-foreground">No interviews scheduled yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRDashboardPage;