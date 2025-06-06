// frontend/src/components/questions/TextQuestion.jsx

import React from 'react';

const inputBaseStyle = "w-full px-4 py-2 mt-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-shadow shadow-sm focus:border-indigo-600";
const textAreaStyle = `${inputBaseStyle} min-h-[120px]`;

const TextQuestion = ({ question, onAnswerChange, currentAnswer }) => {
  const { id, text, question_type, is_required } = question;

  const handleChange = (e) => {
    onAnswerChange(id, e.target.value);
  };

  const renderInput = () => {
    if (question_type === 'number') {
      return (
        <input
          id={`question_${id}`}
          type="number"
          className={inputBaseStyle}
          required={is_required}
          value={currentAnswer || ''}
          onChange={handleChange}
          placeholder="Введите число..."
        />
      );
    }

    return (
      <textarea
        id={`question_${id}`}
        className={textAreaStyle}
        required={is_required}
        value={currentAnswer || ''}
        onChange={handleChange}
        placeholder="Ваш ответ..."
      />
    );
  };
  
  return (
    <div>
      <label htmlFor={`question_${id}`} className="text-xl font-semibold text-slate-900">
        {text}
        {is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
    </div>
  )
};

export default TextQuestion;