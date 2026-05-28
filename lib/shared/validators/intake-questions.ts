import { z } from 'zod';

const QuestionOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

export const IntakeQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().regex(/^[a-z][a-z0-9.]+$/, 'Question ID must be dotted lowercase'),
    type: z.literal('single_choice'),
    text: z.string().min(1),
    subtext: z.string().optional(),
    required: z.boolean(),
    options: z.array(QuestionOptionSchema).min(2),
  }),
  z.object({
    id: z.string().regex(/^[a-z][a-z0-9.]+$/, 'Question ID must be dotted lowercase'),
    type: z.literal('multi_choice'),
    text: z.string().min(1),
    subtext: z.string().optional(),
    required: z.boolean(),
    options: z.array(QuestionOptionSchema).min(2),
  }),
  z.object({
    id: z.string().regex(/^[a-z][a-z0-9.]+$/, 'Question ID must be dotted lowercase'),
    type: z.literal('scale'),
    text: z.string().min(1),
    subtext: z.string().optional(),
    required: z.boolean(),
    min: z.number().int(),
    max: z.number().int(),
    minLabel: z.string().optional(),
    maxLabel: z.string().optional(),
  }),
  z.object({
    id: z.string().regex(/^[a-z][a-z0-9.]+$/, 'Question ID must be dotted lowercase'),
    type: z.literal('boolean'),
    text: z.string().min(1),
    subtext: z.string().optional(),
    required: z.boolean(),
  }),
]);

export const IntakeQuestionsFileSchema = z.object({
  version: z.string().regex(/^\d+\.\d+\.\d+$/, 'Version must be semver'),
  questions: z.array(IntakeQuestionSchema).min(1),
});

export type ValidatedIntakeQuestion = z.infer<typeof IntakeQuestionSchema>;
export type ValidatedIntakeQuestionsFile = z.infer<typeof IntakeQuestionsFileSchema>;

export const IntakeAnswerSchema = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string()), z.number().int().min(1).max(5), z.boolean()]),
);
