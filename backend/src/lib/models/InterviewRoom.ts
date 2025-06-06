import mongoose from 'mongoose';

export interface IInterviewRoom extends mongoose.Document {
  title: string;
  hr: mongoose.Types.ObjectId;
  candidate: mongoose.Types.ObjectId;
  scheduledFor: Date;
  duration: number; // Duration in minutes
  jobRole: string; // Job role for the interview
  experienceLevel: string; // Experience level for the interview
  roomLink: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

const interviewRoomSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  hr: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  candidate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  scheduledFor: {
    type: Date,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
    default: 60, // Default 60 minutes (1 hour)
  },
  jobRole: {
    type: String,
    required: true,
    enum: ['web-developer', 'app-developer', 'ml-ai', 'ux-designer', 'data-scientist'],
    default: 'web-developer',
  },
  experienceLevel: {
    type: String,
    required: true,
    enum: ['fresher', 'junior', 'mid-level', 'senior'],
    default: 'mid-level',
  },
  roomLink: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled'],
    default: 'scheduled',
  },
  notes: {
    type: String,
  },
}, {
  timestamps: true,
});

const InterviewRoom = mongoose.model<IInterviewRoom>('InterviewRoom', interviewRoomSchema);

export default InterviewRoom; 