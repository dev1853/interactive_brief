// frontend/src/components/SubmissionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSubmissionById } from '../api/client';
import { ArrowLeftIcon, PaperClipIcon } from '@heroicons/react/24/solid';

const SubmissionDetail = () => {
  const { id: sessionId } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getSubmissionById(sessionId);
        setSubmission(response.data);
      } catch (err) {
        setError('Не удалось загрузить данные ответа.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmission();
  }, [sessionId]);

  const renderAnswer = (value) => {
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, index) => (
            <li key={index}>
              {item && item.url ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-indigo-600 hover:text-indigo-800">
                  <PaperClipIcon className="h-4 w-4 mr-1"/> {item.name || 'файл'}
                </a>
              ) : (
                String(item)
              )}
            </li>
          ))}
        </ul>
      );
    }
    return <p className="mt-1 text-md text-gray-900 sm:col-span-2 sm:mt-0 whitespace-pre-wrap">{String(value)}</p>;
  };
  
  if (loading) return <div className="text-center p-8">Загрузка деталей ответа...</div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;
  
  if (!submission || !submission.brief) {
    return <div className="p-8 text-center text-gray-500">Данные для этого ответа неполные или отсутствуют.</div>;
  }

  // Создаем словарь вопросов для быстрого доступа
  const questionsMap = (submission.brief.steps || []).flatMap(step => step.questions).reduce((acc, q) => {
    acc[q.id] = q.text;
    return acc;
  }, {});
  
  // Проверяем, есть ли вообще ответы
  const hasAnswers = submission.answers_data && Object.keys(submission.answers_data).length > 0;

  return (
    <div>
      <Link to={`/admin/results/${submission.brief_id}`} className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeftIcon className="h-4 w-4" />
        Назад к списку ответов
      </Link>
      
      <div className="overflow-hidden bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-semibold leading-6 text-gray-900">Ответы на бриф "{submission.brief.title}"</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">ID сессии: {submission.session_id}</p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            {/* --- ИСПРАВЛЕНИЕ ЗДЕСЬ --- */}
            {hasAnswers ? (
              Object.entries(submission.answers_data).map(([questionId, answer], index) => (
                <div key={questionId} className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}>
                  <dt className="text-sm font-medium text-gray-500">{questionsMap[questionId] || `Вопрос ID: ${questionId}`}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{renderAnswer(answer)}</dd>
                </div>
              ))
            ) : (
              <div className="px-4 py-5 text-sm text-gray-500 sm:px-6">
                Пользователь не предоставил ни одного ответа.
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
};

export default SubmissionDetail;