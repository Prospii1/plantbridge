'use client';

import { useState } from 'react';
import type { ValidatedIntakeQuestion } from '@/lib/shared/validators/intake-questions';

interface QuestionRendererProps {
  question: ValidatedIntakeQuestion;
  value: string | string[] | number | boolean | undefined;
  onChange: (id: string, value: string | string[] | number | boolean) => void;
}

const SCALE_LABELS: Record<number, string> = {
  1: 'Barely noticeable', 2: 'Very mild', 3: 'Mild', 4: 'Mild–moderate',
  5: 'Moderate', 6: 'Noticeable', 7: 'Significant', 8: 'Severe',
  9: 'Very severe', 10: 'Unbearable',
};

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  );
}

export function QuestionRenderer({ question, value, onChange }: QuestionRendererProps) {
  const defaultMin = question.type === 'scale' ? question.min : 1;
  const [sliderValue, setSliderValue] = useState<number>(
    question.type === 'scale' ? (typeof value === 'number' ? value : defaultMin) : defaultMin,
  );

  const questionText = (
    <div className="space-y-1 mb-5">
      <p className="text-xl font-display font-medium text-foreground leading-snug">{question.text}</p>
      {question.subtext && <p className="text-sm text-muted-foreground">{question.subtext}</p>}
    </div>
  );

  // ── Single choice ─────────────────────────────────────────────────────────
  if (question.type === 'single_choice') {
    return (
      <div className="space-y-4">
        {questionText}
        <div className="space-y-2.5">
          {question.options.map((opt) => {
            const selected = value === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${
                  selected
                    ? 'border-primary bg-secondary shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/40'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={opt.value}
                  checked={selected}
                  onChange={() => onChange(question.id, opt.value)}
                  className="sr-only"
                />
                <span className="flex-1 text-sm font-medium text-foreground">{opt.label}</span>
                <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                  selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                }`}>
                  {selected && <CheckIcon />}
                </span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Multi choice ──────────────────────────────────────────────────────────
  if (question.type === 'multi_choice') {
    const selected = Array.isArray(value) ? value : [];
    const toggle = (v: string) => {
      const next = selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v];
      onChange(question.id, next);
    };

    // Many options → compact chip grid; few options → option cards
    const useChips = question.options.length > 6;

    return (
      <div className="space-y-4">
        {questionText}
        {useChips ? (
          <div className="flex flex-wrap gap-2.5">
            {question.options.map((opt) => {
              const on = selected.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-medium transition-all border ${
                    on
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {on && <CheckIcon />}
                  {opt.label}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            {question.options.map((opt) => {
              const on = selected.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 transition-all ${
                    on
                      ? 'border-primary bg-secondary shadow-sm'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    name={question.id}
                    value={opt.value}
                    checked={on}
                    onChange={() => toggle(opt.value)}
                    className="sr-only"
                  />
                  <span className="flex-1 text-sm font-medium text-foreground">{opt.label}</span>
                  <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                    on ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                  }`}>
                    {on && <CheckIcon />}
                  </span>
                </label>
              );
            })}
          </div>
        )}
        {selected.length > 0 && (
          <p className="text-xs text-muted-foreground">{selected.length} selected</p>
        )}
      </div>
    );
  }

  // ── Scale ─────────────────────────────────────────────────────────────────
  if (question.type === 'scale') {
    const current = typeof value === 'number' ? value : sliderValue;
    const hue = question.max === 10
      ? 152 - (current - 1) * 13  // green → red
      : 152;

    return (
      <div className="space-y-4">
        {questionText}
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
          {/* Big number display */}
          <div className="text-center space-y-1">
            <div
              className="font-display text-7xl font-medium leading-none"
              style={{ color: `oklch(0.55 0.15 ${hue})` }}
            >
              {current}
            </div>
            {question.max === 10 && (
              <p className="text-sm font-medium" style={{ color: `oklch(0.50 0.14 ${hue})` }}>
                {SCALE_LABELS[current] ?? ''}
              </p>
            )}
          </div>

          {/* Slider */}
          <input
            type="range"
            min={question.min}
            max={question.max}
            step={1}
            value={current}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setSliderValue(n);
              onChange(question.id, n);
            }}
            className="w-full h-2 rounded-full cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${((current - question.min) / (question.max - question.min)) * 100}%, var(--secondary) ${((current - question.min) / (question.max - question.min)) * 100}%, var(--secondary) 100%)`,
            }}
          />
          {(question.minLabel || question.maxLabel) && (
            <div className="flex justify-between text-xs text-muted-foreground -mt-2">
              <span>{question.minLabel}</span>
              <span>{question.maxLabel}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Boolean ───────────────────────────────────────────────────────────────
  if (question.type === 'boolean') {
    return (
      <div className="space-y-4">
        {questionText}
        <div className="grid grid-cols-2 gap-3">
          {([true, false] as const).map((v) => {
            const selected = value === v;
            return (
              <label
                key={String(v)}
                className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border p-5 transition-all ${
                  selected
                    ? 'border-primary bg-secondary shadow-sm'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/40'
                }`}
              >
                <input
                  type="radio"
                  name={question.id}
                  value={String(v)}
                  checked={selected}
                  onChange={() => onChange(question.id, v)}
                  className="sr-only"
                />
                <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                  selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border'
                }`}>
                  {selected && <CheckIcon />}
                </span>
                <span className="text-sm font-semibold text-foreground">{v ? 'Yes' : 'No'}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}
