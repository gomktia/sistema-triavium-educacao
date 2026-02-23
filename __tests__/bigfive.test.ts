import { describe, it, expect } from 'vitest';
import { calculateBigFiveScores } from '@core/logic/bigfive';
import { BigFiveDomain, BigFiveRawAnswers } from '@core/types';
import { BIG_FIVE_ITEMS } from '@core/content/bigfive-items';

// ============================================================
// HELPERS
// ============================================================

/** Generates Big Five answers (50 items) with a single default value */
function makeBigFiveAnswers(defaultValue: number): BigFiveRawAnswers {
    const answers: BigFiveRawAnswers = {};
    for (let i = 1; i <= 50; i++) {
        answers[i] = defaultValue;
    }
    return answers;
}

/**
 * Computes the expected average score for a domain given uniform raw answers.
 * Accounts for item reversal and possible duplicate item IDs in BIG_FIVE_ITEMS.
 */
function expectedDomainAvg(domain: BigFiveDomain, rawValue: number): number {
    const domainItems = BIG_FIVE_ITEMS.filter(item => item.domain === domain);
    let sum = 0;
    domainItems.forEach(item => {
        const finalValue = item.reversed ? (6 - rawValue) : rawValue;
        sum += finalValue;
    });
    const avg = sum / domainItems.length;
    return Number(avg.toFixed(2));
}

// ============================================================
// TESTS
// ============================================================

describe('calculateBigFiveScores', () => {
    it('returns exactly 5 domain scores with all required properties', () => {
        const answers = makeBigFiveAnswers(3);
        const scores = calculateBigFiveScores(answers);

        expect(scores).toHaveLength(5);

        const domains = scores.map(s => s.domain);
        expect(domains).toContain(BigFiveDomain.ABERTURA);
        expect(domains).toContain(BigFiveDomain.CONSCIENCIOSIDADE);
        expect(domains).toContain(BigFiveDomain.ESTABILIDADE);
        expect(domains).toContain(BigFiveDomain.EXTROVERSAO);
        expect(domains).toContain(BigFiveDomain.AMABILIDADE);

        scores.forEach(score => {
            expect(score).toHaveProperty('domain');
            expect(score).toHaveProperty('score');
            expect(score).toHaveProperty('label');
            expect(score).toHaveProperty('description');
            expect(score).toHaveProperty('level');
            expect(typeof score.score).toBe('number');
            expect(typeof score.label).toBe('string');
            expect(typeof score.description).toBe('string');
            expect(['Baixo', 'M\u00e9dio', 'Alto']).toContain(score.level);
        });
    });

    it('neutral answers (all 3) yield avg = 3.0 and "M\u00e9dio" for every domain', () => {
        // When all raw answers are 3, reversed items become 6-3=3, non-reversed stay 3.
        // So every item contributes a finalValue of 3, giving avg = 3.0 regardless of reversals.
        // Level: 3.0 >= 3.0 and < 4.0 => 'Medio'
        const answers = makeBigFiveAnswers(3);
        const scores = calculateBigFiveScores(answers);

        scores.forEach(score => {
            expect(score.score).toBe(3);
            expect(score.level).toBe('M\u00e9dio');
        });
    });

    it('high raw answers (all 5) produce correct scores accounting for reversals', () => {
        // When all raw answers are 5:
        // - Non-reversed items contribute 5
        // - Reversed items contribute 6-5 = 1
        // Average depends on the ratio of reversed to non-reversed items per domain.
        const answers = makeBigFiveAnswers(5);
        const scores = calculateBigFiveScores(answers);

        scores.forEach(score => {
            const expected = expectedDomainAvg(score.domain, 5);
            expect(score.score).toBe(expected);
        });

        // EXTROVERSAO has equal split: 5 non-reversed, 5 reversed => avg = (25+5)/10 = 3.0
        const extroversao = scores.find(s => s.domain === BigFiveDomain.EXTROVERSAO)!;
        expect(extroversao.score).toBe(3);
        expect(extroversao.level).toBe('M\u00e9dio');
    });

    it('low raw answers (all 1) produce correct scores accounting for reversals', () => {
        // When all raw answers are 1:
        // - Non-reversed items contribute 1
        // - Reversed items contribute 6-1 = 5
        const answers = makeBigFiveAnswers(1);
        const scores = calculateBigFiveScores(answers);

        scores.forEach(score => {
            const expected = expectedDomainAvg(score.domain, 1);
            expect(score.score).toBe(expected);
        });

        // EXTROVERSAO: 5 non-reversed(1) + 5 reversed(5) = 30/10 = 3.0
        const extroversao = scores.find(s => s.domain === BigFiveDomain.EXTROVERSAO)!;
        expect(extroversao.score).toBe(3);
    });

    it('correctly inverts reversed items (verified per domain)', () => {
        // Use raw value = 5 to highlight reversal effect.
        const answers = makeBigFiveAnswers(5);
        const scores = calculateBigFiveScores(answers);

        // ABERTURA has 7 non-reversed and 3 reversed out of 10 items
        // Sum = 7*5 + 3*1 = 38, count = 10, avg = 3.8
        const abertura = scores.find(s => s.domain === BigFiveDomain.ABERTURA)!;
        expect(abertura.score).toBe(3.8);
        expect(abertura.level).toBe('M\u00e9dio');

        // AMABILIDADE has 6 non-reversed and 4 reversed out of 10 items
        // Sum = 6*5 + 4*1 = 34, count = 10, avg = 3.4
        const amabilidade = scores.find(s => s.domain === BigFiveDomain.AMABILIDADE)!;
        expect(amabilidade.score).toBe(3.4);
        expect(amabilidade.level).toBe('M\u00e9dio');

        // CONSCIENCIOSIDADE has 6 non-reversed and 4 reversed out of 10 items
        // Sum = 6*5 + 4*1 = 34, count = 10, avg = 3.4
        const conscienciosidade = scores.find(s => s.domain === BigFiveDomain.CONSCIENCIOSIDADE)!;
        expect(conscienciosidade.score).toBe(3.4);
        expect(conscienciosidade.level).toBe('M\u00e9dio');
    });

    it('handles missing answers gracefully (empty object yields score 0)', () => {
        const answers: BigFiveRawAnswers = {};
        const scores = calculateBigFiveScores(answers);

        // When no answers are provided, sum=0 and count=0.
        // The code uses: count = data.count > 0 ? data.count : 1
        // So avg = 0/1 = 0 => level 'Baixo'
        expect(scores).toHaveLength(5);
        scores.forEach(score => {
            expect(score.score).toBe(0);
            expect(score.level).toBe('Baixo');
        });
    });

    it('ignores out-of-range values (treats them as unanswered)', () => {
        const answers = makeBigFiveAnswers(3);
        // Set some EXTROVERSAO answers to invalid values
        answers[1] = 0;  // Below valid range (1-5) - item 1 is non-reversed EXTROVERSAO
        answers[2] = 6;  // Above valid range (1-5) - item 2 is reversed EXTROVERSAO
        answers[3] = -1; // Negative - item 3 is non-reversed EXTROVERSAO

        const scores = calculateBigFiveScores(answers);

        // EXTROVERSAO should now have only 7 valid items (items 4-10)
        // instead of 10. Items 1, 2, 3 are skipped.
        // Remaining items 4(R), 5, 6(R), 7, 8(R), 9, 10(R) = 7 items
        // All raw = 3, reversed(3)=3, non-reversed(3)=3
        // Sum = 7*3 = 21, count = 7, avg = 3.0
        const extroversao = scores.find(s => s.domain === BigFiveDomain.EXTROVERSAO)!;
        expect(extroversao.score).toBe(3);

        // Other domains should be unaffected
        const abertura = scores.find(s => s.domain === BigFiveDomain.ABERTURA)!;
        expect(abertura.score).toBe(3);
    });

    it('level boundaries: <3.0 Baixo, 3.0..3.99 Medio, >=4.0 Alto', () => {
        // avg = 3.0 => 'Medio' (neutral answers prove this)
        const neutralScores = calculateBigFiveScores(makeBigFiveAnswers(3));
        neutralScores.forEach(score => {
            expect(score.score).toBe(3);
            expect(score.level).toBe('M\u00e9dio');
        });

        // avg = 0 => 'Baixo' (empty answers)
        const emptyScores = calculateBigFiveScores({});
        emptyScores.forEach(score => {
            expect(score.level).toBe('Baixo');
        });

        // For 'Alto': verify using expectedDomainAvg helper to find
        // a domain that actually reaches >= 4.0 with the given raw value.
        // We verify that each domain's score matches our computed expectation
        // and that the level classification is consistent with the thresholds.
        const lowRawScores = calculateBigFiveScores(makeBigFiveAnswers(1));
        lowRawScores.forEach(score => {
            const expected = expectedDomainAvg(score.domain, 1);
            expect(score.score).toBe(expected);
            if (expected < 3.0) expect(score.level).toBe('Baixo');
            else if (expected >= 4.0) expect(score.level).toBe('Alto');
            else expect(score.level).toBe('M\u00e9dio');
        });

        const highRawScores = calculateBigFiveScores(makeBigFiveAnswers(5));
        highRawScores.forEach(score => {
            const expected = expectedDomainAvg(score.domain, 5);
            expect(score.score).toBe(expected);
            if (expected < 3.0) expect(score.level).toBe('Baixo');
            else if (expected >= 4.0) expect(score.level).toBe('Alto');
            else expect(score.level).toBe('M\u00e9dio');
        });
    });

    it('produces labels and descriptions from domain info', () => {
        const answers = makeBigFiveAnswers(3);
        const scores = calculateBigFiveScores(answers);

        const extroversao = scores.find(s => s.domain === BigFiveDomain.EXTROVERSAO)!;
        expect(extroversao.label).toBe('Extrovers\u00e3o');

        const abertura = scores.find(s => s.domain === BigFiveDomain.ABERTURA)!;
        expect(abertura.label).toBe('Abertura ao Novo');
        expect(abertura.description).toContain('curiosidade intelectual');

        const conscienciosidade = scores.find(s => s.domain === BigFiveDomain.CONSCIENCIOSIDADE)!;
        expect(conscienciosidade.label).toBe('Conscienciosidade');

        const amabilidade = scores.find(s => s.domain === BigFiveDomain.AMABILIDADE)!;
        expect(amabilidade.label).toBe('Amabilidade');

        const estabilidade = scores.find(s => s.domain === BigFiveDomain.ESTABILIDADE)!;
        expect(estabilidade.label).toBe('Estabilidade Emocional');
    });

    it('score values are rounded to 2 decimal places', () => {
        const answers = makeBigFiveAnswers(4);
        const scores = calculateBigFiveScores(answers);

        scores.forEach(score => {
            // Verify the score string representation has at most 2 decimal places
            const decimalParts = score.score.toString().split('.');
            if (decimalParts.length > 1) {
                expect(decimalParts[1].length).toBeLessThanOrEqual(2);
            }
        });
    });
});
