import mongoose from 'mongoose';

export interface IInterviewResult extends mongoose.Document {
  candidateId: mongoose.Types.ObjectId;
  interviewId?: mongoose.Types.ObjectId;
  jobRole: string;
  experienceLevel: string;
  totalScore: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  date: Date;
  answers: {
    questionId: string;
    questionText: string;
    answerText: string;
    score: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
  }[];
}

const interviewResultSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'InterviewRoom',
  },
  jobRole: {
    type: String,
    required: true,
  },
  experienceLevel: {
    type: String,
    required: true,
  },
  totalScore: {
    type: Number,
    required: true,
  },
  feedback: {
    type: String,
    required: true,
  },
  strengths: [{
    type: String,
  }],
  improvements: [{
    type: String,
  }],
  date: {
    type: Date,
    default: Date.now,
  },
  answers: [{
    questionId: String,
    questionText: String,
    answerText: String,
    score: Number,
    feedback: String,
    strengths: [String],
    weaknesses: [String],
  }],
}, {
  timestamps: true,
});

const InterviewResult = mongoose.model<IInterviewResult>('InterviewResult', interviewResultSchema);

export default InterviewResult; 