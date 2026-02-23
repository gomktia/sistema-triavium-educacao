import { describe, it, expect } from 'vitest';
import {
    viaAnswersSchema,
    srssAnswersSchema,
    bigFiveAnswersSchema,
    ieaaAnswersSchema,
} from '@/lib/validators/assessment';

describe('Assessment Validators', () => {
    describe('VIA Answers', () => {
        it('accepts valid complete answers (71 items, 0-4)', () => {
            const answers: Record<string, number> = {};
            for (let i = 1; i <= 71; i++) answers[String(i)] = Math.floor(Math.random() * 5);
            const result = viaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(true);
        });

        it('accepts partial answers (in-progress)', () => {
            const answers = { '1': 3, '2': 4, '3': 0 };
            const result = viaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(true);
        });

        it('rejects values outside 0-4 range', () => {
            const answers = { '1': 5 };
            const result = viaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(false);
        });

        it('rejects negative values', () => {
            const answers = { '1': -1 };
            const result = viaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(false);
        });
    });

    describe('SRSS Answers', () => {
        it('accepts valid answers (12 items, 0-3)', () => {
            const answers: Record<string, number> = {};
            for (let i = 1; i <= 12; i++) answers[String(i)] = Math.floor(Math.random() * 4);
            const result = srssAnswersSchema.safeParse(answers);
            expect(result.success).toBe(true);
        });

        it('rejects values outside 0-3', () => {
            const answers = { '1': 4 };
            const result = srssAnswersSchema.safeParse(answers);
            expect(result.success).toBe(false);
        });
    });

    describe('Big Five Answers', () => {
        it('accepts valid answers (50 items, 1-5)', () => {
            const answers: Record<string, number> = {};
            for (let i = 1; i <= 50; i++) answers[String(i)] = Math.ceil(Math.random() * 5);
            const result = bigFiveAnswersSchema.safeParse(answers);
            expect(result.success).toBe(true);
        });

        it('rejects value 0 (Big Five uses 1-5)', () => {
            const answers = { '1': 0 };
            const result = bigFiveAnswersSchema.safeParse(answers);
            expect(result.success).toBe(false);
        });
    });

    describe('IEAA Answers', () => {
        it('accepts valid answers (50 items, 1-5)', () => {
            const answers: Record<string, number> = {};
            for (let i = 1; i <= 50; i++) answers[String(i)] = Math.ceil(Math.random() * 5);
            const result = ieaaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(true);
        });

        it('rejects value 0', () => {
            const answers = { '1': 0 };
            const result = ieaaAnswersSchema.safeParse(answers);
            expect(result.success).toBe(false);
        });
    });
});
