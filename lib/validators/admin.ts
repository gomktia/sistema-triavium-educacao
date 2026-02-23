import { z } from 'zod';

export const createSchoolSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minusculas, numeros e hifens'),
    email: z.string().email('Email invalido').optional().or(z.literal('')),
    phone: z.string().optional(),
    city: z.string().optional(),
    state: z.string().max(2).optional(),
    organizationType: z.enum(['EDUCATIONAL', 'MILITARY', 'CORPORATE', 'SPORTS']).default('EDUCATIONAL'),
});
