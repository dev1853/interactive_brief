// frontend/src/components/questions/DateQuestion.jsx

import React from 'react';

// Используем тот же стиль, что и для других полей ввода
const inputStyle = "w-full lg:w-auto px-4 py-2 mt-3 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none transition-shadow shadow-sm focus:border-indigo-600";

const DateQuestion = ({ question, onAnswerChange, currentAnswer }) => {
  const { id, text, is_required } = question;

  const handleChange = (e) => {
    // Передаем значение в формате 'YYYY-MM-DD'
    onAnswerChange(id, e.target.value);
  };

  return (
    <div>
      <label htmlFor={`question_${id}`} className="text-xl font-semibold text-slate-900">
        {text}
        {is_required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <div className="mt-2">
        <input
          id={`question_${id}`}
          type="date"
          className={inputStyle}
          required={is_required}
          value={currentAnswer || ''} // value должно быть в формате YYYY-MM-DD
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default DateQuestion;