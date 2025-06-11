// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { HomeIcon, PlusIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

// Импорты всех наших компонентов
import { getMainBrief } from './api/client';
import Login from './components/Login';
// import Register from './components/Register';
import BriefList from './components/BriefList';
import BriefForm from './components/BriefForm';
import BriefBuilder from './components/BriefBuilder';
import EditBrief from './components/EditBrief';
import SubmissionDetail from './components/SubmissionDetail';
import ThankYouPage from './components/ThankYouPage';
import ResultsPage from './components/ResultsPage';

// --- Вспомогательные компоненты ---

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const PrivateRoute = ({ children, token }) => {
  return token ? children : <Navigate to="/login" />;
};

// --- Компонент Админ-панели ---
const AdminLayout = ({ setToken }) => {
  const location = useLocation();

  const navigation = [
    { name: 'Мои Брифы', href: '/admin', icon: HomeIcon, current: location.pathname === '/admin' },
    { name: 'Создать Бриф', href: '/admin/builder', icon: PlusIcon, current: location.pathname === '/admin/builder' },
  ];
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Боковая панель */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-gray-800 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
             <h1 className="text-white text-2xl font-semibold">Брифли</h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 pb-4 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={classNames(
                    item.current ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                  )}
                >
                  <item.icon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
                  {item.name}
                </Link>
              ))}
            </nav>
            <div className="px-2 py-4">
               <button
                  onClick={handleLogout}
                  className='text-gray-300 hover:bg-gray-700 hover:text-white group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full'
                >
                  <ArrowLeftOnRectangleIcon className="mr-3 flex-shrink-0 h-6 w-6 text-gray-400 group-hover:text-gray-300" aria-hidden="true" />
                  Выйти
                </button>
            </div>
          </div>
        </div>
      </div>

      {/* Основной контент */}
      <main className="flex-1 md:pl-64">
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <Routes>
              <Route index element={<BriefList />} />
              <Route path="builder" element={<BriefBuilder />} />
              <Route path="edit/:id" element={<EditBrief />} />
              <Route path="results/:briefId" element={<ResultsPage />} />
              <Route path="submissions/:id" element={<SubmissionDetail />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
};

// --- Основной компонент App ---
function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [mainBrief, setMainBrief] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleSetToken = (newToken) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
    }
    setToken(newToken);
  };
  
  useEffect(() => {
    const fetchMainBrief = async () => {
      try {
        const response = await getMainBrief();
        setMainBrief(response.data);
      } catch (error) {
        console.error("Не удалось загрузить главный бриф:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMainBrief();
  }, []);

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Загрузка...</div>;
  }
  
  return (
    <Routes>
      <Route path="/login" element={<Login setToken={handleSetToken} />} />
      {/* <Route path="/register" element={<Register />} /> */}
      <Route path="/thank-you" element={<ThankYouPage />} />
      
      {/* ВОТ ПРАВИЛЬНАЯ ЛОГИКА ДЛЯ ГЛАВНОЙ СТРАНИЦЫ */}
      <Route 
        path="/" 
        element={
          mainBrief 
            ? <BriefForm briefId={mainBrief.id} /> 
            : <div className="flex h-screen items-center justify-center text-gray-500">Главный бриф не найден или не настроен.</div>
        } 
      />
      <Route path="/brief/:id" element={<BriefForm />} />
      
      <Route
        path="/admin/*"
        element={
          <PrivateRoute token={token}>
            <AdminLayout setToken={handleSetToken} />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default App;