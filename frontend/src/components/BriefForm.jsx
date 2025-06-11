// frontend/src/components/BriefForm.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBriefById, createSubmission } from '../api/client';
import Question from './Question';
import ProgressBar from './ProgressBar';

const BriefForm = ({ briefId: propBriefId }) => {
  const { id: paramId } = useParams();
  const briefId = propBriefId || paramId;
  const navigate = useNavigate();

  const [brief, setBrief] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- ЛОГИКА УСЛОВНЫХ ПЕРЕХОДОВ ---
  const visibleSteps = useMemo(() => {
    if (!brief?.steps) return [];

    const visible = [];
    // Проходим по всем шагам, чтобы определить, какие из них видимы
    for (const step of brief.steps) {
      const logic = step.conditional_logic;
      // Если у шага нет логики, он всегда видим
      if (!logic || !logic.show_if || !logic.show_if.question_id) {
        visible.push(step);
        continue;
      }
      
      const { question_id, operator, value } = logic.show_if;
      const actualAnswer = answers[question_id];

      let shouldShow = false;
      // Проверяем условие
      if (operator === 'equals') {
        if (Array.isArray(actualAnswer)) { // для чекбоксов
          shouldShow = actualAnswer.includes(value);
        } else { // для радио и текста
          shouldShow = actualAnswer === value;
        }
      } else if (operator === 'not_equals') {
        if (Array.isArray(actualAnswer)) {
            shouldShow = !actualAnswer.includes(value);
        } else {
            shouldShow = actualAnswer !== value;
        }
      }
      // Здесь можно добавить другие операторы: 'contains', 'greater_than', etc.

      if (shouldShow) {
        visible.push(step);
      }
    }
    return visible;
  }, [brief, answers]); // Пересчитываем каждый раз при изменении брифа или ответов

  const [visibleStepIndex, setVisibleStepIndex] = useState(0);

  // Определяем текущий шаг на основе массива видимых шагов
  const currentStep = visibleSteps[visibleStepIndex];
  
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
        setError('Не удалось загрузить бриф.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBrief();
  }, [briefId]);

  // Сброс индекса, если текущий шаг исчез из видимых
  useEffect(() => {
    if (!currentStep) {
      // Если текущий шаг скрылся, ищем ближайший предыдущий видимый
      if (visibleSteps.length > 0 && visibleStepIndex >= visibleSteps.length) {
        setVisibleStepIndex(visibleSteps.length - 1);
      }
    }
  }, [visibleSteps, currentStep, visibleStepIndex]);


  const handleAnswerChange = useCallback((questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSubmission({ brief_id: brief.id, answers });
      navigate('/thank-you');
    } catch (err) {
      console.error("Ошибка при отправке брифа:", err);
      alert('Произошла ошибка при отправке.');
    }
  };

  const nextStep = () => {
    setVisibleStepIndex(prev => Math.min(prev + 1, visibleSteps.length - 1));
  };

  const prevStep = () => {
    setVisibleStepIndex(prev => Math.max(prev - 1, 0));
  };
  
  if (loading) return <div className="flex h-screen items-center justify-center text-lg">Загрузка брифа...</div>;
  if (error) return <div className="p-8 text-red-600 bg-red-50">{error}</div>;
  
  // Если не загрузился бриф или не осталось видимых шагов
  if (!brief || !currentStep) {
    return <div className="flex h-screen items-center justify-center text-gray-500">Нет доступных шагов для отображения.</div>;
  }

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Заполните бриф</h1>
                    <p className="mt-3 text-base text-slate-600">Название брифа: <span className="font-semibold">{brief.title}</span></p>
                </div>
                
                <div className="my-10">
                  <ProgressBar steps={visibleSteps} currentStepIndex={visibleStepIndex} />
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div key={currentStep.id} className="mt-8">
                        <h2 className="text-2xl font-semibold text-slate-800">{currentStep.title}</h2>
                        <p className="text-sm text-slate-500 mb-6">{currentStep.description}</p>
                        
                        {currentStep.questions.map(q => (
                            <Question 
                              key={q.id}
                              question={q}
                              onAnswerChange={handleAnswerChange}
                              currentAnswer={answers[q.id]}
                            />
                        ))}
                    </div>

                    <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-center">
                        <button
                          type="button"
                          onClick={prevStep}
                          disabled={visibleStepIndex === 0}
                          className="px-6 py-2 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                        >
                          Назад
                        </button>
                        
                        {visibleStepIndex === visibleSteps.length - 1 ? (
                          <button
                            type="submit"
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
    </div>
  );
};

export default BriefForm;