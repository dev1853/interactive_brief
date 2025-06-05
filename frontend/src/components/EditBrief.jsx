// frontend/src/components/EditBrief.jsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBriefById, updateBrief } from '../api/client';
import QuestionEditor from './questions/QuestionEditor'; // Убедитесь, что этот компонент существует
import StepEditor from './builder/StepEditor'; // И этот тоже
import { PlusCircle } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

const EditBrief = () => {
  const { briefId } = useParams();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([]); // Работаем с шагами, а не с вопросами
  const [isLoading, setIsLoading] = useState(true);

  // === ИЗМЕНЕНИЯ ЗДЕСЬ: Логика загрузки и обработки данных ===
  useEffect(() => {
    const fetchBriefData = async () => {
      try {
        const data = await getBriefById(briefId);
        if (data) {
          setTitle(data.title);
          setDescription(data.description || '');
          
          // Преобразуем данные с бэкенда в структуру, удобную для фронтенда
          const formattedSteps = data.steps.map(step => ({
            id: `step_${step.id}`, // Уникальный ID для dnd-kit
            title: step.title,
            questions: step.questions.map(q => ({
              ...q,
              id: q.id, // Используем реальный ID из БД
              // Преобразуем options из массива в строку для <textarea>
              options: Array.isArray(q.options) ? q.options.join('\n') : '',
            })),
          }));
          setSteps(formattedSteps);
        }
      } catch (error) {
        console.error("Ошибка загрузки брифа для редактирования:", error);
        alert("Не удалось загрузить бриф.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchBriefData();
  }, [briefId]);

  // --- Вся остальная логика управления состоянием идентична BriefBuilder.jsx ---
  const addStep = () => {
    const newStep = { id: `step_${Date.now()}`, title: `Шаг ${steps.length + 1}`, questions: [] };
    setSteps(prev => [...prev, newStep]);
  };

  const updateStep = (stepId, updatedStep) => {
    setSteps(prev => prev.map(s => (s.id === stepId ? updatedStep : s)));
  };

  const deleteStep = (stepId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот шаг со всеми вопросами?')) {
      setSteps(prev => prev.filter(s => s.id !== stepId));
    }
  };

  const addQuestionToStep = (stepId) => {
    const newQuestion = { id: `q_${Date.now()}`, text: '', question_type: 'text', is_required: false, options: '' };
    setSteps(prev => prev.map(s => {
      if (s.id === stepId) { return { ...s, questions: [...s.questions, newQuestion] }; }
      return s;
    }));
  };

  const updateQuestion = (stepId, questionId, updatedQuestion) => {
    setSteps(prev => prev.map(s => {
      if (s.id === stepId) { return { ...s, questions: s.questions.map(q => q.id === questionId ? updatedQuestion : q) }; }
      return s;
    }));
  };

  const deleteQuestion = (stepId, questionId) => {
    setSteps(prev => prev.map(s => {
      if (s.id === stepId) { return { ...s, questions: s.questions.filter(q => q.id !== questionId) }; }
      return s;
    }));
  };
  
  const handleDragEnd = (event) => {
    // ... (код drag-n-drop без изменений, как в BriefBuilder.jsx)
  };

  const handleUpdateBrief = async () => {
    if (!title.trim()) { return alert('Пожалуйста, введите название брифа.'); }
    const briefData = {
      title,
      description,
      steps: steps.map((step, stepIndex) => ({
        title: step.title,
        order: stepIndex + 1,
        questions: step.questions.map((q, qIndex) => ({
          text: q.text, question_type: q.question_type, is_required: q.is_required, order: qIndex + 1,
          options: typeof q.options === 'string' ? q.options.split('\n').filter(opt => opt.trim() !== '') : [],
        })),
      })),
    };
    try {
      await updateBrief(briefId, briefData);
      alert('Бриф успешно обновлен!');
      navigate('/');
    } catch (error) {
      alert(`Ошибка при сохранении: ${error.message}`);
    }
  };

  if (isLoading) return <div className="text-center p-10 text-slate-500">Загрузка конструктора...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-slate-900">Редактирование брифа</h1>
        <button onClick={handleUpdateBrief} className="px-6 py-3 rounded-lg text-white font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm">
          Сохранить изменения
        </button>
      </div>
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label htmlFor="brief-title" className="block text-lg font-semibold text-slate-800 mb-2">Название брифа</label>
          <input id="brief-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"/>
        </div>
        <div>
          <label htmlFor="brief-description" className="block text-lg font-semibold text-slate-800 mb-2">Описание брифа</label>
          <textarea id="brief-description" value={description} onChange={(e) => setDescription(e.target.value)} rows="3" className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"/>
        </div>
      </div>
      <div>
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Шаги</h2>
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="space-y-6">
            <SortableContext items={steps} strategy={verticalListSortingStrategy}>
              {steps.map(step => (
                <StepEditor
                  key={step.id}
                  step={step}
                  onUpdateStep={(updatedStep) => updateStep(step.id, { ...step, ...updatedStep })}
                  onDeleteStep={() => deleteStep(step.id)}
                  onAddQuestion={() => addQuestionToStep(step.id)}
                  onUpdateQuestion={updateQuestion}
                  onDeleteQuestion={deleteQuestion}
                />
              ))}
            </SortableContext>
          </div>
        </DndContext>
        <button onClick={addStep} className="mt-6 flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all shadow-sm">
          <PlusCircle size={20} />
          Добавить новый шаг
        </button>
      </div>
    </div>
  );
};

export default EditBrief;