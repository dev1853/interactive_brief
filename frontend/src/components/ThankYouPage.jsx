// frontend/src/components/ThankYouPage.jsx

import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Download, Home } from 'lucide-react';

const ThankYouPage = () => {
  const location = useLocation();
  const sessionId = location.state?.sessionId;
  const API_URL = "http://localhost:8001"; // Убедитесь, что порт верный

  return (
    <div className="w-full max-w-2xl mx-auto text-center py-16">
      <h1 className="text-4xl font-bold text-slate-900">Спасибо!</h1>
      <p className="mt-4 text-lg text-slate-600">Ваши ответы успешно отправлены. Вы можете скачать копию ваших ответов в формате PDF.</p>
      
      {sessionId ? (
        <a
          href={`${API_URL}/submission/${sessionId}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Download size={20} />
          Скачать PDF
        </a>
      ) : (
        <p className="mt-4 text-sm text-red-500">Не удалось получить ID сессии для скачивания PDF.</p>
      )}

      <div className="mt-12">
        <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all shadow-sm">
          <Home size={20} />
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
};

export default ThankYouPage;