// frontend/src/components/SubmissionDetail.jsx

import React from 'react';
import { File as FileIcon, CheckSquare, MousePointerClick } from 'lucide-react';

const FormatAnswer = ({ answer }) => {
  if (answer === null || answer === undefined || answer === '') {
    return <span className="text-slate-400 italic">Ответ не дан</span>;
  }
  if (Array.isArray(answer)) {
    return (
      <ul className="space-y-2 list-none p-0 ml-0">
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
  if (!brief || !submission) {
    return <div className="text-center text-slate-500 p-8">Выберите сессию для просмотра деталей.</div>;
  }

  // Создаем плоский список всех вопросов из брифа для удобного доступа
  const allQuestions = brief.steps
    .flatMap(step => step.questions.map(q => ({ ...q, stepTitle: step.title, stepOrder: step.order })))
    .sort((a, b) => {
        const stepA = brief.steps.find(s => s.questions.some(question => question.id === a.id));
        const stepB = brief.steps.find(s => s.questions.some(question => question.id === b.id));
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
        <p className="text-sm text-slate-500">Отправлено: {new Date(submission.submitted_at).toLocaleString('ru-RU')}</p>
      </div>
      <div className="space-y-6">
        {allQuestions.map(question => {
          const answer = submission.answers_data[question.id]; // Ответ может быть undefined
          
          // Проверяем conditional_logic вопроса, чтобы определить, должен ли он быть показан
          // в данном ответе (чтобы результаты соответствовали тому, что видел пользователь)
          // Для этого нам нужны ВСЕ ответы сессии, а не только текущий
          // (submission.answers_data содержит все ответы)
          const isQuestionVisibleByLogic = checkConditionOnSubmission(question.conditional_logic, submission.answers_data);

          // Проверяем также, принадлежит ли вопрос видимому шагу в контексте данного ответа
          const stepForQuestion = brief.steps.find(s => s.id === question.step_id);
          const isStepVisibleByLogic = checkConditionOnSubmission(stepForQuestion?.conditional_logic, submission.answers_data);

          // Отображаем вопрос и ответ, только если сам вопрос и его шаг были видимы
          if (isQuestionVisibleByLogic && isStepVisibleByLogic) {
            return (
              <div key={question.id}>
                <h4 className="font-semibold text-slate-800">
                  <span className="text-indigo-600 mr-2">{question.stepTitle}:</span> 
                  {question.text}
                </h4>
                <div className="ml-4 text-slate-700">
                  <FormatAnswer answer={answer} />
                </div>
              </div>
            );
          }
          return null; // Не отображаем невидимые вопросы/шаги
        })}
      </div>
       <div className="mt-8 border-t border-slate-200 pt-6">
          <a
            href={`http://localhost:8001/submission/${submission.session_id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <FileIcon size={20} />
            Скачать PDF
          </a>
      </div>
    </div>
  );
};

export default SubmissionDetail;

// Вспомогательная функция для проверки условий на основе полных ответов сессии
// Эта логика дублирует checkCondition из BriefForm, но использует ID как ключи в answers
const checkConditionOnSubmission = (condition, answers_data) => {
  if (!condition || !condition.show_if) return true;
  const { question_id, operator, value } = condition.show_if;
  const targetAnswer = answers_data[question_id]; // answers_data здесь - это объект с числовыми ключами

  if (targetAnswer === undefined || targetAnswer === null || targetAnswer === '') {
    return false;
  }

  switch (operator) {
    case 'equals': return targetAnswer === value;
    case 'not_equals': return targetAnswer !== value;
    case 'contains': return Array.isArray(targetAnswer) && targetAnswer.includes(String(value));
    case 'not_contains': return Array.isArray(targetAnswer) && !targetAnswer.includes(String(value));
    case 'greater_than': return Number(targetAnswer) > Number(value);
    case 'less_than': return Number(targetAnswer) < Number(value);
    default: return false;
  }
};