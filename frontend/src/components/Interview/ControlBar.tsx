import React from 'react';

interface ControlBarProps {
  currentQuestion: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
}

const ControlBar: React.FC<ControlBarProps> = ({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  onFinish,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-4 mt-6 flex justify-between items-center">
      <div className="text-sm text-gray-600">
        Question {currentQuestion} of {totalQuestions}
      </div>
      <div className="flex space-x-3">
        <button
          onClick={onPrevious}
          disabled={currentQuestion === 1}
          className={`px-4 py-2 rounded border ${
            currentQuestion === 1
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          Previous
        </button>
        {currentQuestion < totalQuestions ? (
          <button
            onClick={onNext}
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          >
            Next
          </button>
        ) : (
          <button
            onClick={onFinish}
            className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
          >
            Finish Interview
          </button>
        )}
      </div>
    </div>
  );
};

export default ControlBar; 