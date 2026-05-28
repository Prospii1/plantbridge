'use client';

import type { ValidatedIntakeQuestion } from '@/lib/shared/validators/intake-questions';

interface QuestionRendererProps {
  question: ValidatedIntakeQuestion;
  value: string | string[] | number | boolean | undefined;
  onChange: (id: string, value: string | string[] | number | boolean) => void;
}

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <p className="text-lg font-medium text-foreground">{question.text}</p>
        {question.subtext && (
          <p className="text-sm text-muted-foreground">{question.subtext}</p>
        )}
      </div>

      {question.type === 'single_choice' && (
        <div className="space-y-2">
          {question.options.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-secondary"
            >
              <input
                type="radio"
                name={question.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(question.id, opt.value)}
                className="accent-primary"
              />
              <span className="text-sm">{opt.label}</span>
            </label>
          ))}
        </div>
      )}

      {question.type === 'multi_choice' && (
        <div className="space-y-2">
          {question.options.map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt.value);
            return (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-secondary"
              >
                <input
                  type="checkbox"
                  name={question.id}
                  value={opt.value}
                  checked={checked}
                  onChange={(e) => {
                    const current = Array.isArray(value) ? value : [];
                    const next = e.target.checked
                      ? [...current, opt.value]
                      : current.filter((v) => v !== opt.value);
                    onChange(question.id, next);
                  }}
                  className="accent-primary"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'scale' && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {Array.from({ length: question.max - question.min + 1 }, (_, i) => {
              const v = question.min + i;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => onChange(question.id, v)}
                  className={`flex h-11 w-11 items-center justify-center rounded-lg border text-sm font-medium transition-colors ${
                    value === v
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card hover:border-primary hover:text-primary'
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
          {(question.minLabel || question.maxLabel) && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{question.minLabel}</span>
              <span>{question.maxLabel}</span>
            </div>
          )}
        </div>
      )}

      {question.type === 'boolean' && (
        <div className="flex gap-3">
          {(['true', 'false'] as const).map((v) => (
            <label
              key={v}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-5 py-3 transition-colors hover:bg-secondary has-[:checked]:border-primary has-[:checked]:bg-secondary"
            >
              <input
                type="radio"
                name={question.id}
                value={v}
                checked={value === (v === 'true')}
                onChange={() => onChange(question.id, v === 'true')}
                className="accent-primary"
              />
              <span className="text-sm font-medium">{v === 'true' ? 'Yes' : 'No'}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
