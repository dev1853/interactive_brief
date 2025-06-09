// frontend/src/components/BriefForm.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Импортируем наши новые функции для работы с API
import { getBriefById, createSubmission } from '../api/client';
import Question from './Question';
import ProgressBar from './ProgressBar';


const BriefForm = ({ briefId: propBriefId }) => {
  // Определяем ID: либо из props (для главной страницы), либо из URL
  const { id: paramId } = useParams();
  const briefId = propBriefId || paramId;

  const navigate = useNavigate();

  const [brief, setBrief] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Загрузка данных брифа
  useEffect(() => {
    if (!briefId) {
      setError('ID брифа не указан.');
      setLoading(false);
      return;
    }
    
    const fetchBrief = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getBriefById(briefId);
        setBrief(response.data);
      } catch (err) {
        setError('Не удалось загрузить бриф. Возможно, он не существует или была сетевая ошибка.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchBrief();
  }, [briefId]); // useEffect сработает, когда изменится briefId

  const handleAnswerChange = useCallback((questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSubmission({ brief_id: brief.id, answers });
      navigate('/thank-you'); // Перенаправляем на страницу благодарности
    } catch (err) {
      console.error("Ошибка при отправке брифа:", err);
      alert('Произошла ошибка при отправке. Пожалуйста, попробуйте снова.');
    }
  };

  const nextStep = () => {
    setCurrentStepIndex(prev => Math.min(prev + 1, brief.steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStepIndex(prev => Math.max(prev - 1, 0));
  };
  
  if (loading) {
    return <div className="text-center p-10">Загрузка брифа...</div>;
  }
  
  if (error) {
    return <div className="text-center p-10 text-red-600 bg-red-50 rounded-lg">{error}</div>;
  }
  
  if (!brief) {
    return <div className="text-center p-10">Бриф не найден.</div>;
  }

  const currentStep = brief.steps[currentStepIndex];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-8">
      <div className="bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-lg">
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-2">{brief.title}</h1>
        <p className="text-slate-600 mb-8">{brief.description}</p>

        <ProgressBar steps={brief.steps} currentStepIndex={currentStepIndex} />
        
        <form onSubmit={handleSubmit}>
          <div key={currentStep.id} className="mt-8">
             <h2 className="text-2xl font-semibold text-slate-800 border-b pb-2 mb-6">{currentStep.title}</h2>
             {currentStep.questions.map(q => (
                <Question 
                  key={q.id}
                  question={q}
                  onAnswerChange={handleAnswerChange}
                  currentAnswer={answers[q.id]}
                />
             ))}
          </div>

          <div className="mt-10 flex justify-between items-center">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
              className="px-6 py-2 rounded-lg text-slate-700 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
            >
              Назад
            </button>
            
            {currentStepIndex === brief.steps.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-8 py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md transition-colors"
              >
                Отправить бриф
              </button>
            ) : (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 rounded-lg text-white bg-indigo-500 hover:bg-indigo-600 font-semibold transition-colors"
              >
                Далее
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BriefForm;