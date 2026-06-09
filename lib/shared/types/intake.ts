export type QuestionType = 'single_choice' | 'multi_choice' | 'scale' | 'boolean';

export interface QuestionOption {
  value: string;
  label: string;
}

/** Controls whether a question is shown based on a previous answer */
export interface ShowIfCondition {
  /** The question ID to check */
  answer: string;
  /** Show this question if the answer array includes at least one of these values */
  includes_any: string[];
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
  show_if?: ShowIfCondition;
}

export interface IntakeQuestionFile {
  version: string;
  questions: IntakeQuestion[];
}

export type IntakeAnswerValue = string | string[] | number | boolean;

export interface IntakeAnswerMap {
  [questionId: string]: IntakeAnswerValue;
}
