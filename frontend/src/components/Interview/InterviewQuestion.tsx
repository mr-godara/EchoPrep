import React from 'react';

interface InterviewQuestionProps {
  question: string;
}

const InterviewQuestion: React.FC<InterviewQuestionProps> = ({ question }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="font-semibold text-xl mb-3">Question</h2>
      <p className="text-lg">{question}</p>
    </div>
  );
};

export default InterviewQuestion; 