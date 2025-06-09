// frontend/src/components/BriefList.jsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';import { PlusIcon, PencilIcon, TrashIcon, StarIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import client from '../api/client'; // Предполагаем, что client.js экспортирует по умолчанию

const BriefList = () => {
  const [briefs, setBriefs] = useState([]);

  const fetchBriefs = async () => {
    try {
      const response = await client.get('/briefs/');
      setBriefs(response.data);
    } catch (error) {
      console.error("Не удалось загрузить брифы:", error);
    }
  };

  useEffect(() => {
    fetchBriefs();
  }, []);

  const handleSetMain = async (briefId) => {
    try {
      await client.put(`/briefs/${briefId}/set-main`);
      fetchBriefs();
    } catch (error) {
      console.error("Не удалось назначить бриф главным:", error);
    }
  };
  
  const handleDelete = async (briefId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот бриф?')) {
      try {
        await client.delete(`/briefs/${briefId}`);
        fetchBriefs();
      } catch (error) {
        console.error("Не удалось удалить бриф:", error);
      }
    }
  };

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Мои Брифы</h1>
          <p className="mt-2 text-sm text-gray-700">Список всех созданных вами брифов.</p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <Link
            to="/admin/builder"
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Создать бриф
          </Link>
        </div>
      </div>
      
      <div className="mt-8 flow-root">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <ul role="list" className="divide-y divide-gray-200">
              {briefs.map((brief) => (
                <li key={brief.id} className="flex items-center justify-between gap-x-6 py-5 px-4 bg-white shadow-sm rounded-md mb-2">
                  <div className="min-w-0">
                    <div className="flex items-start gap-x-3">
                      <p className="text-lg font-semibold leading-6 text-gray-900">{brief.title}</p>
                      {brief.is_main && (
                         <p className="rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset text-green-700 bg-green-50 ring-green-600/20">
                           Главный
                         </p>
                      )}
                    </div>
                     <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                        <p className="whitespace-nowrap">Создан: {new Date(brief.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-none items-center gap-x-4">
                    {!brief.is_main && (
                      <button onClick={() => handleSetMain(brief.id)} className="rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                        Сделать главным
                      </button>
                    )}
                    <Link to={`/admin/results/${brief.id}`} className="p-2 text-gray-500 hover:text-indigo-600">
                      <ChartBarIcon className="h-5 w-5"/>
                    </Link>
                    <Link to={`/admin/edit/${brief.id}`} className="p-2 text-gray-500 hover:text-indigo-600">
                      <PencilIcon className="h-5 w-5"/>
                    </Link>
                     <button onClick={() => handleDelete(brief.id)} className="p-2 text-gray-500 hover:text-red-600">
                        <TrashIcon className="h-5 w-5"/>
                     </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BriefList;