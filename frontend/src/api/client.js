// frontend/src/api/client.js
import axios from 'axios';

const client = axios.create({
  // Теперь все запросы будут идти на тот же домен, 
  // но с префиксом /api, который перехватит Nginx
  baseURL: '/api',
});

// Перехватчик для автоматического добавления токена авторизации
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
const handleResponse = async (response) => {
    if (!response.ok) {
        let errorDetails = {};
        try {
            errorDetails = await response.json();
        } catch (jsonError) {
            errorDetails = { detail: await response.text() };
        }
        
        console.error('API Error Response (подробно):', errorDetails);

        let errorMessage = `Ошибка ${response.status}: ${response.statusText}`;
        
        if (errorDetails.detail) {
            errorMessage += '\nДетали: ';
            if (Array.isArray(errorDetails.detail)) {
                errorMessage += errorDetails.detail.map(err => {
                    const loc = err.loc ? err.loc.join('.') : 'unknown';
                    return `Поле: ${loc} - ${err.msg}`;
                }).join('; ');
            } else if (typeof errorDetails.detail === 'string') {
                errorMessage += errorDetails.detail;
            }
        } else {
            errorMessage += `\nДополнительная информация: ${JSON.stringify(errorDetails)}`;
        }

        throw new Error(errorMessage);
    }
    return response.json();
};

const handleError = (error) => {
    console.error('Ошибка API:', error);
    throw error;
};

// --- Функции для удобной работы с API ---

export const loginUser = (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);
  return client.post('/token', formData);
};

export const registerUser = (userData) => {
  return client.post('/users', userData);
};

export const getMainBrief = () => {
  return client.get('/main-brief');
};

export const getAllBriefs = () => {
  return client.get('/briefs/');
};

export const getBriefById = (id) => {
  return client.get(`/briefs/${id}`);
};

export const createBrief = (briefData) => {
  return client.post('/briefs', briefData); // Исправлено: был некорректный вызов
};

export const updateBrief = (id, briefData) => {
  return client.put(`/briefs/${id}`, briefData);
};

export const deleteBrief = (id) => {
  return client.delete(`/briefs/${id}`);
};

export const setMainBrief = (id) => {
  return client.put(`/briefs/${id}/set-main`);
};

export const createSubmission = (submissionData) => {
  // Обратите внимание, что эндпоинт на бэкенде может быть /submissions/ или /briefs/submissions/
  // Убедитесь, что он совпадает с тем, что в routers/briefs.py
  return client.post('/briefs/submissions', submissionData); 
};

// --- ЭНДПОИНТЫ ОТВЕТОВ ПОЛЬЗОВАТЕЛЕЙ ---

export const submitAnswers = async (answersData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/submit_answers/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(answersData),
        });
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const getAnswersForBrief = async (briefId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/answers/${briefId}`);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const getSubmissionsForBrief = (briefId) => {
  return client.get(`/briefs/${briefId}/submissions`);
};

export const getSubmissionById = (sessionId) => {
  return client.get(`/briefs/submission/${sessionId}`);
};

// --- ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ ФАЙЛОВ ---
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  // Используем наш настроенный client и правильный эндпоинт
  // Убедитесь, что на бэкенде в routers/briefs.py есть эндпоинт /uploadfile
  return client.post('/briefs/uploadfile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};


export default client;
