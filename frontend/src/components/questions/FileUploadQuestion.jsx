// frontend/src/components/questions/FileUploadQuestion.jsx

import React, { useState } from 'react';
import { uploadFile } from '../../api/client';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

const FileUploadQuestion = ({ question, onAnswerChange, currentAnswer }) => {
  const { id } = question;
  // Состояние для хранения списка загруженных файлов (объектов {name, path})
  const [uploadedFiles, setUploadedFiles] = useState(currentAnswer || []);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const uploadPromises = files.map(file => uploadFile(file));

    try {
      const results = await Promise.all(uploadPromises);
      const newFiles = results.map((result, index) => ({
        name: files[index].name,
        path: result.file_path,
      }));
      
      const updatedFiles = [...uploadedFiles, ...newFiles];
      setUploadedFiles(updatedFiles);
      // Обновляем главный стейт формы
      onAnswerChange(id, updatedFiles);

    } catch (err) {
      setError(err.message || 'Произошла ошибка при загрузке одного или нескольких файлов.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-center w-full">
        <label htmlFor={`file-upload-${id}`} className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadCloud className="w-8 h-8 mb-2 text-slate-500" />
            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Нажмите для загрузки</span> или перетащите</p>
            <p className="text-xs text-slate-500">PNG, JPG, PDF или ZIP (макс. размер не ограничен)</p>
          </div>
          <input id={`file-upload-${id}`} type="file" className="hidden" multiple onChange={handleFileSelect} />
        </label>
      </div>

      {isUploading && <p className="mt-2 text-sm text-indigo-600">Загрузка...</p>}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {/* Список загруженных файлов */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="font-medium text-slate-800">Загруженные файлы:</p>
          <ul className="border border-slate-200 rounded-md divide-y divide-slate-200">
            {uploadedFiles.map((file, index) => (
              <li key={index} className="pl-3 pr-4 py-3 flex items-center justify-between text-sm">
                <div className="w-0 flex-1 flex items-center">
                  <FileIcon className="flex-shrink-0 h-5 w-5 text-slate-400" aria-hidden="true" />
                  <span className="ml-2 flex-1 w-0 truncate">{file.name}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUploadQuestion;