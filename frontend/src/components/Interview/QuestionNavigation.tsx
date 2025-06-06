import React from 'react';

interface QuestionNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  disablePrevious?: boolean;
  disableNext?: boolean;
}

const QuestionNavigation: React.FC<QuestionNavigationProps> = ({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  disablePrevious = false,
  disableNext = false,
}) => {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="font-medium mb-3">Question Navigation</h3>
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Question {currentIndex + 1} of {totalQuestions}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onPrevious}
            disabled={currentIndex === 0 || disablePrevious}
            className={`px-4 py-2 rounded border ${
              currentIndex === 0 || disablePrevious
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>
          <button
            onClick={onNext}
            disabled={currentIndex === totalQuestions - 1 || disableNext}
            className={`px-4 py-2 rounded ${
              currentIndex === totalQuestions - 1 || disableNext
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigation; 