
import { IEAARawAnswers, IEAAResult, IEAADimensionScore, IEAADimension, IEAAProfile, IEAALevel } from '../types';
import { IEAA_ITEMS, IEAA_DIMENSIONS_INFO, IEAA_PROFILES_INFO, IEAA_LEVELS_INFO } from '../content/ieaa-items';

/**
 * Determines the IEAA level based on percentage score
 */
function getLevel(percentage: number): IEAALevel {
    if (percentage < 46) return IEAALevel.REATIVO;
    if (percentage <= 73) return IEAALevel.TRANSICAO;
    return IEAALevel.AUTORREGULADO;
}

/**
 * Calculates the score for a single dimension
 */
function calculateDimensionScore(answers: IEAARawAnswers, dimension: IEAADimension): IEAADimensionScore {
    const info = IEAA_DIMENSIONS_INFO[dimension];
    let sum = 0;
    let answeredCount = 0;

    info.items.forEach(itemId => {
        const value = answers[itemId];
        if (typeof value === 'number' && value >= 1 && value <= 5) {
            sum += value;
            answeredCount++;
        }
    });

    // If not all items answered, calculate based on answered items
    const maxPossible = info.maxScore;
    const percentage = maxPossible > 0 ? (sum / maxPossible) * 100 : 0;

    return {
        dimension,
        label: info.label,
        description: info.description,
        score: sum,
        maxPossible,
        percentage: Number(percentage.toFixed(1)),
        level: getLevel(percentage),
    };
}

/**
 * Determines the predominant profile based on dimension correlations
 */
function determineProfile(dimensions: IEAADimensionScore[]): IEAAProfile {
    const scoreMap: Record<IEAADimension, number> = {
        [IEAADimension.COGNITIVA]: 0,
        [IEAADimension.METACOGNITIVA]: 0,
        [IEAADimension.GESTAO_RECURSOS]: 0,
        [IEAADimension.MOTIVACIONAL]: 0,
    };

    dimensions.forEach(d => {
        scoreMap[d.dimension] = d.percentage;
    });

    // Count dimensions with low scores (below 50%)
    const lowDimensions = dimensions.filter(d => d.percentage < 50).length;

    // If 3 or more dimensions are low, classify as Vulnerable
    if (lowDimensions >= 3) {
        return IEAAProfile.VULNERAVEL;
    }

    // Calculate profile correlations
    // Executivo: Gestão + Cognitiva
    const executivoScore = (scoreMap[IEAADimension.GESTAO_RECURSOS] + scoreMap[IEAADimension.COGNITIVA]) / 2;

    // Cientista: Metacognitiva + Cognitiva
    const cientistaScore = (scoreMap[IEAADimension.METACOGNITIVA] + scoreMap[IEAADimension.COGNITIVA]) / 2;

    // Engajado: Motivacional + Gestão
    const engajadoScore = (scoreMap[IEAADimension.MOTIVACIONAL] + scoreMap[IEAADimension.GESTAO_RECURSOS]) / 2;

    // Find the highest scoring profile
    const profiles = [
        { profile: IEAAProfile.EXECUTIVO, score: executivoScore },
        { profile: IEAAProfile.CIENTISTA, score: cientistaScore },
        { profile: IEAAProfile.ENGAJADO, score: engajadoScore },
    ];

    profiles.sort((a, b) => b.score - a.score);

    // If best profile score is below 50%, mark as vulnerable
    if (profiles[0].score < 50) {
        return IEAAProfile.VULNERAVEL;
    }

    return profiles[0].profile;
}

/**
 * Calculates full IEAA result from raw answers
 */
export function calculateIEAAScores(answers: IEAARawAnswers): IEAAResult {
    // Calculate scores for each dimension
    const dimensions: IEAADimensionScore[] = Object.values(IEAADimension).map(dimension =>
        calculateDimensionScore(answers, dimension)
    );

    // Calculate total score
    const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);
    const totalMaxPossible = 250; // 12*5 + 12*5 + 12*5 + 14*5 = 60+60+60+70 = 250
    const totalPercentage = (totalScore / totalMaxPossible) * 100;

    // Determine overall level
    const overallLevel = getLevel(totalPercentage);

    // Determine profile
    const profile = determineProfile(dimensions);
    const profileInfo = IEAA_PROFILES_INFO[profile];
    const levelInfo = IEAA_LEVELS_INFO[overallLevel];

    return {
        dimensions,
        totalScore,
        totalMaxPossible,
        totalPercentage: Number(totalPercentage.toFixed(1)),
        overallLevel,
        profile,
        profileLabel: profileInfo.label,
        profileDescription: profileInfo.description,
        interventionRecommendation: profileInfo.interventionFocus,
    };
}

/**
 * Returns structured radar chart data for IEAA dimensions
 */
export function getIEAARadarData(dimensions: IEAADimensionScore[]) {
    return dimensions.map(d => ({
        dimension: d.label,
        score: d.percentage,
        fullMark: 100,
    }));
}

/**
 * Generates intervention suggestions based on dimension analysis
 */
export function getIEAAInterventions(result: IEAAResult): {
    priority: string;
    dimension: string;
    suggestions: string[];
}[] {
    const interventions: {
        priority: string;
        dimension: string;
        suggestions: string[];
    }[] = [];

    // Sort dimensions by percentage (ascending) to prioritize weakest areas
    const sortedDimensions = [...result.dimensions].sort((a, b) => a.percentage - b.percentage);

    sortedDimensions.forEach((dim, index) => {
        if (dim.percentage < 50) {
            const priority = index === 0 ? 'Alta' : index === 1 ? 'Média' : 'Baixa';

            let suggestions: string[] = [];

            switch (dim.dimension) {
                case IEAADimension.COGNITIVA:
                    suggestions = [
                        "Introduzir técnicas de elaboração ativa (mapas mentais, resumos, explicação)",
                        "Praticar a recuperação ativa através de auto-testes",
                        "Utilizar estratégias de conexão entre conteúdos",
                    ];
                    break;
                case IEAADimension.METACOGNITIVA:
                    suggestions = [
                        "Ensinar planejamento explícito de sessões de estudo",
                        "Implementar diários de reflexão sobre o aprendizado",
                        "Praticar automonitoramento com checklists de compreensão",
                    ];
                    break;
                case IEAADimension.GESTAO_RECURSOS:
                    suggestions = [
                        "Estabelecer rotina fixa de estudo com local adequado",
                        "Utilizar ferramentas de gestão de tempo (Pomodoro, agendas)",
                        "Identificar e eliminar distrações digitais",
                    ];
                    break;
                case IEAADimension.MOTIVACIONAL:
                    suggestions = [
                        "Estabelecer metas de curto prazo com recompensas",
                        "Conectar conteúdo a interesses pessoais e carreira",
                        "Trabalhar crenças de autoeficácia com histórico de sucessos",
                    ];
                    break;
            }

            interventions.push({
                priority,
                dimension: dim.label,
                suggestions,
            });
        }
    });

    return interventions;
}
