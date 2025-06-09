// frontend/src/components/questions/FileUploadQuestion.jsx
import React, { useState } from 'react';
// Импортируем нашу новую функцию
import { uploadFile } from '../../api/client';
import { PaperClipIcon } from '@heroicons/react/24/solid';

const FileUploadQuestion = ({ question, onAnswerChange, currentAnswer }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      const uploadPromises = files.map(file => uploadFile(file));
      const responses = await Promise.all(uploadPromises);

      const uploadedFiles = responses.map(res => ({
        name: res.data.filename, // Убедитесь, что бэкенд возвращает 'filename'
        url: res.data.url,
      }));

      // Обновляем ответ (добавляем к существующим файлам, если нужно)
      onAnswerChange(question.id, [...(currentAnswer || []), ...uploadedFiles]);

    } catch (err) {
      setError('Ошибка при загрузке файла.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="py-4">
      <label className="block text-sm font-medium text-slate-800 mb-2">{question.text}</label>

      <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
        <div className="text-center">
          {/* Иконка и текст */}
          <div className="mt-4 flex text-sm leading-6 text-gray-600">
            <label
              htmlFor={`file-upload-${question.id}`}
              className="relative cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
            >
              <span>Выберите файлы</span>
              <input id={`file-upload-${question.id}`} name="file-upload" type="file" className="sr-only" multiple onChange={handleFileSelect} disabled={uploading} />
            </label>
            <p className="pl-1">или перетащите их сюда</p>
          </div>
          <p className="text-xs leading-5 text-gray-600">PNG, JPG, PDF до 10MB</p>
        </div>
      </div>

      {uploading && <p className="mt-2 text-sm text-blue-600">Загрузка...</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Отображение загруженных файлов */}
      <div className="mt-4">
        {Array.isArray(currentAnswer) && currentAnswer.map((file, index) => (
          <div key={index} className="flex items-center text-sm">
            <PaperClipIcon className="h-5 w-5 flex-shrink-0 text-gray-400" />
            <a href={`http://localhost:8001${file.url}`} target="_blank" rel="noopener noreferrer" className="ml-2 font-medium text-indigo-600 hover:text-indigo-500">
              {file.name}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileUploadQuestion;