// frontend/src/components/questions/TextQuestion.jsx
import React from 'react';

const TextQuestion = ({ question, onAnswerChange, currentAnswer }) => {
  const isTextarea = question.question_type === 'textarea';
  const value = currentAnswer || '';

  return (
    <div className="py-4">
      <label htmlFor={`q-${question.id}`} className="block text-sm font-medium text-slate-800">
        {question.text}
        {question.is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-2">
        {isTextarea ? (
          <textarea
            id={`q-${question.id}`}
            rows="4"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            value={value}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            required={question.is_required}
          />
        ) : (
          <input
            type={question.question_type === 'email' ? 'email' : 'text'}
            id={`q-${question.id}`}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
            value={value}
            onChange={(e) => onAnswerChange(question.id, e.target.value)}
            required={question.is_required}
          />
        )}
      </div>
    </div>
  );
};

export default TextQuestion;