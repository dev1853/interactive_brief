// frontend/src/components/BriefForm.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBriefById, submitAnswers } from '../api/client';
import { v4 as uuidv4 } from 'uuid';
import Question from './Question';
import ProgressBar from './ProgressBar';

const checkCondition = (condition, answers) => {
  if (!condition || !condition.show_if) {
    console.log('checkCondition: Условия нет или нет show_if, шаг/вопрос видим по умолчанию.');
    return true; // Если нет условий, шаг/вопрос всегда видим
  }
  const { question_id, operator, value } = condition.show_if;
  const targetAnswer = answers[question_id]; // Важно: question_id должен быть числовым ID

  console.log(`checkCondition: Проверка условия для вопроса ID: ${question_id}, Оператор: ${operator}, Значение: ${value}, Текущий ответ: ${targetAnswer}`);

  if (targetAnswer === undefined || targetAnswer === null || targetAnswer === '') {
    console.log('checkCondition: Целевой ответ отсутствует или пуст, условие не выполнено.');
    return false; // Если нет ответа на вопрос-зависимость, условие не выполнено
  }

  switch (operator) {
    case 'equals': 
        console.log(`checkCondition: Сравнение "equals": ${targetAnswer} === ${value} -> ${targetAnswer === value}`);
        return targetAnswer === value;
    case 'not_equals': 
        console.log(`checkCondition: Сравнение "not_equals": ${targetAnswer} !== ${value} -> ${targetAnswer !== value}`);
        return targetAnswer !== value;
    case 'contains': 
        // Для 'contains' ожидаем, что targetAnswer - это массив (например, для multi_choice)
        // Также убедимся, что value является строкой для includes
        console.log(`checkCondition: Сравнение "contains": ${Array.isArray(targetAnswer) && targetAnswer.includes(String(value))}`);
        return Array.isArray(targetAnswer) && targetAnswer.includes(String(value));
    case 'not_contains':
        console.log(`checkCondition: Сравнение "not_contains": ${Array.isArray(targetAnswer) && !targetAnswer.includes(String(value))}`);
        return Array.isArray(targetAnswer) && !targetAnswer.includes(String(value));
    // Добавьте другие операторы (greater_than, less_than и т.д.)
    case 'greater_than':
        console.log(`checkCondition: Сравнение "greater_than": ${Number(targetAnswer)} > ${Number(value)} -> ${Number(targetAnswer) > Number(value)}`);
        return Number(targetAnswer) > Number(value);
    case 'less_than':
        console.log(`checkCondition: Сравнение "less_than": ${Number(targetAnswer)} < ${Number(value)} -> ${Number(targetAnswer) < Number(value)}`);
        return Number(targetAnswer) < Number(value);
    default: 
        console.warn(`checkCondition: Неизвестный оператор условия: ${operator}`);
        return false;
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
        console.log('BriefForm: Загруженный бриф (полностью):', data); // ОТЛАДКА
      } catch (e) {
        setError("Ошибка загрузки брифа: " + e.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBriefData();
  }, [briefId]);

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => {
        const newAnswers = { ...prev, [questionId]: value };
        console.log('BriefForm: Обновленные ответы:', newAnswers); // ОТЛАДКА
        return newAnswers;
    });
  };

  const visibleSteps = useMemo(() => {
    if (!brief || !brief.steps) return [];
    
    console.log('BriefForm: Вход в useMemo visibleSteps');
    console.log('BriefForm: Все шаги из брифа:', brief.steps);
    console.log('BriefForm: Текущие ответы в useMemo:', answers);

    const filteredSteps = brief.steps
      .filter(step => {
        // Логика условного отображения для шага
        const isVisible = checkCondition(step.conditional_logic, answers);
        console.log(`BriefForm: Шаг "${step.title}" (ID: ${step.id})`, 'Условие:', step.conditional_logic, 'Видим:', isVisible);
        return isVisible;
      })
      .sort((a, b) => a.order - b.order);

    console.log('BriefForm: Видимые шаги после фильтрации (сортировки):', filteredSteps);
    
    // Сброс currentStepIndex, если текущий шаг стал невидимым
    // Это предотвращает зависание формы на невидимом шаге
    // Добавим проверку, если currentStepIndex выходит за границы или текущий шаг изменился
    if (filteredSteps.length > 0 && (currentStepIndex >= filteredSteps.length || !filteredSteps[currentStepIndex] || filteredSteps[currentStepIndex].id !== brief.steps[currentStepIndex]?.id)) {
        // Попытаться сохранить текущий шаг, если он все еще видим
        const currentStepRealId = brief.steps[currentStepIndex]?.id;
        const newCurrentStepIndex = filteredSteps.findIndex(s => s.id === currentStepRealId);
        if (newCurrentStepIndex !== -1) {
            setCurrentStepIndex(newCurrentStepIndex);
        } else {
            setCurrentStepIndex(0); // Иначе переходим на первый видимый шаг
        }
    } else if (filteredSteps.length === 0) {
        setCurrentStepIndex(0); // Если нет видимых шагов, сбрасываем индекс
    }

    return filteredSteps;
  }, [brief, answers]); // Зависимость от brief и answers

  const currentStep = visibleSteps[currentStepIndex];

  const visibleQuestionsForCurrentStep = useMemo(() => {
    if (!currentStep) return [];
    console.log('BriefForm: Вход в useMemo visibleQuestionsForCurrentStep для шага:', currentStep.title);
    return currentStep.questions.filter(q => {
        const isVisible = checkCondition(q.conditional_logic, answers);
        console.log(`BriefForm:   Вопрос "${q.text}" (ID: ${q.id})`, 'Условие:', q.conditional_logic, 'Видим:', isVisible);
        return isVisible;
    });
  }, [currentStep, answers]);
  
  const nextStep = () => {
    // Проверяем, все ли обязательные вопросы на текущем шаге отвечены
    const currentStepQuestions = visibleQuestionsForCurrentStep;
    const allRequiredAnswered = currentStepQuestions.every(q => {
        if (!q.is_required) return true;
        const answer = answers[q.id];
        // Проверяем ответы для разных типов вопросов
        if (q.question_type === 'file' && Array.isArray(answer)) {
            return answer.length > 0; // Для файлов, должен быть хотя бы один файл
        }
        return answer !== undefined && answer !== null && answer !== '';
    });

    if (!allRequiredAnswered) {
        alert('Пожалуйста, ответьте на все обязательные вопросы текущего шага.');
        return;
    }

    if (currentStepIndex < visibleSteps.length - 1) {
      setCurrentStepIndex(i => i + 1);
    } else {
      // Если это последний видимый шаг, и пользователь нажимает "Далее", 
      // это означает, что он хочет отправить форму.
      handleSubmit(new Event('submit')); // Вызываем handleSubmit вручную
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

    // Дополнительная проверка на обязательные вопросы для последнего шага перед отправкой
    const currentStepQuestions = visibleQuestionsForCurrentStep;
    const allRequiredAnswered = currentStepQuestions.every(q => {
        if (!q.is_required) return true;
        const answer = answers[q.id];
        if (q.question_type === 'file' && Array.isArray(answer)) {
            return answer.length > 0;
        }
        return answer !== undefined && answer !== null && answer !== '';
    });

    if (!allRequiredAnswered) {
        alert('Пожалуйста, ответьте на все обязательные вопросы текущего шага, прежде чем отправить бриф.');
        setIsSubmitting(false);
        return;
    }


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
  if (visibleSteps.length === 0) return <div className="text-center p-10 text-slate-500">Нет видимых шагов для отображения.</div>;


  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* ОТЛАДОЧНЫЙ БЛОК */}
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
        <p>ID текущего шага: <strong>{currentStep?.id}</strong></p>
        <p>Conditional Logic текущего шага: <strong>{JSON.stringify(currentStep?.conditional_logic)}</strong></p>
        <p>Answers: <strong>{JSON.stringify(answers)}</strong></p>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-10">
            {/* ... */}
        </div>
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
          {currentStep ? ( // Проверяем наличие currentStep перед рендерингом
            visibleQuestionsForCurrentStep.map(q => (
              <Question
                key={q.id}
                question={q}
                onAnswerChange={handleAnswerChange}
                currentAnswer={answers[q.id]}
              />
            ))
          ) : (
            <div className="text-center p-10 text-slate-500">
                Нет вопросов для отображения на этом шаге или нет видимых шагов.
            </div>
          )}

          <div className="pt-6 border-t border-slate-200 flex justify-between items-center">
            {/* Кнопка НАЗАД */}
            <button
              type="button"
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