import { describe, it, expect } from 'vitest';
import { createSchoolSchema } from '@/lib/validators/admin';
import { behaviorLogSchema } from '@/lib/validators/behavior';
import { createStudentSchema } from '@/lib/validators/student';

describe('Admin Validators', () => {
    it('accepts valid school creation', () => {
        const result = createSchoolSchema.safeParse({
            name: 'Escola Teste',
            slug: 'escola-teste',
            email: 'contato@escola.com.br',
        });
        expect(result.success).toBe(true);
    });

    it('rejects empty name', () => {
        const result = createSchoolSchema.safeParse({ name: '', slug: 'teste' });
        expect(result.success).toBe(false);
    });

    it('rejects invalid slug with spaces', () => {
        const result = createSchoolSchema.safeParse({ name: 'Escola', slug: 'escola teste' });
        expect(result.success).toBe(false);
    });

    it('accepts slug without email', () => {
        const result = createSchoolSchema.safeParse({ name: 'Escola', slug: 'escola-ok' });
        expect(result.success).toBe(true);
    });
});

describe('Behavior Validators', () => {
    it('accepts valid behavior log', () => {
        const result = behaviorLogSchema.safeParse({
            studentId: 'some-student-id-here',
            category: 'CONFLITO',
            severity: 2,
            description: 'Observacao do professor',
        });
        expect(result.success).toBe(true);
    });

    it('rejects severity outside 1-3', () => {
        const result = behaviorLogSchema.safeParse({
            studentId: 'some-student-id',
            category: 'CONFLITO',
            severity: 5,
        });
        expect(result.success).toBe(false);
    });

    it('rejects invalid category', () => {
        const result = behaviorLogSchema.safeParse({
            studentId: 'some-id',
            category: 'INVALID_CATEGORY',
            severity: 1,
        });
        expect(result.success).toBe(false);
    });
});

describe('Student Validators', () => {
    it('accepts valid student', () => {
        const result = createStudentSchema.safeParse({
            name: 'Joao Silva',
            grade: 'ANO_1_EM',
        });
        expect(result.success).toBe(true);
    });

    it('rejects invalid CPF format when provided', () => {
        const result = createStudentSchema.safeParse({
            name: 'Joao',
            grade: 'ANO_1_EM',
            cpf: '123',
        });
        expect(result.success).toBe(false);
    });

    it('accepts valid CPF format', () => {
        const result = createStudentSchema.safeParse({
            name: 'Joao',
            grade: 'ANO_1_EM',
            cpf: '12345678901',
        });
        expect(result.success).toBe(true);
    });

    it('accepts CPF with dots and dash', () => {
        const result = createStudentSchema.safeParse({
            name: 'Joao',
            grade: 'ANO_1_EM',
            cpf: '123.456.789-01',
        });
        expect(result.success).toBe(true);
    });
});
