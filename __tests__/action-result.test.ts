import { describe, it, expect } from 'vitest';
import { ok, fail, isOk, isFail } from '@/lib/action-result';

describe('ActionResult', () => {
    it('ok() creates success result', () => {
        const result = ok({ id: '123' });
        expect(result.success).toBe(true);
        expect(isOk(result) && result.data.id).toBe('123');
    });

    it('fail() creates error result', () => {
        const result = fail('Algo deu errado');
        expect(result.success).toBe(false);
        expect(isFail(result) && result.error).toBe('Algo deu errado');
    });

    it('fail() with field errors', () => {
        const result = fail('Validacao falhou', { name: 'Obrigatorio' });
        expect(isFail(result) && result.fieldErrors?.name).toBe('Obrigatorio');
    });

    it('isOk returns false for fail results', () => {
        const result = fail('error');
        expect(isOk(result)).toBe(false);
    });

    it('isFail returns false for ok results', () => {
        const result = ok({ id: '1' });
        expect(isFail(result)).toBe(false);
    });
});
