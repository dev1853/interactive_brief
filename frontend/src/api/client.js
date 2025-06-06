// frontend/src/api/client.js

// --- КОНФИГУРАЦИЯ API ---
const API_BASE_URL = "http://localhost:8001"; // Убедитесь, что эта строка присутствует

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

// --- ЭНДПОИНТЫ БРИФОВ ---

export const getAllBriefs = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/briefs/`);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const getBriefById = async (briefId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/briefs/${briefId}`);
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const createBrief = async (briefData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/briefs/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(briefData),
        });
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const updateBrief = async (briefId, briefData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/briefs/${briefId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(briefData),
        });
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};

export const deleteBriefById = async (briefId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/briefs/${briefId}`, {
            method: 'DELETE',
        });
        if (!response.ok) {
            let errorDetails = {};
            try {
                errorDetails = await response.json();
            } catch (jsonError) {
                errorDetails = { detail: await response.text() };
            }
            console.error('API Error Response (подробно):', errorDetails);
            throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
        return null;
    } catch (error) {
        handleError(error);
    }
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

// --- ФУНКЦИЯ ДЛЯ ЗАГРУЗКИ ФАЙЛОВ ---
export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${API_BASE_URL}/upload`, {
            method: 'POST',
            body: formData,
        });
        return handleResponse(response);
    } catch (error) {
        handleError(error);
    }
};