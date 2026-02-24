import {
    FamilySocioemotionalRawAnswers,
    FamilySocioemotionalResult,
    FamilySocioemotionalAxisScore,
    FamilySocioemotionalAxis,
    FamilySocioemotionalZone,
} from '../types';
import {
    FAMILY_SOCIOEMOTIONAL_ITEMS,
    FAMILY_SOCIOEMOTIONAL_AXES_INFO,
} from '../content/family-socioemotional-items';

const ZONE_LABELS: Record<FamilySocioemotionalZone, string> = {
    [FamilySocioemotionalZone.MAESTRIA]: 'Zona de Maestria',
    [FamilySocioemotionalZone.PROXIMAL]: 'Zona de Desenvolvimento Proximal',
    [FamilySocioemotionalZone.ATENCAO]: 'Zona de Atenção Pedagógica',
};

/**
 * Classifica a pontuação de um eixo em uma zona de intervenção.
 * 12-15: Maestria | 8-11: Proximal | 3-7: Atenção
 */
function classifyZone(score: number): FamilySocioemotionalZone {
    if (score >= 12) return FamilySocioemotionalZone.MAESTRIA;
    if (score >= 8) return FamilySocioemotionalZone.PROXIMAL;
    return FamilySocioemotionalZone.ATENCAO;
}

/**
 * Calcula os scores da Percepção Familiar a partir das respostas brutas.
 * Respostas são 0-indexed (0-4), mapeadas para escala 1-5 somando +1.
 */
export function calculateFamilySocioemotionalScores(
    answers: FamilySocioemotionalRawAnswers
): FamilySocioemotionalResult {
    const axes: FamilySocioemotionalAxisScore[] = Object.values(FamilySocioemotionalAxis).map(axis => {
        const info = FAMILY_SOCIOEMOTIONAL_AXES_INFO[axis];
        let sum = 0;

        info.itemIds.forEach(itemId => {
            const item = FAMILY_SOCIOEMOTIONAL_ITEMS.find(i => i.id === itemId);
            if (!item) return;

            const rawValue = answers[itemId];
            if (typeof rawValue !== 'number' || rawValue < 0 || rawValue > 4) return;

            // Map 0-4 to 1-5 for scoring
            sum += rawValue + 1;
        });

        const zone = classifyZone(sum);

        return {
            axis,
            label: info.label,
            description: info.description,
            score: sum,
            maxPossible: 15,
            zone,
            zoneLabel: ZONE_LABELS[zone],
            bigFiveDomain: info.bigFiveDomain,
        };
    });

    const totalScore = axes.reduce((sum, a) => sum + a.score, 0);
    const attentionAxes = axes.filter(a => a.zone === FamilySocioemotionalZone.ATENCAO);

    return {
        axes,
        totalScore,
        totalMaxPossible: 75,
        attentionAxes,
    };
}

/**
 * Returns radar chart data for the Percepção Familiar result.
 * Scores are normalized to 0-5 scale to match Big Five radar.
 */
export function getFamilySocioemotionalRadarData(result: FamilySocioemotionalResult) {
    return result.axes.map(a => ({
        subject: FAMILY_SOCIOEMOTIONAL_AXES_INFO[a.axis].label.split(' e ')[0], // Short label
        value: Number(((a.score / 15) * 5).toFixed(2)), // Normalize to 0-5 scale
        fullMark: 5,
        bigFiveDomain: a.bigFiveDomain,
    }));
}

/**
 * Returns intervention suggestions for axes in Zona de Atenção.
 */
export function getFamilySocioemotionalInterventions(
    result: FamilySocioemotionalResult
): { axis: string; zone: FamilySocioemotionalZone; suggestion: string }[] {
    const suggestionMap: Record<FamilySocioemotionalAxis, string> = {
        [FamilySocioemotionalAxis.AUTOGESTAO]: 'Implementar rotinas estruturadas com apoio visual (checklists), reforço positivo para conclusão de tarefas e técnicas de autorregulação como o método Pomodoro adaptado.',
        [FamilySocioemotionalAxis.RESILIENCIA]: 'Trabalhar regulação emocional com estratégias de respiração, nomear emoções e criar um "termômetro emocional". Modelar respostas adaptativas a frustrações.',
        [FamilySocioemotionalAxis.AMABILIDADE]: 'Estimular atividades cooperativas em família, leitura compartilhada de histórias com dilemas morais e práticas de escuta ativa.',
        [FamilySocioemotionalAxis.ENGAJAMENTO_SOCIAL]: 'Facilitar interações sociais em ambientes seguros, dramatização de situações sociais e programas de habilidades sociais (THS).',
        [FamilySocioemotionalAxis.ABERTURA]: 'Expor a novos estímulos culturais e intelectuais de forma gradual, incentivar o questionamento e a experimentação com reforço positivo.',
    };

    return result.axes
        .filter(a => a.zone === FamilySocioemotionalZone.ATENCAO || a.zone === FamilySocioemotionalZone.PROXIMAL)
        .map(a => ({
            axis: a.label,
            zone: a.zone,
            suggestion: suggestionMap[a.axis],
        }));
}
