// frontend/src/components/SubmissionDetail.jsx

import React from 'react';
import { File as FileIcon, CheckSquare, MousePointerClick } from 'lucide-react';

const FormatAnswer = ({ answer }) => {
  if (answer === null || answer === undefined || answer === '') {
    return <span className="text-slate-400 italic">Ответ не дан</span>;
  }
  if (Array.isArray(answer)) {
    return (
      <ul className="space-y-2">
        {answer.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {item.path ? (
              <><FileIcon size={16} className="text-slate-500" /> <a href={`http://localhost:8001${item.path}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{item.name}</a></>
            ) : (
              <><CheckSquare size={16} className="text-green-600" /> <span>{String(item)}</span></>
            )}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof answer === 'string' && (answer.startsWith('http') || answer.startsWith('/uploads'))) {
     const url = answer.startsWith('/') ? `http://localhost:8001${answer}` : answer;
     return <a href={url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">{answer}</a>;
  }
  return <p className="whitespace-pre-wrap">{String(answer)}</p>;
};

const SubmissionDetail = ({ brief, submission }) => {
  if (!submission || !brief) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center bg-slate-50 rounded-lg p-8">
        <MousePointerClick size={48} className="text-slate-400 mb-4" />
        <h3 className="text-xl font-semibold text-slate-700">Выберите ответ</h3>
        <p className="text-slate-500 mt-2">Нажмите на одну из сессий слева, чтобы посмотреть детали.</p>
      </div>
    );
  }

  const allQuestions = brief.steps
    .flatMap(step => step.questions.map(q => ({ ...q, stepTitle: step.title, stepOrder: step.order })))
    .sort((a, b) => {
        const stepA = brief.steps.find(s => s.questions.some(q => q.id === a.id));
        const stepB = brief.steps.find(s => s.questions.some(q => q.id === b.id));
        const stepOrderA = stepA ? stepA.order : 0;
        const stepOrderB = stepB ? stepB.order : 0;
        if (stepOrderA !== stepOrderB) {
            return stepOrderA - stepOrderB;
        }
        return a.order - b.order;
    });

  return (
    <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      <div className="border-b border-slate-200 pb-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-900">Детали ответа</h2>
        <p className="text-sm text-slate-500 mt-1">ID сессии: {submission.session_id}</p>
      </div>
      <div className="space-y-6">
        {allQuestions.map(question => {
          const answer = submission.answers_data[question.id];
          return (
            <div key={question.id}>
              <h4 className="font-semibold text-slate-800">
                <span className="text-indigo-600">{question.stepTitle}</span> / {question.text}
              </h4>
              <div className="mt-2 pl-4 border-l-2 border-slate-200 text-slate-600">
                <FormatAnswer answer={answer} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubmissionDetail;