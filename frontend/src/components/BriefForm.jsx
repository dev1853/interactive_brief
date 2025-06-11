// frontend/src/components/BriefForm.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBriefById } from '../api/client'; // Предполагаем, что submission здесь не создается
import Question from './Question';
import ProgressBar from './ProgressBar';

const BriefForm = ({ briefId: propBriefId }) => {
  const { id: paramId } = useParams();
  const briefId = propBriefId || paramId;
  const navigate = useNavigate();

  const [brief, setBrief] = useState(null);
  const [answers, setAnswers] = useState({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const handleAnswerChange = useCallback((questionId, value) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  }, []);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Логика отправки ответов (createSubmission) должна быть здесь
    console.log("Отправка ответов:", answers);
    navigate('/thank-you');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-lg">Загрузка брифа...</div>;
  }
  
  if (error) {
    return <div className="flex h-screen items-center justify-center p-8 text-red-600 bg-red-50 rounded-lg">{error}</div>;
  }
  
  if (!brief) {
    return null;
  }

  const currentStep = brief.steps[currentStepIndex];

  return (
    <div className="bg-slate-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
            <div className="bg-white p-6 sm:p-10 rounded-xl border border-slate-200 shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">Заполните бриф</h1>
                    <p className="mt-3 text-base text-slate-600">Название брифа: <span className="font-semibold">{brief.title}</span></p>
                    <p className="mt-1 text-sm text-slate-500">{brief.description}</p>
                </div>
                
                <div className="my-10">
                  <ProgressBar steps={brief.steps} currentStepIndex={currentStepIndex} />
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
                          onClick={() => setCurrentStepIndex(prev => Math.max(prev - 1, 0))}
                          disabled={currentStepIndex === 0}
                          className="px-6 py-2 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-colors"
                        >
                          Назад
                        </button>
                        
                        {currentStepIndex === brief.steps.length - 1 ? (
                          <button
                            type="submit"
                            className="px-8 py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md transition-colors"
                          >
                            Отправить бриф
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setCurrentStepIndex(prev => Math.min(prev + 1, brief.steps.length - 1))}
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