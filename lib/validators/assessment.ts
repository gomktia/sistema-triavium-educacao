import { z } from 'zod';

/** VIA: 71 items, escala 0-4 */
export const viaAnswersSchema = z.record(
    z.string(),
    z.number().int().min(0).max(4)
);

/** SRSS-IE: 12 items, escala 0-3 */
export const srssAnswersSchema = z.record(
    z.string(),
    z.number().int().min(0).max(3)
);

/** Big Five: 50 items, escala 1-5 */
export const bigFiveAnswersSchema = z.record(
    z.string(),
    z.number().int().min(1).max(5)
);

/** IEAA: 50 items, escala 1-5 */
export const ieaaAnswersSchema = z.record(
    z.string(),
    z.number().int().min(1).max(5)
);

/** Schema para salvar VIA */
export const saveVIAInputSchema = z.object({
    answers: viaAnswersSchema,
    targetStudentId: z.string().optional(),
});

/** Schema para salvar SRSS */
export const saveSRSSInputSchema = z.object({
    studentId: z.string().min(1),
    answers: srssAnswersSchema,
});

/** Schema para salvar Big Five */
export const saveBigFiveInputSchema = z.object({
    answers: bigFiveAnswersSchema,
    targetStudentId: z.string().optional(),
});

/** Schema para salvar IEAA */
export const saveIEAAInputSchema = z.object({
    answers: ieaaAnswersSchema,
    targetStudentId: z.string().optional(),
});

/** SDQ: 25 items, escala 0-2 */
export const sdqAnswersSchema = z.record(
    z.string(),
    z.number().int().min(0).max(2)
);

/** Schema para salvar SDQ (professor) */
export const saveSDQTeacherInputSchema = z.object({
    studentId: z.string().min(1),
    answers: sdqAnswersSchema,
});

/** Schema para salvar SDQ (responsável) */
export const saveSDQParentInputSchema = z.object({
    answers: sdqAnswersSchema,
    targetStudentId: z.string().min(1),
});
