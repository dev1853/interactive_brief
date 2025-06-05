// frontend/src/components/BriefForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBriefById, submitAnswers } from '../api/client';
import { v4 as uuidv4 } from 'uuid';
import Question from './Question';
import ProgressBar from './ProgressBar';

const checkCondition = (condition, answers) => {
  if (!condition || !condition.show_if) return true;
  const { question_id, operator, value } = condition.show_if;
  const targetAnswer = answers[question_id];
  if (targetAnswer === undefined) return false;
  switch (operator) {
    case 'equals': return targetAnswer === value;
    case 'not_equals': return targetAnswer !== value;
    case 'contains': return Array.isArray(targetAnswer) && targetAnswer.includes(value);
    default: return false;
  }
};

const BriefForm = () => {
  const { briefId } = useParams();
  const navigate = useNavigate();

  const [brief, setBrief] = useState(null);
  const [answers, setAnswers] = useState({});
  const [sessionId, setSessionId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    setSessionId(uuidv4());
    const fetchBriefData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getBriefById(briefId);
        setBrief(data);
      } catch (e) {
        setError("Ошибка загрузки брифа");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBriefData();
  }, [briefId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const visibleSteps = useMemo(() => {
    if (!brief || !brief.steps) return [];
    return brief.steps
      .filter(step => checkCondition(step.conditional_logic, answers))
      .sort((a, b) => a.order - b.order);
  }, [brief, answers]);

  const currentStep = visibleSteps[currentStepIndex];

  const visibleQuestionsForCurrentStep = useMemo(() => {
    if (!currentStep) return [];
    return currentStep.questions.filter(q => checkCondition(q.conditional_logic, answers));
  }, [currentStep, answers]);
  
  const nextStep = () => {
    if (currentStepIndex < visibleSteps.length - 1) {
      setCurrentStepIndex(i => i + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(i => i - 1);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    const submissionData = {
      brief_id: parseInt(briefId, 10),
      session_id: sessionId,
      answers_data: answers
    };
    try {
      await submitAnswers(submissionData);
      navigate('/thank-you', { state: { sessionId: submissionData.session_id } });
    } catch (err) {
      setError(err.message || 'Произошла ошибка при отправке.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-center p-10 text-slate-500">Загрузка формы...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!brief) return <div className="text-center p-10 text-slate-500">Бриф не найден.</div>;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div style={{
        position: 'fixed', top: '10px', left: '10px', 
        background: 'rgba(0,0,0,0.8)', color: 'white', 
        padding: '10px', zIndex: 9999, fontSize: '14px',
        border: '2px solid red', borderRadius: '8px'
      }}>
        <h4 style={{margin: 0, paddingBottom: '5px', borderBottom: '1px solid #555'}}>-- ОТЛАДКА --</h4>
        <p>Текущий шаг (индекс): <strong>{currentStepIndex}</strong></p>
        <p>Всего шагов (длина): <strong>{visibleSteps.length}</strong></p>
        <p>Это последний шаг? <strong>{JSON.stringify(currentStepIndex >= visibleSteps.length - 1)}</strong></p>
      </div>

      {/* 3. Ваш существующий JSX остается ниже */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-10">
            {/* ... */}
        </div>
        {/* ... и так далее */}
      </div>
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-slate-900">{brief.title}</h1>
        <p className="text-lg text-slate-600 mt-2 max-w-2xl mx-auto">{brief.description}</p>
      </div>

      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-10 pb-10">
          <ProgressBar steps={visibleSteps} currentStepIndex={currentStepIndex} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          {currentStep && visibleQuestionsForCurrentStep.map(q => (
            <Question
              key={q.id}
              question={q}
              onAnswerChange={handleAnswerChange}
              currentAnswer={answers[q.id]}
            />
          ))}

          <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
            {/* Кнопка НАЗАД */}
            <button
              type="button" // Тип "button" предотвращает отправку формы
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="px-6 py-2 rounded-lg text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              Назад
            </button>

            {/* Условие для отображения кнопок */}
            {currentStepIndex < visibleSteps.length - 1 ? (
              // Кнопка ДАЛЕЕ
              <button
                type="button" 
                onClick={nextStep} 
                className="px-6 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Далее
              </button>
            ) : (
              // Кнопка ОТПРАВИТЬ
              <button
                type="button" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400"
              >
                {isSubmitting ? 'Отправка...' : 'Отправить ответы'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
    
  );
};

export default BriefForm;