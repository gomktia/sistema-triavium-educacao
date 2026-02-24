import {
    SDQRawAnswers,
    SDQResult,
    SDQSubscale,
    SDQSubscaleScore,
    SDQBand,
    SDQVersion,
} from '../types';
import {
    SDQ_ITEMS,
    SDQ_SUBSCALES_INFO,
    SDQ_CUTOFFS,
    SDQ_BAND_LABELS,
} from '../content/sdq-items';

/**
 * Classifies a score into Normal/Borderline/Abnormal based on cutoff ranges.
 */
function classifyBand(
    score: number,
    cutoffs: Record<SDQBand, { min: number; max: number }>
): SDQBand {
    if (score >= cutoffs[SDQBand.NORMAL].min && score <= cutoffs[SDQBand.NORMAL].max) {
        return SDQBand.NORMAL;
    }
    if (score >= cutoffs[SDQBand.BORDERLINE].min && score <= cutoffs[SDQBand.BORDERLINE].max) {
        return SDQBand.BORDERLINE;
    }
    return SDQBand.ABNORMAL;
}

/**
 * Calculates SDQ scores from raw answers.
 * @param answers - Raw answers (item number → 0-2)
 * @param version - TEACHER or PARENT (affects cutoff bands)
 */
export function calculateSDQScores(
    answers: SDQRawAnswers,
    version: SDQVersion
): SDQResult {
    const versionCutoffs = SDQ_CUTOFFS[version];

    // Calculate per-subscale scores
    const subscaleScores: SDQSubscaleScore[] = Object.values(SDQSubscale).map(subscale => {
        const info = SDQ_SUBSCALES_INFO[subscale];
        let sum = 0;

        info.itemIds.forEach(itemId => {
            const item = SDQ_ITEMS.find(i => i.id === itemId);
            if (!item) return;

            const rawValue = answers[itemId];
            if (typeof rawValue !== 'number' || rawValue < 0 || rawValue > 2) return;

            // Reverse scoring: 2 - rawValue
            const finalValue = item.reversed ? (2 - rawValue) : rawValue;
            sum += finalValue;
        });

        const cutoffs = versionCutoffs[subscale];
        const band = classifyBand(sum, cutoffs);

        return {
            subscale,
            label: info.label,
            score: sum,
            maxPossible: 10,
            band,
            bandLabel: SDQ_BAND_LABELS[band],
        };
    });

    // Total Difficulties = sum of 4 non-prosocial subscales
    const difficultySubscales = [
        SDQSubscale.EMOTIONAL,
        SDQSubscale.CONDUCT,
        SDQSubscale.HYPERACTIVITY,
        SDQSubscale.PEER,
    ];
    const totalDifficulties = subscaleScores
        .filter(s => difficultySubscales.includes(s.subscale))
        .reduce((sum, s) => sum + s.score, 0);

    const totalBand = classifyBand(totalDifficulties, versionCutoffs.TOTAL);

    const prosocialResult = subscaleScores.find(s => s.subscale === SDQSubscale.PROSOCIAL)!;

    return {
        version,
        subscales: subscaleScores,
        totalDifficulties,
        totalDifficultiesBand: totalBand,
        totalDifficultiesBandLabel: SDQ_BAND_LABELS[totalBand],
        prosocialScore: prosocialResult.score,
        prosocialBand: prosocialResult.band,
        prosocialBandLabel: prosocialResult.bandLabel,
    };
}

/**
 * Returns radar chart data for SDQ results.
 */
export function getSDQRadarData(result: SDQResult) {
    return result.subscales.map(s => ({
        subject: s.label,
        value: s.score,
        fullMark: s.maxPossible,
    }));
}

/**
 * Returns intervention suggestions for abnormal/borderline areas.
 */
export function getSDQInterventions(result: SDQResult): { area: string; band: SDQBand; suggestion: string }[] {
    const interventions: { area: string; band: SDQBand; suggestion: string }[] = [];

    const suggestionMap: Record<SDQSubscale, string> = {
        [SDQSubscale.EMOTIONAL]: 'Considerar acompanhamento para ansiedade/sintomas emocionais. Técnicas de regulação emocional e apoio socioemocional podem ser benéficas.',
        [SDQSubscale.CONDUCT]: 'Estratégias de manejo comportamental são recomendadas. Reforço positivo para comportamentos pró-sociais e limites consistentes.',
        [SDQSubscale.HYPERACTIVITY]: 'Implementar estratégias de organização e foco. Pausas regulares, atividades estruturadas e suporte para atenção.',
        [SDQSubscale.PEER]: 'Facilitar interações sociais positivas. Programas de habilidades sociais e mediação de conflitos podem ajudar.',
        [SDQSubscale.PROSOCIAL]: 'Estimular empatia e cooperação. Atividades em grupo e modelos de comportamento pró-social são recomendados.',
    };

    result.subscales.forEach(s => {
        if (s.band === SDQBand.ABNORMAL || s.band === SDQBand.BORDERLINE) {
            interventions.push({
                area: s.label,
                band: s.band,
                suggestion: suggestionMap[s.subscale],
            });
        }
    });

    return interventions;
}
