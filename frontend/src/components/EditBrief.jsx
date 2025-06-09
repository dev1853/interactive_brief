// frontend/src/components/EditBrief.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StepEditor from './builder/StepEditor';
import { PlusCircle } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { getBriefById, updateBrief } from '../api/client';

const EditBrief = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [brief, setBrief] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);


  const allQuestionsInBrief = useMemo(() => {
    const allQ = steps.flatMap(step =>
      step.questions.map(q => ({
        id: q.id, // Это может быть строковый q_timestamp или числовой ID
        text: q.text,
        stepTitle: step.title,
        question_type: q.question_type,
        options: q.options
      }))
    );
    console.log('allQuestionsInBrief (в BriefBuilder/EditBrief):', allQ); // ДОБАВЬТЕ ЭТУ СТРОКУ
    return allQ;
  }, [steps]);

  useEffect(() => {
    const fetchData = async () => {
      setError('');
      try {
        // ИСПРАВЛЕНИЕ: Используем нашу новую функцию
        const response = await getBriefById(id);
        const data = response.data;
        setBrief(data);
        setTitle(data.title);
        setDescription(data.description || '');
        setSteps(data.steps || []);
      } catch (err) {
        setError('Ошибка загрузки брифа. Возможно, он не существует.');
        console.error('Ошибка загрузки брифа:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const addStep = () => {
    const newStep = {
      id: `step_${Date.now()}`,
      title: `Шаг ${steps.length + 1}`,
      questions: [],
      conditional_logic: null,
      order: steps.length + 1,
    };
    setSteps(prev => [...prev, newStep]);
  };

  const updateStep = (stepId, updatedStep) => {
    setSteps(prev => prev.map(s => (s.id === stepId ? { ...s, ...updatedStep } : s)));
  };

  const deleteStep = (stepId) => {
    if (window.confirm('Вы уверены, что хотите удалить этот шаг со всеми вопросами?')) {
      setSteps(prev => prev.filter(s => s.id !== stepId));
    }
  };

  const addQuestionToStep = (stepId) => {
    const newQuestion = { 
      id: `q_${Date.now()}`, // Временный строковый ID
      text: '',
      question_type: 'text', 
      options: null,
      is_required: false,
      order: steps.find(s => s.id === stepId).questions.length + 1,
      conditional_logic: null,
    };
    setSteps(prev => prev.map(s => 
      s.id === stepId 
        ? { ...s, questions: [...s.questions, newQuestion] } 
        : s
    ));
  };

  const updateQuestion = (stepId, questionId, updatedQuestion) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? {
              ...step,
              questions: step.questions.map(q =>
                q.id === questionId ? { ...q, ...updatedQuestion } : q
              ),
            }
          : step
      )
    );
  };

  const deleteQuestion = (stepId, questionId) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId
          ? {
              ...step,
              questions: step.questions.filter(q => q.id !== questionId),
            }
          : step
      )
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const briefData = {
      title,
      description,
      steps: steps.map(step => ({
        id: typeof step.id === 'string' && step.id.startsWith('step_') ? undefined : step.id,
        title: step.title,
        order: step.order,
        conditional_logic: step.conditional_logic ? {
            show_if: {
                // ИЗМЕНЕНИЕ: Всегда парсим в INT при сохранении, если это не null.
                question_id: step.conditional_logic.show_if.question_id !== null && step.conditional_logic.show_if.question_id !== undefined
                               ? parseInt(step.conditional_logic.show_if.question_id, 10) 
                               : null, 
                operator: step.conditional_logic.show_if.operator,
                value: step.conditional_logic.show_if.value,
            }
        } : null,
        questions: step.questions.map(question => ({
          id: typeof question.id === 'string' && question.id.startsWith('q_') ? undefined : question.id,
          text: question.text,
          question_type: question.question_type,
          options: question.options,
          is_required: question.is_required,
          order: question.order,
          conditional_logic: question.conditional_logic ? {
              show_if: {
                  question_id: question.conditional_logic.show_if.question_id !== null && question.conditional_logic.show_if.question_id !== undefined
                                 ? parseInt(question.conditional_logic.show_if.question_id, 10)
                                 : null,
                  operator: question.conditional_logic.show_if.operator,
                  value: question.conditional_logic.show_if.value,
              }
          } : null,
        })),
      })),
    };
     try {
      // ИСПРАВЛЕНИЕ: Используем нашу новую функцию для обновления
      await updateBrief(id, briefData);
      alert('Бриф успешно сохранен!');
      navigate('/admin'); // Возвращаемся в список брифов
    } catch (err) {
      setError('Не удалось сохранить бриф.');
      console.error('Ошибка при сохранении брифа:', err);
    }
  };

  if (loading) {
    return <div>Загрузка редактора...</div>;
  }
  
  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <h1 className="text-4xl font-bold text-slate-900 mb-8 text-center">Редактировать бриф</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="mb-4">
            <label htmlFor="brief-title" className="block text-sm font-medium text-slate-700 mb-2">Название брифа</label>
            <input
              type="text"
              id="brief-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Бриф для разработки интернет-магазина"
              required
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="brief-description" className="block text-sm font-medium text-slate-700 mb-2">Описание брифа</label>
            <textarea
              id="brief-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое пояснение для чего нужен этот бриф"
              rows="3"
              className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Шаги</h2>
          <DndContext collisionDetection={closestCenter} onDragEnd={({ active, over }) => {
            if (active.id !== over.id) {
              setSteps((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);
                return arrayMove(items, oldIndex, newIndex).map((step, idx) => ({ ...step, order: idx + 1 }));
              });
            }
          }}>
            <div className="space-y-6">
              <SortableContext items={steps} strategy={verticalListSortingStrategy}>
                {steps.map((step, index) => (
                  <StepEditor
                    key={step.id}
                    step={step}
                    onUpdateStep={(updatedStep) => updateStep(step.id, { ...step, ...updatedStep })}
                    onDeleteStep={() => deleteStep(step.id)}
                    onAddQuestion={() => addQuestionToStep(step.id)}
                    onUpdateQuestion={updateQuestion}
                    onDeleteQuestion={deleteQuestion}
                    availableQuestions={allQuestionsInBrief.filter(q => {
                      const stepOfQuestion = steps.find(s => s.questions.some(sq => sq.id === q.id));
                      return stepOfQuestion && stepOfQuestion.order < step.order;
                    })}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
          <button
            type="button"
            onClick={addStep}
            className="mt-6 flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition-all shadow-sm"
          >
            <PlusCircle size={20} />
            Добавить шаг
          </button>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button
            type="submit"
            className="px-6 py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md transition-colors"
          >
            Сохранить изменения
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditBrief;