// frontend/src/api/client.js

// Адрес вашего API. Убедитесь, что бэкенд-сервер запущен.
// FastAPI по умолчанию работает на порту 8000.
const API_URL = "http://localhost:8001";

/**
 * Получает список всех брифов с сервера.
 * @returns {Promise<Array>} Массив объектов брифов.
 */
export const getAllBriefs = async () => {
  try {
    const response = await fetch(`${API_URL}/briefs/`); //

    // Если ответ не успешный (например, 404 или 500), выбрасываем ошибку.
    if (!response.ok) {
      throw new Error(`Ошибка сети: ${response.statusText}`);
    }

    const briefs = await response.json();
    return briefs;
  } catch (error) {
    console.error("Не удалось получить брифы:", error);
    // В реальном приложении здесь можно было бы показать ошибку пользователю.
    // Пока просто вернем пустой массив.
    return [];
  }
};

/**
 * Получает данные одного брифа по его ID.
 * @param {number} briefId - ID брифа.
 * @returns {Promise<Object>} Объект брифа с вопросами.
 */
export const getBriefById = async (briefId) => {
  try {
    const response = await fetch(`${API_URL}/briefs/${briefId}`); //
    if (!response.ok) {
      throw new Error(`Ошибка сети: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Не удалось получить бриф с ID ${briefId}:`, error);
    return null; // Возвращаем null в случае ошибки
  }
};

/**
 * Отправляет ответы пользователя на сервер.
 * @param {Object} submissionData - Данные для отправки.
 * @param {number} submissionData.brief_id - ID брифа.
 * @param {string} submissionData.session_id - Уникальный ID сессии.
 * @param {Object} submissionData.answers_data - Объект с ответами.
 * @returns {Promise<Object>} Ответ сервера.
 */
export const submitAnswers = async (submissionData) => {
  try {
    const response = await fetch(`${API_URL}/submit_answers/`, { //
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submissionData),
    });

    if (!response.ok) {
      // Попробуем получить текст ошибки с бэкенда
      const errorData = await response.json();
      throw new Error(errorData.detail || `Ошибка сервера: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка при отправке ответов:", error);
    throw error; // Пробрасываем ошибку дальше, чтобы обработать в компоненте
  }
};

/**
 * Удаляет бриф по его ID.
 * @param {number} briefId - ID брифа для удаления.
 * @returns {Promise<boolean>} Возвращает true в случае успеха.
 */
export const deleteBriefById = async (briefId) => {
  try {
    const response = await fetch(`${API_URL}/briefs/${briefId}`, {
      method: 'DELETE',
    });

    if (response.ok || response.status === 204) {
      return true;
    } else {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Ошибка сервера: ${response.status}`);
    }
  } catch (error) {
    console.error(`Не удалось удалить бриф с ID ${briefId}:`, error);
    throw error;
  }
};

/**
 * Обновляет данные брифа (заголовок и описание).
 * @param {number} briefId - ID брифа для обновления.
 * @param {{ title: string, description: string }} briefData - Объект с новыми данными.
 * @returns {Promise<Object>} Возвращает обновленный объект брифа.
 */
export const updateBrief = async (briefId, briefData) => {
  try {
    const response = await fetch(`${API_URL}/briefs/${briefId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(briefData),
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Ошибка сервера: ${response.status}`);
    }
  } catch (error) {
    console.error(`Не удалось обновить бриф с ID ${briefId}:`, error);
    throw error;
  }
};

/**
 * Загружает один файл на сервер.
 * @param {File} file - Файл, полученный из input'а.
 * @returns {Promise<Object>} Ответ сервера с путем к файлу.
 */
export const uploadFile = async (file) => {
  // FormData - это специальный объект для отправки файлов
  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      body: formData,
      // ВАЖНО: не устанавливайте 'Content-Type' вручную!
      // Браузер сделает это сам, включая необходимые границы (boundary).
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => ({ detail: 'Не удалось прочитать ошибку сервера.' }));
      throw new Error(errorData.detail);
    }
  } catch (error) {
    console.error('Ошибка при загрузке файла:', error);
    throw error;
  }
};

/**
 * Создает новый бриф.
 * @param {object} briefData - Данные брифа, соответствующие схеме BriefCreate.
 * @returns {Promise<object>} Ответ сервера.
 */
export const createBrief = async (briefData) => {
  try {
    const response = await fetch(`${API_URL}/briefs/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(briefData),
    });

    if (response.ok) {
      return await response.json();
    } else {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.detail || `Ошибка сервера: ${response.status}`);
    }
  } catch (error) {
    console.error('Не удалось создать бриф:', error);
    throw error;
  }
};

/**
 * Получает все ответы для конкретного брифа.
 * @param {number} briefId - ID брифа.
 * @returns {Promise<Array>} Массив объектов с ответами.
 */
export const getAnswersForBrief = async (briefId) => {
  try {
    const response = await fetch(`${API_URL}/answers/${briefId}`);
    if (!response.ok) {
      throw new Error(`Ошибка сети: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Не удалось получить ответы для брифа ${briefId}:`, error);
    return []; // Возвращаем пустой массив в случае ошибки
  }
};