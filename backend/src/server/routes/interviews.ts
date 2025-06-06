import express from 'express';
import mongoose from 'mongoose'; // Import mongoose for ObjectId.isValid
import axios from 'axios'; // Added for making HTTP requests
import { authenticateToken, requireHR, AuthRequest } from '../middleware/auth.js'; // Added .js and AuthRequest
import InterviewRoom from '../../lib/models/InterviewRoom.js';
import User from '../../lib/models/User.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all interviews for HR
router.get('/', authenticateToken, requireHR, async (req: AuthRequest, res) => {
  try {
    const interviews = await InterviewRoom.find({ hr: req.user?.userId })
      .populate('candidate', 'firstName lastName email')
      .sort({ scheduledFor: 1 });
    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ message: 'Error fetching interviews' });
  }
});

// Get interviews for a candidate
router.get('/candidate', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Only fetch interviews for the logged-in candidate
    const interviews = await InterviewRoom.find({ candidate: req.user?.userId })
      .populate('hr', 'firstName lastName email company')
      .sort({ scheduledFor: -1 }); // Most recent first
    res.json(interviews);
  } catch (error) {
    console.error('Error fetching candidate interviews:', error);
    res.status(500).json({ message: 'Error fetching interviews' });
  }
});

// Create new interview
router.post('/', authenticateToken, requireHR, async (req: AuthRequest, res) => {
  try {
    const { 
      title, 
      candidateEmail, 
      scheduledFor, 
      duration = 60, 
      jobRole = 'web-developer', 
      experienceLevel = 'mid-level' 
    } = req.body;

    // Find candidate by email
    const candidate = await User.findOne({ email: candidateEmail, role: 'candidate' });
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Generate unique room link
    const roomId = uuidv4();
    const roomLink = `/interview-room/${roomId}`;

    const interview = new InterviewRoom({
      title,
      hr: req.user?.userId,
      candidate: candidate._id,
      scheduledFor,
      duration,
      jobRole,
      experienceLevel,
      roomLink,
      status: 'scheduled',
    });

    await interview.save();

    // Populate candidate details for response
    await interview.populate('candidate', 'firstName lastName email');

    res.status(201).json(interview);
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ message: 'Error creating interview' });
  }
});

// Cancel interview
router.put('/:id/cancel', authenticateToken, requireHR, async (req: AuthRequest, res) => {
  try {
    const interview = await InterviewRoom.findOne({
      _id: req.params.id,
      hr: req.user?.userId,
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'scheduled') {
      return res.status(400).json({ message: 'Interview cannot be cancelled' });
    }

    interview.status = 'cancelled';
    await interview.save();

    res.json(interview);
  } catch (error) {
    console.error('Error cancelling interview:', error);
    res.status(500).json({ message: 'Error cancelling interview' });
  }
});

// Get interview details
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const interview = await InterviewRoom.findById(req.params.id)
      .populate('hr', 'firstName lastName email company')
      .populate('candidate', 'firstName lastName email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    // Check if user is either the HR or the candidate
    if (
      req.user?.userId !== interview.hr._id.toString() &&
      req.user?.userId !== interview.candidate._id.toString()
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ message: 'Error fetching interview details' });
  }
});

// Complete interview
router.put('/:id/complete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Allow both HR and candidates to mark an interview as complete
    const interview = await InterviewRoom.findOne({
      _id: req.params.id,
      $or: [
        { hr: req.user?.userId },
        { candidate: req.user?.userId }
      ]
    });

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'scheduled') {
      return res.status(400).json({ message: 'Interview cannot be completed' });
    }

    interview.status = 'completed';
    await interview.save();

    res.json(interview);
  } catch (error) {
    console.error('Error completing interview:', error);
    res.status(500).json({ message: 'Error completing interview' });
  }
});

// Auto-complete interview based on scheduled time
router.put('/:id/auto-complete', async (req, res) => {
  try {
    const interview = await InterviewRoom.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    if (interview.status !== 'scheduled') {
      return res.status(400).json({ message: 'Interview is already completed or cancelled' });
    }

    // Check if the interview time has passed
    const now = new Date();
    const scheduledTime = new Date(interview.scheduledFor);
    const endTime = new Date(scheduledTime.getTime() + interview.duration * 60000); // Convert minutes to milliseconds
    
    if (now > endTime) {
      interview.status = 'completed';
      await interview.save();
      return res.json({ message: 'Interview automatically completed', interview });
    }
    
    return res.status(400).json({ message: 'Interview time has not ended yet' });
  } catch (error) {
    console.error('Error auto-completing interview:', error);
    res.status(500).json({ message: 'Error auto-completing interview' });
  }
});

// Fix the endpoint URL to match what's used in the InterviewRoomPage
router.put('/auto-complete/:id', async (req, res) => {
  try {
    const idParam = req.params.id;
    let interview;

    // Attempt to find by ObjectId first (if it's a valid ObjectId format)
    if (mongoose.Types.ObjectId.isValid(idParam)) {
      interview = await InterviewRoom.findById(idParam);
    }

    // If not found by ObjectId, or if idParam was not a valid ObjectId format, try by roomLink UUID part
    if (!interview) {
      console.log(`[Auto-Complete] Could not find by _id ${idParam}, trying by roomLink UUID part.`);
      const roomLinkToFind = `/interview-room/${idParam}`;
      interview = await InterviewRoom.findOne({ roomLink: roomLinkToFind });
    }

    if (!interview) {
      console.log(`[Auto-Complete] Interview not found by _id or roomLink for param: ${idParam}`);
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    console.log(`[Auto-Complete] Found interview ${interview._id} with status ${interview.status}`);

    if (interview.status !== 'scheduled') {
      return res.status(400).json({ message: `Interview is already ${interview.status}` });
    }

    interview.status = 'completed';
    await interview.save();
    console.log(`[Auto-Complete] Marked interview ${interview._id} as completed.`);
    
    return res.json({ message: 'Interview automatically completed', interview });
  } catch (error) {
    console.error('Error auto-completing interview:', error);
    res.status(500).json({ message: 'Error auto-completing interview' });
  }
});

// Get interview by room ID (for candidates to join)
router.get('/room/:roomId', async (req, res) => {
  try {
    const roomLink = `/interview-room/${req.params.roomId}`;
    const interview = await InterviewRoom.findOne({ roomLink })
      .populate('hr', 'firstName lastName email company')
      .populate('candidate', 'firstName lastName email');

    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }

    res.json(interview);
  } catch (error) {
    console.error('Error fetching interview by room ID:', error);
    res.status(500).json({ message: 'Error fetching interview details' });
  }
});

// Complete interview by room ID
router.put('/room/:roomId/complete', async (req, res) => {
  try {
    console.log(`Attempting to complete interview with room ID: ${req.params.roomId}`);
    const roomLink = `/interview-room/${req.params.roomId}`;
    
    console.log(`Looking for interview with roomLink: ${roomLink}`);
    const interview = await InterviewRoom.findOne({ roomLink });

    if (!interview) {
      console.log(`No interview found with roomLink: ${roomLink}`);
      
      // Try direct ID lookup as fallback
      try {
        console.log(`Trying direct ID lookup for: ${req.params.roomId}`);
        const interviewById = await InterviewRoom.findById(req.params.roomId);
        
        if (!interviewById) {
          console.log(`No interview found by direct ID either: ${req.params.roomId}`);
          return res.status(404).json({ message: 'Interview not found' });
        }
        
        if (interviewById.status !== 'scheduled') {
          console.log(`Interview found by ID but status is: ${interviewById.status}`);
          return res.status(400).json({ message: 'Interview is already completed or cancelled' });
        }
        
        console.log(`Updating interview status to completed for ID: ${interviewById._id}`);
        interviewById.status = 'completed';
        await interviewById.save();
        
        return res.json({
          message: 'Interview marked as completed via direct ID',
          interview: interviewById
        });
      } catch (idError) {
        console.error('Error in direct ID lookup:', idError);
        return res.status(404).json({ message: 'Interview not found by room ID or direct ID' });
      }
    }

    if (interview.status !== 'scheduled') {
      console.log(`Interview found but status is: ${interview.status}`);
      return res.status(400).json({ message: 'Interview is already completed or cancelled' });
    }

    console.log(`Updating interview status to completed for ID: ${interview._id}`);
    interview.status = 'completed';
    await interview.save();

    return res.json({ 
      message: 'Interview marked as completed',
      interview 
    });
  } catch (error) {
    console.error('Error completing interview by room ID:', error);
    res.status(500).json({ message: 'Error completing interview' });
  }
});

// Generate interview questions using Gemini
router.post('/gemini/questions', async (req, res) => {
  try {
    const { jobRole, experienceLevel, count = 4 } = req.body; // experienceLevel is not used by the python service directly for question fetching but kept for consistency with original signature
    
    if (!jobRole) { // experienceLevel is not strictly required by the python service for this endpoint
      return res.status(400).json({ message: 'Job role is required' });
    }

    const evaluatorServiceUrl = process.env.EVALUATOR_SERVICE_URL || 'http://localhost:8001';

    try {
      const response = await axios.post(`${evaluatorServiceUrl}/fetch-questions`, {
        role: jobRole, // Python service expects 'role'
        num_questions: count,
      });

      // The Python service returns an array of objects: [{ id: number, text: string }]
      // We need to adapt this to the expected format: { questions: string[] }
      if (response.data && Array.isArray(response.data)) {
        const questions = response.data.map((q: { id: number; text: string }) => q.text);
        res.json({ questions });
      } else {
        console.error('Unexpected response format from evaluator service:', response.data);
        res.status(500).json({ message: 'Error fetching questions: Unexpected response from evaluator service' });
      }
    } catch (apiError: any) {
      console.error('Error calling evaluator service for questions:', apiError.message);
      if (apiError.response) {
        console.error('Evaluator service response error:', apiError.response.data);
        // Forward the status and message from the evaluator service if available
        return res.status(apiError.response.status || 500).json({
          message: apiError.response.data?.detail || 'Error fetching questions from evaluator service'
        });
      }
      res.status(500).json({ message: 'Error fetching questions from evaluator service' });
    }
  } catch (error) {
    console.error('Error generating questions with Gemini:', error);
    res.status(500).json({ message: 'Error generating interview questions' });
  }
});

// Analyze interview answer using Gemini
router.post('/gemini/analyze', async (req, res) => {
  try {
    const { question, answer, jobRole, experienceLevel } = req.body;
    
    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const evaluatorServiceUrl = process.env.EVALUATOR_SERVICE_URL || 'http://localhost:8001';

    try {
      const response = await axios.post(`${evaluatorServiceUrl}/evaluate-answer`, {
        question,
        answer,
        role: jobRole, // Pass jobRole as role to the evaluator service
        // experienceLevel is not explicitly used by the python service's evaluate-answer endpoint currently
      });

      // Python service returns { score: float (0.0-1.0), feedback: string }
      // Adapt to the format previously expected by the frontend if necessary.
      // Current mock returns score (0-100), feedback, strengths, weaknesses.
      // We will adapt score and feedback. Strengths/weaknesses are not returned by the python service.
      if (response.data && typeof response.data.score === 'number' && typeof response.data.feedback === 'string') {
        const analysis = {
          score: Math.round(response.data.score * 100), // Convert 0.0-1.0 to 0-100
          feedback: response.data.feedback,
          // strengths and weaknesses are not provided by the current python service
          // If needed, the python service prompt and parsing would need to be updated.
        };
        res.json(analysis);
      } else {
        console.error('Unexpected response format from evaluator service for analysis:', response.data);
        res.status(500).json({ message: 'Error analyzing answer: Unexpected response from evaluator service' });
      }
    } catch (apiError: any) {
      console.error('Error calling evaluator service for analysis:', apiError.message);
      if (apiError.response) {
        console.error('Evaluator service analysis response error:', apiError.response.data);
        return res.status(apiError.response.status || 500).json({
          message: apiError.response.data?.detail || 'Error analyzing answer from evaluator service'
        });
      }
      res.status(500).json({ message: 'Error analyzing answer from evaluator service' });
    }
  } catch (error) {
    console.error('Error analyzing answer with Gemini:', error);
    res.status(500).json({ message: 'Error analyzing interview answer' });
  }
});

// Text-to-speech for questions
router.post('/tts', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Text is required' });
    }
    
    // In a production environment, you would make an API call to a TTS service
    // For now, just return success (client will use browser's TTS)
    
    res.json({ success: true, message: 'TTS request received' });
  } catch (error) {
    console.error('Error with TTS request:', error);
    res.status(500).json({ message: 'Error with text-to-speech request' });
  }
});

export default router; 