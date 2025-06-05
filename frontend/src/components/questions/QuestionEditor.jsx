// frontend/src/components/questions/QuestionEditor.jsx

import React from 'react';
import { Trash2, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const QuestionEditor = ({ question, onUpdate, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({id: question.id});
  const style = { transform: CSS.Transform.toString(transform), transition };
  
  const questionTypes = [
    { value: 'text', label: 'Текст' },
    { value: 'number', label: 'Число' },
    { value: 'single_choice', label: 'Одиночный выбор' },
    { value: 'multi_choice', label: 'Множественный выбор' },
    { value: 'date', label: 'Дата' },
    { value: 'linear_scale', label: 'Линейная шкала' },
    { value: 'file', label: 'Загрузка файла' },
  ];

  const showOptions = ['single_choice', 'multi_choice', 'linear_scale'].includes(question.question_type);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    onUpdate({
      ...question,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-4">
      <div className="flex-shrink-0 pt-8 cursor-grab active:cursor-grabbing" {...listeners} {...attributes}>
        <GripVertical className="h-6 w-6 text-slate-400" />
      </div>

      <div className="w-full bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-indigo-600">Параметры вопроса</h3>
            <button
                onClick={onDelete}
                type="button"
                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                title="Удалить вопрос"
            >
                <Trash2 size={20} />
            </button>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Текст вопроса</label>
          <input
            type="text"
            name="text"
            value={question.text}
            onChange={handleInputChange}
            className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="Введите текст вопроса"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">Тип вопроса</label>
                <select name="question_type" value={question.question_type} onChange={handleInputChange} className="mt-1 w-full px-3 py-2 bg-white border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                    {questionTypes.map(q_type => (
                        <option key={q_type.value} value={q_type.value}>{q_type.label}</option>
                    ))}
                </select>
            </div>
            <div className="flex items-end pb-1">
                <div className="flex items-center gap-2">
                    <input id={`is_required_${question.id}`} name="is_required" type="checkbox" checked={question.is_required} onChange={handleInputChange} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor={`is_required_${question.id}`} className="font-medium text-slate-700 cursor-pointer">Обязательный вопрос</label>
                </div>
            </div>
        </div>
        {showOptions && (
            <div>
                <label className="block text-sm font-medium text-slate-700">Варианты ответа (каждый с новой строки)</label>
                <textarea name="options" value={question.options} onChange={handleInputChange} rows="4" className="mt-1 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder={"Вариант 1\nВариант 2\nВариант 3"} />
            </div>
        )}
      </div>
    </div>
  );
};

export default QuestionEditor;