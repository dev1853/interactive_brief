// frontend/src/components/questions/ChoiceQuestion.jsx

import React from 'react';
import { Check } from 'lucide-react';

const ChoiceQuestion = ({ question, onAnswerChange, currentAnswer }) => {
  const { id, text, question_type, options, is_required } = question;
  const isMulti = question_type === 'multi_choice';

  const handleChange = (e) => {
    onAnswerChange(id, e.target.value);
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    const currentValues = Array.isArray(currentAnswer) ? currentAnswer : [];
    let newValues;

    if (checked) {
      newValues = [...currentValues, value];
    } else {
      newValues = currentValues.filter(item => item !== value);
    }
    onAnswerChange(id, newValues);
  };

  // --- НОВАЯ ЛОГИКА РЕНДЕРИНГА ---

  // Если это МНОЖЕСТВЕННЫЙ выбор (чекбоксы)
  if (isMulti) {
    return (
      <fieldset>
        <legend className="text-xl font-semibold text-slate-900">
          {text}
          {is_required && <span className="text-red-500 ml-1">*</span>}
        </legend>
        <div className="mt-4 space-y-4">
          {options.map((option, index) => (
            <div key={index} className="relative flex items-start">
              <div className="flex h-6 items-center">
                <input
                  id={`${id}-${index}`}
                  name={`question_${id}`}
                  type="checkbox"
                  value={option}
                  checked={(currentAnswer || []).includes(option)}
                  onChange={handleCheckboxChange}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
              </div>
              <div className="ml-3 text-sm leading-6">
                <label htmlFor={`${id}-${index}`} className="font-medium text-slate-900 cursor-pointer">
                  {option}
                </label>
                {/* <p className="text-slate-500">Здесь могло бы быть описание.</p> */}
              </div>
            </div>
          ))}
        </div>
      </fieldset>
    );
  }

  // Если это ОДИНОЧНЫЙ выбор (радио-кнопки), используем наш предыдущий дизайн
  return (
    <div>
      <h3 className="text-xl font-semibold text-slate-900">
        {text}
        {is_required && <span className="text-red-500 ml-1">*</span>}
      </h3>
      <div className="mt-4">
        <div className="relative bg-white rounded-lg border border-slate-300">
          {options.map((option, index) => {
            const isChecked = currentAnswer === option;
            return (
              <label
                key={option}
                className={`relative flex items-center p-4 cursor-pointer transition-colors ${index !== options.length - 1 ? 'border-b border-slate-200' : ''} ${isChecked ? 'bg-indigo-50 border-indigo-200 z-10' : 'hover:bg-slate-50'}`}
              >
                <input
                  type="radio"
                  name={`question_${id}`}
                  value={option}
                  checked={isChecked}
                  onChange={handleChange}
                  required={is_required && !currentAnswer}
                  className="absolute opacity-0 h-full w-full cursor-pointer"
                />
                <div className="flex-1 mr-4">
                  <span className="font-medium text-slate-900">{option}</span>
                </div>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full border transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`} aria-hidden="true">
                  {isChecked && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  );
};

export default ChoiceQuestion;