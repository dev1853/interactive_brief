// frontend/src/components/ResultsPage.jsx

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getBriefById, getAnswersForBrief } from '../api/client';
import SubmissionDetail from './SubmissionDetail';

const ResultsPage = () => {
  const { briefId } = useParams();
  const [brief, setBrief] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [briefData, answersData] = await Promise.all([
          getBriefById(briefId),
          getAnswersForBrief(briefId)
        ]);
        
        setBrief(briefData);
        setSubmissions(answersData);

        if (answersData && answersData.length > 0) {
          setSelectedSubmission(answersData[0]);
        }
      } catch (err) {
        setError("Не удалось загрузить данные. Пожалуйста, попробуйте снова.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [briefId]);

  if (isLoading) return <div className="text-center p-10 text-slate-500">Загрузка результатов...</div>;
  if (error) return <div className="text-center p-10 text-red-500">{error}</div>;
  if (!brief) return <div className="text-center p-10 text-slate-500">Бриф не найден.</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">Результаты по брифу:</h1>
        <p className="text-xl text-slate-600">{brief.title}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 items-start">
        {/* Левая колонка: список сессий */}
        <aside className="md:col-span-1 lg:col-span-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-lg px-2 pb-2 border-b border-slate-200">
            Сессии ({submissions.length})
          </h3>
          {submissions.length > 0 ? (
            <ul className="mt-2 space-y-1 max-h-[60vh] overflow-y-auto">
              {submissions.map(sub => (
                <li key={sub.id}>
                  <button
                    onClick={() => setSelectedSubmission(sub)}
                    className={`w-full text-left p-2 rounded-md transition-colors text-sm ${
                      selectedSubmission?.id === sub.id
                        ? 'bg-indigo-100 text-indigo-700 font-semibold'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <span className="block">ID: ...{sub.session_id.slice(-12)}</span>
                    <span className="block text-slate-500 text-xs">
                      {new Date(sub.submitted_at).toLocaleString('ru-RU')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500 p-2 mt-2">Ответов пока нет.</p>
          )}
        </aside>

        {/* Правая колонка: детали выбранной сессии */}
        <main className="md:col-span-2 lg:col-span-3">
          <SubmissionDetail brief={brief} submission={selectedSubmission} />
        </main>
      </div>
    </div>
  );
};

export default ResultsPage;