import { z } from 'zod';

const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

export const createStudentSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    grade: z.enum(['ANO_1_EM', 'ANO_2_EM', 'ANO_3_EM']),
    classroomId: z.string().optional(),
    cpf: z.string().regex(cpfRegex, 'CPF invalido').optional().or(z.literal('')),
    birthDate: z.string().optional(),
    enrollmentId: z.string().optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    guardianEmail: z.string().email().optional().or(z.literal('')),
});
