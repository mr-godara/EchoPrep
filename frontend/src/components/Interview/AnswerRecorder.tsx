import React from 'react';

interface AnswerRecorderProps {
  isRecording: boolean;
  recordingTime: number;
  answer: string;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onAnswerChange: (answer: string) => void;
}

const AnswerRecorder: React.FC<AnswerRecorderProps> = ({
  isRecording,
  recordingTime,
  answer,
  onStartRecording,
  onStopRecording,
  onAnswerChange,
}) => {
  // Format recording time as MM:SS
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mt-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-xl">Your Answer</h2>
        <div className="flex items-center">
          {isRecording && (
            <span className="text-red-500 mr-2 flex items-center">
              <span className="inline-block h-3 w-3 bg-red-500 rounded-full mr-2 animate-pulse"></span>
              Recording {formatTime(recordingTime)}
            </span>
          )}
          <button
            onClick={isRecording ? onStopRecording : onStartRecording}
            className={`px-4 py-2 rounded ${
              isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
      </div>
      <textarea
        className="w-full border rounded-lg p-3 min-h-[150px]"
        value={answer}
        onChange={(e) => onAnswerChange(e.target.value)}
        placeholder="Your answer will appear here as you speak or you can type directly..."
      ></textarea>
    </div>
  );
};

export default AnswerRecorder; 