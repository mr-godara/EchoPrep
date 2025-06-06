import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  const progress = Math.round((current / total) * 100);

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
        style={{ width: `${progress}%` }}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span className="sr-only">{progress}% Complete</span>
      </div>
      <div className="text-xs text-gray-500 mt-1 text-right">
        Question {current} of {total}
      </div>
    </div>
  );
};

export default ProgressBar; 