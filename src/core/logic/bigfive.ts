
import { BigFiveRawAnswers, BigFiveScore, BigFiveDomain } from '../types';
import { BIG_FIVE_ITEMS, BIG_FIVE_DOMAINS_INFO } from '../content/bigfive-items';

export function calculateBigFiveScores(answers: BigFiveRawAnswers): BigFiveScore[] {
    const scores: Record<BigFiveDomain, { sum: number, count: number }> = {
        [BigFiveDomain.ABERTURA]: { sum: 0, count: 0 },
        [BigFiveDomain.CONSCIENCIOSIDADE]: { sum: 0, count: 0 },
        [BigFiveDomain.ESTABILIDADE]: { sum: 0, count: 0 },
        [BigFiveDomain.EXTROVERSAO]: { sum: 0, count: 0 },
        [BigFiveDomain.AMABILIDADE]: { sum: 0, count: 0 },
    };

    BIG_FIVE_ITEMS.forEach(item => {
        const rawValue = answers[item.id];
        // Ensure rawValue is valid (1-5) and present
        if (typeof rawValue === 'number' && rawValue >= 1 && rawValue <= 5) {
            // Apply inversion logic
            const finalValue = item.reversed ? (6 - rawValue) : rawValue;
            scores[item.domain].sum += finalValue;
            scores[item.domain].count += 1;
        }
    });

    return Object.values(BigFiveDomain).map(domain => {
        const data = scores[domain];
        const count = data.count > 0 ? data.count : 1;
        const avg = data.sum / count;
        const info = BIG_FIVE_DOMAINS_INFO[domain];

        let level: 'Baixo' | 'Médio' | 'Alto' = 'Médio';
        if (avg < 3.0) level = 'Baixo';
        else if (avg >= 4.0) level = 'Alto';

        return {
            domain,
            score: Number(avg.toFixed(2)),
            label: info.label,
            description: info.description,
            level
        };
    });
}
