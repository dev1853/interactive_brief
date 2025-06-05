// frontend/src/components/builder/StepEditor.jsx

import React from 'react';
import { PlusCircle, Trash2 } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import QuestionEditor from '../questions/QuestionEditor';

const StepEditor = ({ step, onUpdateStep, onDeleteStep, onAddQuestion, onUpdateQuestion, onDeleteQuestion }) => {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
        <input
          type="text"
          value={step.title}
          onChange={(e) => onUpdateStep({ ...step, title: e.target.value })}
          placeholder="Название шага"
          className="text-2xl font-bold text-slate-900 border-none focus:ring-0 p-0"
        />
        <button
          onClick={onDeleteStep}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
          title="Удалить шаг"
        >
          <Trash2 size={20} />
        </button>
      </div>

      <div className="space-y-4">
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
      </div>

      <button
        onClick={onAddQuestion}
        className="mt-4 flex items-center gap-2 px-4 py-2 border-2 border-dashed border-slate-300 text-slate-500 rounded-lg hover:border-indigo-600 hover:text-indigo-600 transition-all w-full justify-center"
      >
        <PlusCircle size={20} />
        Добавить вопрос в этот шаг
      </button>
    </div>
  );
};

export default StepEditor;