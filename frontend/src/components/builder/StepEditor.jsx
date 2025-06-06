// frontend/src/components/builder/StepEditor.jsx

import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import QuestionEditor from '../questions/QuestionEditor';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const StepEditor = ({ step, onUpdateStep, onDeleteStep, onAddQuestion, onUpdateQuestion, onDeleteQuestion, availableQuestions }) => {
  const [isExpanded, setIsExpanded] = useState(true); // <<--- ЭТА СТРОКА ДОЛЖНА БЫТЬ

  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({id: step.id});
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

  // Инициализация из step.conditional_logic
  const [conditionQuestionId, setConditionQuestionId] = useState(() => {
    const qid = step.conditional_logic?.show_if?.question_id;
    return (qid !== null && qid !== undefined) ? String(qid) : ''; // Для select value, всегда преобразуем в строку
  });

  const [conditionOperator, setConditionOperator] = useState(step.conditional_logic?.show_if?.operator || 'equals');
  const [conditionValue, setConditionValue] = useState(step.conditional_logic?.show_if?.value || '');

  // Эффект для синхронизации локального состояния с пропсами при их изменении
  useEffect(() => {
    const qid = step.conditional_logic?.show_if?.question_id;
    setConditionQuestionId(
      (qid !== null && qid !== undefined) ? String(qid) : ''
    );
    setConditionOperator(step.conditional_logic?.show_if?.operator || 'equals');
    setConditionValue(step.conditional_logic?.show_if?.value || '');
  }, [step.conditional_logic]);


  // Обработчик изменения условной логики
  const handleConditionalLogicChange = () => {
    let finalQuestionId = null;
    if (conditionQuestionId !== '') { // Если что-то выбрано
      const parsedId = parseInt(conditionQuestionId, 10);
      if (!isNaN(parsedId)) {
        finalQuestionId = parsedId;
      } else {
        // Это warning, потому что это означает, что временный ID (q_timestamp)
        // был выбран, но его нельзя сохранить как числовой ID.
        // Он будет преобразован в null при сохранении.
        console.warn(`StepEditor: question_id "${conditionQuestionId}" не является числом и не будет сохранен в conditional_logic.`);
        finalQuestionId = null; 
      }
    }

    const newCondition = {
      question_id: finalQuestionId, // Теперь это числовой ID или null
      operator: conditionOperator,
      value: conditionValue,
    };
    
    // Если все поля пустые или question_id равен null, то удаляем conditional_logic
    if (newCondition.question_id === null && (!newCondition.value || newCondition.value === '')) { 
      onUpdateStep({ ...step, conditional_logic: null });
    } else {
      onUpdateStep({ ...step, conditional_logic: { show_if: newCondition } });
    }
  };

  const selectedQuestion = availableQuestions.find(q => String(q.id) === String(conditionQuestionId));
  const isChoiceQuestion = selectedQuestion && (selectedQuestion.question_type === 'single_choice' || selectedQuestion.question_type === 'multi_choice');


  return (
    <div ref={setNodeRef} style={style} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
        <input
          type="text"
          value={step.title}
          onChange={(e) => onUpdateStep({ ...step, title: e.target.value })}
          placeholder="Название шага"
          className="text-2xl font-bold text-slate-900 border-none focus:ring-0 p-0"
        />
        <div className="flex items-center gap-2">
          {/* Кнопка сворачивания/разворачивания */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)} 
            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
            title={isExpanded ? "Свернуть шаг" : "Развернуть шаг"}
          >
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />} 
          </button>
          <button
            type="button"
            onClick={onDeleteStep}
            className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            title="Удалить шаг"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {isExpanded && ( 
        <>
          <div className="mb-6 border p-4 rounded-lg bg-slate-50">
            <h4 className="text-lg font-semibold text-slate-800 mb-3">Условное отображение шага (необязательно)</h4>
            <p className="text-sm text-slate-600 mb-4">
              Показать этот шаг, если ответ на предыдущий вопрос соответствует условию.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Выбор вопроса */}
              <div>
                <label htmlFor={`condition-question-${step.id}`} className="block text-sm font-medium text-slate-700 mb-1">
                  Зависит от вопроса:
                </label>
                <select
                  id={`condition-question-${step.id}`}
                  value={conditionQuestionId}
                  onChange={(e) => {
                    setConditionQuestionId(e.target.value);
                    setConditionValue('');
                  }}
                  onBlur={handleConditionalLogicChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Не выбрано</option>
                  {availableQuestions.map(q => (
                    <option key={q.id} value={String(q.id)}> 
                      {q.stepTitle ? `${q.stepTitle}: ` : ''}{q.text} (ID: {q.id}) {/* <<--- ВОТ ЭТА СТРОКА */}
                    </option>
                  ))}
                </select>
              </div>

              {/* Выбор оператора */}
              <div>
                <label htmlFor={`condition-operator-${step.id}`} className="block text-sm font-medium text-slate-700 mb-1">
                  Условие:
                </label>
                <select
                  id={`condition-operator-${step.id}`}
                  value={conditionOperator}
                  onChange={(e) => setConditionOperator(e.target.value)}
                  onBlur={handleConditionalLogicChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  disabled={!conditionQuestionId}
                >
                  <option value="equals">Равно</option>
                  <option value="not_equals">Не равно</option>
                  {isChoiceQuestion && <option value="contains">Содержит (для множественного выбора)</option>}
                  {isChoiceQuestion && <option value="not_contains">Не содержит (для множественного выбора)</option>}
                </select>
              </div>

              {/* Ввод значения */}
              <div>
                <label htmlFor={`condition-value-${step.id}`} className="block text-sm font-medium text-slate-700 mb-1">
                  Значение:
                </label>
                {isChoiceQuestion && selectedQuestion.options ? (
                  <select
                    id={`condition-value-${step.id}`}
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    onBlur={handleConditionalLogicChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={!conditionQuestionId}
                  >
                    <option value="">Выберите опцию</option>
                    {selectedQuestion.options.map((option, idx) => (
                      <option key={idx} value={option}>{option}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    id={`condition-value-${step.id}`}
                    value={conditionValue}
                    onChange={(e) => setConditionValue(e.target.value)}
                    onBlur={handleConditionalLogicChange}
                    placeholder="Введите значение"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    disabled={!conditionQuestionId}
                  />
                )}
              </div>
            </div>
            {conditionQuestionId && (
              <button
                type="button"
                onClick={() => {
                  setConditionQuestionId('');
                  setConditionOperator('equals');
                  setConditionValue('');
                  onUpdateStep({ ...step, conditional_logic: null });
                }}
                className="mt-3 text-sm text-red-600 hover:underline"
              >
                Очистить условие
              </button>
            )}
          </div>

          <div className="space-y-4">
            {step.questions.length > 0 ? (
              <SortableContext items={step.questions} strategy={verticalListSortingStrategy}>
                {step.questions.map((q) => (
                  <QuestionEditor
                    key={q.id}
                    question={q}
                    onUpdate={(updatedQ) => onUpdateQuestion(step.id, q.id, updatedQ)}
                    onDelete={() => onDeleteQuestion(step.id, q.id)}
                  />
                ))}
              </SortableContext>
            ) : (
              <p className="text-slate-500 text-center py-4 border border-dashed border-slate-300 rounded-lg">
                В этом шаге пока нет вопросов.
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onAddQuestion}
            className="mt-4 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-all shadow-sm w-full justify-center"
          >
            <PlusCircle size={20} />
            Добавить вопрос
          </button>
        </>
      )}
    </div>
  );
};

export default StepEditor;