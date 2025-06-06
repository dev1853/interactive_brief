// frontend/src/components/BriefList.jsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllBriefs, deleteBriefById } from '../api/client';
import { FileText, Trash2, Edit, PlusCircle, BarChart2 } from 'lucide-react';

const BriefList = () => {
  const [briefs, setBriefs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBriefs = async () => {
      setIsLoading(true);
      try {
        const briefsData = await getAllBriefs();
        setBriefs(briefsData);
      } catch (error) {
        alert(`Не удалось загрузить брифы: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
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

  if (briefs.length === 0) {
    return (
      <div className="text-center p-10">
        <p className="text-slate-500 text-lg mb-4">Брифов пока нет. Создайте первый!</p>
        <Link 
          to="/create-brief" 
          className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <PlusCircle size={20} />
          Создать новый бриф
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-slate-900">Мои брифы</h1>
        <Link 
          to="/create-brief" 
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <PlusCircle size={20} />
          Создать бриф
        </Link>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <ul className="divide-y divide-slate-200">
          {briefs.map(brief => (
            <li key={brief.id} className="py-4 flex items-center gap-4">
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
                <button onClick={() => handleDelete(brief.id, brief.title)} title="Удалить" className="p-2 text-slate-500 hover:text-red-600 transition-colors rounded-md hover:bg-red-100">
                  <Trash2 size={20} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BriefList;