export type QuestionType = 'single_choice' | 'multi_choice' | 'scale' | 'boolean';

export interface QuestionOption {
  value: string;
  label: string;
}

export interface IntakeQuestion {
  id: string;
  type: QuestionType;
  text: string;
  subtext?: string;
  required: boolean;
  options?: QuestionOption[];
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface IntakeQuestionFile {
  version: string;
  questions: IntakeQuestion[];
}

export type IntakeAnswerValue = string | string[] | number | boolean;

export interface IntakeAnswerMap {
  [questionId: string]: IntakeAnswerValue;
}
