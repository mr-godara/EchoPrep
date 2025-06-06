import express, { Request } from 'express'; // Import Request for untyped routes if needed
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import InterviewResult from '../../lib/models/InterviewResult.js';
import InterviewRoom from '../../lib/models/InterviewRoom.js';

const router = express.Router();

// Get all interview results for a user (candidate or HR)
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    let results;
    
    if (userRole === 'hr') {
      // For HR users, get results for all their interviews
      const interviews = await InterviewRoom.find({ hr: userId });
      const interviewIds = interviews.map(interview => interview._id); // Mongoose should infer 'interview' type here from 'interviews'
      
      results = await InterviewResult.find({
        interviewId: { $in: interviewIds } 
      }).sort({ createdAt: -1 });
    } else {
      // For candidates, get only their results
      results = await InterviewResult.find({ 
        candidateId: userId 
      }).sort({ createdAt: -1 });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching interview results:', error);
    res.status(500).json({ message: 'Error fetching interview results' });
  }
});

// IMPORTANT: Routes with parameters should be ordered from most specific to least specific
// Get interview results by interview ID - this more specific route must come before the generic :id route
router.get('/interview/:interviewId', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log(`Fetching results for interview ID: ${req.params.interviewId}`);
    const interviewId = req.params.interviewId;
    
    // First check if the interview exists and user has access
    const interview = await InterviewRoom.findById(interviewId);
    
    if (!interview) {
      console.log(`Interview not found with ID: ${interviewId}`);
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    console.log(`Interview found, checking permissions. Status: ${interview.status}`);
    
    // Check permissions
    if (req.user?.role === 'hr' && interview.hr.toString() !== req.user.userId) {
      console.log('Access denied: HR does not match');
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (req.user?.role === 'candidate' && interview.candidate.toString() !== req.user.userId) {
      console.log('Access denied: Candidate does not match');
      return res.status(403).json({ message: 'Access denied' });
    }
    
    // Find results for this interview
    console.log(`Searching for results with interviewId: ${interviewId}`);
    const results = await InterviewResult.find({ interviewId }).sort({ createdAt: -1 });
    
    if (results.length === 0) {
      console.log(`No results found for interview ID: ${interviewId}`);
      
      // If the interview is completed but no results, provide better feedback
      if (interview.status === 'completed') {
        return res.status(404).json({ 
          message: 'Interview is marked as completed, but no results are available yet',
          interviewStatus: interview.status
        });
      } else {
        return res.status(404).json({ 
          message: 'No results available for this interview yet',
          interviewStatus: interview.status
        });
      }
    }
    
    console.log(`Found ${results.length} results, returning the most recent one`);
    // Return the most recent result
    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching interview results:', error);
    res.status(500).json({ message: 'Error fetching interview results' });
  }
});

// Get interview result by ID
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const result = await InterviewResult.findById(req.params.id);
    
    if (!result) {
      return res.status(404).json({ message: 'Interview result not found' });
    }
    
    // Check if user has permission to view this result
    if (req.user?.role === 'candidate' && result.candidateId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    
    if (req.user?.role === 'hr') {
      // Check if the HR is associated with this interview
      const interview = await InterviewRoom.findById(result.interviewId);
      if (!interview || interview.hr.toString() !== req.user.userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching interview result:', error);
    res.status(500).json({ message: 'Error fetching interview result' });
  }
});

// Create new interview result
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    console.log("Creating new interview result");
    const {
      interviewId,
      jobRole,
      experienceLevel,
      totalScore,
      feedback,
      strengths,
      improvements,
      answers
    } = req.body;
    
    // If interviewId is provided, validate it
    let interviewDocument = null;
    let actualInterviewObjectId = undefined;

    if (interviewId) { // interviewId here is the UUID string from the room link
      console.log(`Attempting to find interview room using UUID part: ${interviewId}`);
      const linkToFind = `/interview-room/${interviewId}`;
      interviewDocument = await InterviewRoom.findOne({ roomLink: linkToFind });
      
      if (!interviewDocument) {
        console.log(`InterviewRoom not found with roomLink containing UUID: ${interviewId}`);
        // Optionally, you could try a direct findById if interviewId *could* be an ObjectId,
        // but current logs suggest it's always the UUID.
        // For now, we'll consider it not found if roomLink doesn't match.
        return res.status(404).json({ message: `InterviewRoom associated with ID ${interviewId} not found via roomLink.` });
      }
      actualInterviewObjectId = interviewDocument._id; // This is the actual ObjectId
      console.log(`Found InterviewRoom with _id: ${actualInterviewObjectId} for UUID part: ${interviewId}`);
      
      // Mark the interview as completed
      if (interviewDocument.status === 'scheduled') {
        console.log(`Marking interview ${actualInterviewObjectId} as completed`);
        interviewDocument.status = 'completed';
        await interviewDocument.save();
        console.log("Interview status updated to 'completed'");
      } else {
        console.log(`Interview ${actualInterviewObjectId} already has status: ${interviewDocument.status}`);
      }
    } else {
      console.log("No interview ID (UUID part) provided with results. Saving result without linking to a specific InterviewRoom.");
    }
    
    // Check if we already have results for this actualInterviewObjectId
    if (actualInterviewObjectId) {
      const existingResults = await InterviewResult.find({ interviewId: actualInterviewObjectId });
      if (existingResults.length > 0) {
        console.log(`Found ${existingResults.length} existing results for interview _id ${actualInterviewObjectId}. Will create a new version.`);
      }
    }
    
    // Create the result
    const result = new InterviewResult({
      candidateId: req.user?.userId,
      interviewId: actualInterviewObjectId, // Use the actual ObjectId here
      jobRole,
      experienceLevel,
      totalScore,
      feedback,
      strengths,
      improvements,
      answers,
      date: new Date()
    });
    
    console.log("Saving new interview result");
    await result.save();
    console.log(`Result saved with ID: ${result._id}`);
    
    // If we have an interview, update it with a reference to the results
    if (interviewDocument) {
      try {
        console.log(`Adding result reference to interview ${interviewDocument._id}`);
        const newNote = `Result ID: ${result._id} - Score: ${totalScore}/100`;
        if (typeof interviewDocument.notes === 'string' && interviewDocument.notes.length > 0) {
          interviewDocument.notes += `\n${newNote}`;
        } else {
          interviewDocument.notes = newNote;
        }
        
        await interviewDocument.save();
        console.log("Updated interview with result reference");
      } catch (updateError) {
        console.error("Error updating interview with result reference:", updateError);
        // Continue processing even if this fails
      }
    }
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating interview result:', error);
    res.status(500).json({ message: 'Error creating interview result' });
  }
});

export default router; 