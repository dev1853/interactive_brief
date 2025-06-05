// frontend/src/components/BriefList.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBriefs, deleteBriefById } from '../api/client';
import { FileText, Trash2, Edit, PlusCircle, BarChart2 } from 'lucide-react';

const BriefList = () => {
  // ... (логика компонента остается без изменений) ...
  const [briefs, setBriefs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBriefs = async () => {
      setIsLoading(true);
      const briefsData = await getAllBriefs();
      setBriefs(briefsData);
      setIsLoading(false);
    };
    fetchBriefs();
  }, []);

  const handleDelete = async (briefId, briefTitle) => {
    if (window.confirm(`Вы уверены, что хотите удалить бриф "${briefTitle}"? Это действие необратимо.`)) {
      try {
        await deleteBriefById(briefId);
        setBriefs(currentBriefs => currentBriefs.filter(b => b.id !== briefId));
      } catch (error) {
        alert(`Не удалось удалить бриф: ${error.message}`);
      }
    }
  };

  if (isLoading) {
    return (
        <div className="text-center p-10">
            <p className="text-slate-500 text-lg">Загрузка брифов...</p>
        </div>
    );
  }


  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Доступные брифы</h1>
        <Link 
            to="/create-brief"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-all"
        >
            <PlusCircle size={20} />
            Создать бриф
        </Link>
      </div>

      {briefs.length === 0 ? (
        <div className="text-center p-10 border-2 border-dashed border-slate-300 rounded-lg">
            <p className="text-slate-500 text-lg">Брифы не найдены.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {briefs.map((brief) => (
            <div
              key={brief.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex items-start gap-6"
            >
              <div className="flex-shrink-0 h-12 w-12 bg-slate-50 rounded-lg flex items-center justify-center">
                <FileText className="text-indigo-600" size={24} />
              </div>
              <div className="flex-grow">
                <h2 className="text-xl font-semibold text-slate-900">{brief.title}</h2>
                <p className="text-slate-600 mt-1">{brief.description}</p>
                <Link to={`/brief/${brief.id}`} className="text-indigo-600 font-semibold mt-4 inline-block hover:underline">
                  Заполнить бриф →
                </Link>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                <Link to={`/briefs/${brief.id}/results`} title="Посмотреть результаты" className="p-2 text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-slate-100">
                    <BarChart2 size={20} />
                </Link>
                <Link to={`/briefs/${brief.id}/edit`} title="Редактировать" className="p-2 text-slate-500 hover:text-indigo-600 transition-colors rounded-md hover:bg-slate-100">
                <Edit size={20} />
                </Link>
                <button onClick={() => handleDelete(brief.id, brief.title)} title="Удалить" className="p-2 text-slate-500 hover:text-red-600 transition-colors rounded-md hover:bg-red-50">
                <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BriefList;