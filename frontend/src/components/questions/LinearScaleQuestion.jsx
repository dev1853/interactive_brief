// frontend/src/components/questions/LinearScaleQuestion.jsx

import React from 'react';

const LinearScaleQuestion = ({ question, onAnswerChange, currentAnswer }) => {
  const { id, text, options, is_required } = question;

  const handleChange = (e) => {
    onAnswerChange(id, e.target.value);
  };

  return (
    <fieldset className="mt-4">
      <legend className="text-xl font-semibold text-slate-900">
        {text}
        {is_required && <span className="text-red-500 ml-1">*</span>}
      </legend>
      
      <div className="flex items-center justify-between mt-4 gap-2 md:gap-4">
        <span className="text-slate-500">Неважно</span>
        <div className="flex items-center gap-2">
          {options.map((optionValue) => {
            const isChecked = currentAnswer === optionValue;
            return (
              <label key={optionValue} className="cursor-pointer">
                <input
                  type="radio"
                  name={`question_${id}`}
                  value={optionValue}
                  checked={isChecked}
                  onChange={handleChange}
                  required={is_required && !currentAnswer}
                  className="sr-only peer" // Прячем радио-кнопку, оставляя ее функциональной
                />
                {/* Стилизованный блок, который видит пользователь */}
                <div
                  className={`
                    w-12 h-12 flex items-center justify-center rounded-lg border 
                    transition-all duration-200
                    peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600
                    hover:border-indigo-500
                    ${isChecked ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-800 border-slate-300'}
                  `}
                >
                  <span className="text-lg font-semibold">{optionValue}</span>
                </div>
              </label>
            );
          })}
        </div>
        <span className="text-slate-500">Критически важно</span>
      </div>
    </fieldset>
  );
};

export default LinearScaleQuestion;