import React from 'react';

interface QuestionDisplayProps {
  question: string;
  questionNumber: number;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({ question, questionNumber }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Question {questionNumber}</h3>
      <p className="text-gray-700">{question}</p>
    </div>
  );
};

export default QuestionDisplay;
 