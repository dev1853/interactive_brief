// frontend/src/components/ProgressBar.jsx

import React from 'react';
import { Check } from 'lucide-react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const ProgressBar = ({ steps, currentStepIndex }) => {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="grid md:grid-cols-4 gap-x-8 gap-y-4">
        {steps.map((step, stepIdx) => {
          const isCompleted = currentStepIndex > stepIdx;
          const isCurrent = currentStepIndex === stepIdx;

          return (
            <li key={step.id} className="relative">
              <div className="flex items-start gap-x-3">
                <div className="relative flex h-12 flex-col items-center">
                  {stepIdx !== 0 ? (
                    <div 
                      className={classNames(
                        "absolute -top-4 bottom-0 w-px",
                        currentStepIndex >= stepIdx ? "bg-indigo-600" : "bg-slate-200"
                      )} 
                    />
                  ) : null}
                  <div
                    className={classNames(
                      "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                      isCompleted ? "bg-indigo-600" : "bg-white",
                      isCurrent ? "ring-2 ring-indigo-600" : "border-2 border-slate-300"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5 text-white" aria-hidden="true" />
                    ) : (
                      <span 
                        className={classNames(
                          "h-2.5 w-2.5 rounded-full",
                          isCurrent ? "bg-indigo-600" : "bg-transparent"
                        )} 
                      />
                    )}
                  </div>
                </div>
                
                <div className="pt-1.5">
                    <p className={classNames(
                        "text-sm font-semibold",
                        isCurrent || isCompleted ? "text-indigo-600" : "text-slate-500"
                    )}>
                        {step.title}
                    </p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default ProgressBar;