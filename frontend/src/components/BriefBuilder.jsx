// frontend/src/components/BriefBuilder.jsx

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StepEditor from './builder/StepEditor';
import { PlusCircle } from 'lucide-react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import { createBrief } from '../api/client'

const BriefBuilder = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState([]);

  const allQuestionsInBrief = useMemo(() => {
    return steps.flatMap(step =>
      step.questions.map(q => ({
        id: q.id, // ID может быть строковым (q_timestamp) для новых вопросов, или числовым для загруженных
        text: q.text,
        stepTitle: step.title,
        question_type: q.question_type,
        options: q.options
      }))
    );
  }, [steps]);

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
                question_id: (() => {
                    const qid = step.conditional_logic.show_if.question_id;
                    if (qid === null || qid === undefined || qid === '') return null; // Очищаем пустое
                    const parsedId = parseInt(qid, 10);
                    return isNaN(parsedId) ? null : parsedId; // Если не число, отправляем null, иначе - число
                })(),
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
                question_id: (() => {
                    const qid = question.conditional_logic.show_if.question_id;
                    if (qid === null || qid === undefined || qid === '') return null;
                    const parsedId = parseInt(qid, 10);
                    return isNaN(parsedId) ? null : parsedId;
                })(),
                operator: question.conditional_logic.show_if.operator,
                value: question.conditional_logic.show_if.value,
            }
        } : null,
        })),
      })),
    };
    try {
      const response = await createBrief(briefData);
      // ИСПРАВЛЕНИЕ: Перенаправляем на страницу редактирования в админке
      navigate(`/admin/edit/${response.data.id}`); 
    } catch (error) {
      console.error('Ошибка при создании брифа:', error);
      alert(`Не удалось создать бриф: ${error.message}`);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-8">
      <h1 className="text-4xl font-bold text-slate-900 mb-8 text-center">Создать новый бриф</h1>
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
            type="submit" // ИЗМЕНЕНИЕ ЗДЕСЬ: type="submit"
            className="px-6 py-3 rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 font-semibold shadow-md transition-colors"
          >
            Сохранить бриф
          </button>
        </div>
      </form>
    </div>
  );
};

export default BriefBuilder;