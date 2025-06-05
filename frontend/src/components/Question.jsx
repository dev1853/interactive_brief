// frontend/src/components/Question.jsx

import React from 'react';

import TextQuestion from './questions/TextQuestion';
import ChoiceQuestion from './questions/ChoiceQuestion';
import FileUploadQuestion from './questions/FileUploadQuestion';
import DateQuestion from './questions/DateQuestion';
import LinearScaleQuestion from './questions/LinearScaleQuestion';

const Question = (props) => {
  const { question } = props;

  switch (question.question_type) {
    case 'text':
    case 'number':
      return <TextQuestion {...props} />;

    case 'single_choice':
    case 'multi_choice':
      return <ChoiceQuestion {...props} />;

    case 'file':
      return <FileUploadQuestion {...props} />;

    case 'date':
      return <DateQuestion {...props} />;

    case 'linear_scale':
      return <LinearScaleQuestion {...props} />;

    default:
      return <p className='text-red-500'>Неизвестный тип вопроса: {question.question_type}</p>;
  }
};

export default Question;