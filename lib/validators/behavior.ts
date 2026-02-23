import { z } from 'zod';

const behaviorCategories = ['CONFLITO', 'ISOLAMENTO', 'TRISTEZA', 'AGRESSIVIDADE', 'POSITIVO', 'OUTROS'] as const;

export const behaviorLogSchema = z.object({
    studentId: z.string().min(1, 'ID do aluno obrigatorio'),
    category: z.enum(behaviorCategories),
    severity: z.number().int().min(1).max(3),
    description: z.string().max(2000).optional(),
});
