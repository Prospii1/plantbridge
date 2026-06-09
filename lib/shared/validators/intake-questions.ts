import { z } from 'zod';

const QuestionOptionSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
});

const ShowIfSchema = z.object({
  answer: z.string().min(1),
  includes_any: z.array(z.string().min(1)).min(1),
}).optional();

const baseId = z.string().regex(/^[a-z][a-z0-9.]+$/, 'Question ID must be dotted lowercase');

export const IntakeQuestionSchema = z.discriminatedUnion('type', [
  z.object({
    id: baseId,
    type: z.literal('single_choice'),
    text: z.string().min(1),
    subtext: z.string().optional(),
    required: z.boolean(),
    options: z.array(QuestionOptionSchema).min(2),
    show_if: ShowIfSchema,
  }),
  z.object({
    id: baseId,
    type: z.literal('multi_choice'),
    text: z.string().min(1),
    subtext: z.string().optional(),
    required: z.boolean(),
    options: z.array(QuestionOptionSchema).min(2),
    show_if: ShowIfSchema,
  }),
  z.object({
    id: baseId,
    type: z.literal('scale'),
    text: z.string().min(1),
    subtext: z.string().optional(),
    required: z.boolean(),
    min: z.number().int(),
    max: z.number().int(),
    minLabel: z.string().optional(),
    maxLabel: z.string().optional(),
    show_if: ShowIfSchema,
  }),
  z.object({
    id: baseId,
    type: z.literal('boolean'),
    text: z.string().min(1),
    subtext: z.string().optional(),
    required: z.boolean(),
    show_if: ShowIfSchema,
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
  z.union([z.string(), z.array(z.string()), z.number().int().min(1).max(10), z.boolean()]),
);
