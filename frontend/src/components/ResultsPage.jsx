// frontend/src/components/ResultsPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSubmissionsForBrief } from '../api/client';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

const ResultsPage = () => {
  const { briefId } = useParams();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await getSubmissionsForBrief(briefId);
        setSubmissions(response.data);
      } catch (err) {
        setError('Не удалось загрузить ответы.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [briefId]);

  if (loading) return <div className="text-center p-8">Загрузка ответов...</div>;
  if (error) return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Ответы на бриф</h1>
      {submissions.length === 0 ? (
        <p className="text-gray-500">Пока нет ни одного ответа на этот бриф.</p>
      ) : (
        <div className="mt-8 flow-root">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      ID Ответа (Сессия)
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Дата отправки
                    </th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                      <span className="sr-only">Просмотр</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {submissions.map((submission) => (
                    <tr key={submission.session_id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-mono text-gray-500 sm:pl-0">
                        {submission.session_id.split('-')[0]}...
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {new Date(submission.created_at).toLocaleString()}
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                        <Link to={`/admin/submissions/${submission.session_id}`} className="text-indigo-600 hover:text-indigo-900">
                          Просмотр<span className="sr-only">, {submission.session_id}</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsPage;