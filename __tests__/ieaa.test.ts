import { describe, it, expect } from 'vitest';
import { calculateIEAAScores, getIEAARadarData, getIEAAInterventions } from '@core/logic/ieaa';
import { IEAADimension, IEAALevel, IEAAProfile, IEAARawAnswers } from '@core/types';

// ============================================================
// HELPERS
// ============================================================

/** Generates IEAA answers (50 items) with a single default value (1-5) */
function makeIEAAAnswers(defaultValue: number): IEAARawAnswers {
    const answers: IEAARawAnswers = {};
    for (let i = 1; i <= 50; i++) {
        answers[i] = defaultValue;
    }
    return answers;
}

/**
 * Creates answers with specific values per dimension.
 * cogValue for items 1-12, metaValue for 13-24,
 * gestaoValue for 25-36, motivValue for 37-50.
 */
function makeIEAAAnswersByDimension(
    cogValue: number,
    metaValue: number,
    gestaoValue: number,
    motivValue: number
): IEAARawAnswers {
    const answers: IEAARawAnswers = {};
    for (let i = 1; i <= 12; i++) answers[i] = cogValue;
    for (let i = 13; i <= 24; i++) answers[i] = metaValue;
    for (let i = 25; i <= 36; i++) answers[i] = gestaoValue;
    for (let i = 37; i <= 50; i++) answers[i] = motivValue;
    return answers;
}

// ============================================================
// TESTS
// ============================================================

describe('calculateIEAAScores', () => {
    it('returns a complete result object with all required properties', () => {
        const answers = makeIEAAAnswers(3);
        const result = calculateIEAAScores(answers);

        expect(result).toHaveProperty('dimensions');
        expect(result).toHaveProperty('totalScore');
        expect(result).toHaveProperty('totalMaxPossible');
        expect(result).toHaveProperty('totalPercentage');
        expect(result).toHaveProperty('overallLevel');
        expect(result).toHaveProperty('profile');
        expect(result).toHaveProperty('profileLabel');
        expect(result).toHaveProperty('profileDescription');
        expect(result).toHaveProperty('interventionRecommendation');

        expect(result.dimensions).toHaveLength(4);
        expect(result.totalMaxPossible).toBe(250);
    });

    it('each dimension has correct structure and labels', () => {
        const answers = makeIEAAAnswers(3);
        const result = calculateIEAAScores(answers);

        const dimensionEnums = Object.values(IEAADimension);
        result.dimensions.forEach(dim => {
            expect(dimensionEnums).toContain(dim.dimension);
            expect(typeof dim.label).toBe('string');
            expect(typeof dim.description).toBe('string');
            expect(typeof dim.score).toBe('number');
            expect(typeof dim.maxPossible).toBe('number');
            expect(typeof dim.percentage).toBe('number');
            expect(Object.values(IEAALevel)).toContain(dim.level);
        });
    });

    it('maximum answers (all 5) produce AUTORREGULADO level and 100% percentage', () => {
        const answers = makeIEAAAnswers(5);
        const result = calculateIEAAScores(answers);

        // Total score = 50 * 5 = 250, max = 250, percentage = 100%
        expect(result.totalScore).toBe(250);
        expect(result.totalPercentage).toBe(100);
        expect(result.overallLevel).toBe(IEAALevel.AUTORREGULADO);

        // Each dimension should be at 100%
        result.dimensions.forEach(dim => {
            expect(dim.percentage).toBe(100);
            expect(dim.level).toBe(IEAALevel.AUTORREGULADO);
        });
    });

    it('minimum answers (all 1) produce REATIVO level', () => {
        const answers = makeIEAAAnswers(1);
        const result = calculateIEAAScores(answers);

        // Total score = 50 * 1 = 50, max = 250, percentage = 20%
        expect(result.totalScore).toBe(50);
        expect(result.totalPercentage).toBe(20);
        expect(result.overallLevel).toBe(IEAALevel.REATIVO);

        // Each dimension should be REATIVO
        result.dimensions.forEach(dim => {
            expect(dim.level).toBe(IEAALevel.REATIVO);
        });
    });

    it('correctly calculates per-dimension scores and maxPossible', () => {
        const answers = makeIEAAAnswers(3);
        const result = calculateIEAAScores(answers);

        // COGNITIVA: 12 items * 3 = 36, max = 60
        const cognitiva = result.dimensions.find(d => d.dimension === IEAADimension.COGNITIVA)!;
        expect(cognitiva.score).toBe(36);
        expect(cognitiva.maxPossible).toBe(60);
        expect(cognitiva.percentage).toBe(60); // 36/60 * 100 = 60%

        // METACOGNITIVA: 12 items * 3 = 36, max = 60
        const metacognitiva = result.dimensions.find(d => d.dimension === IEAADimension.METACOGNITIVA)!;
        expect(metacognitiva.score).toBe(36);
        expect(metacognitiva.maxPossible).toBe(60);

        // GESTAO_RECURSOS: 12 items * 3 = 36, max = 60
        const gestao = result.dimensions.find(d => d.dimension === IEAADimension.GESTAO_RECURSOS)!;
        expect(gestao.score).toBe(36);
        expect(gestao.maxPossible).toBe(60);

        // MOTIVACIONAL: 14 items * 3 = 42, max = 70
        const motivacional = result.dimensions.find(d => d.dimension === IEAADimension.MOTIVACIONAL)!;
        expect(motivacional.score).toBe(42);
        expect(motivacional.maxPossible).toBe(70);
    });

    it('level boundaries: <46% = REATIVO, 46-73% = TRANSICAO, >73% = AUTORREGULADO', () => {
        // Test REATIVO: all answers = 2 => total = 100/250 = 40% < 46%
        const reativoResult = calculateIEAAScores(makeIEAAAnswers(2));
        expect(reativoResult.totalPercentage).toBe(40);
        expect(reativoResult.overallLevel).toBe(IEAALevel.REATIVO);

        // Test TRANSICAO: all answers = 3 => total = 150/250 = 60%, between 46-73%
        const transicaoResult = calculateIEAAScores(makeIEAAAnswers(3));
        expect(transicaoResult.totalPercentage).toBe(60);
        expect(transicaoResult.overallLevel).toBe(IEAALevel.TRANSICAO);

        // Test AUTORREGULADO: all answers = 4 => total = 200/250 = 80% > 73%
        const autorreguladoResult = calculateIEAAScores(makeIEAAAnswers(4));
        expect(autorreguladoResult.totalPercentage).toBe(80);
        expect(autorreguladoResult.overallLevel).toBe(IEAALevel.AUTORREGULADO);
    });

    it('profile is VULNERAVEL when 3+ dimensions are below 50%', () => {
        // Set 3 dimensions low (value=2 => 40%) and 1 high (value=5 => 100%)
        const answers = makeIEAAAnswersByDimension(2, 2, 2, 5);
        const result = calculateIEAAScores(answers);

        // COGNITIVA: 24/60 = 40% < 50%
        // METACOGNITIVA: 24/60 = 40% < 50%
        // GESTAO_RECURSOS: 24/60 = 40% < 50%
        // MOTIVACIONAL: 70/70 = 100%
        // 3 dimensions below 50% => VULNERAVEL
        expect(result.profile).toBe(IEAAProfile.VULNERAVEL);
    });

    it('profile is EXECUTIVO when Gestao + Cognitiva are the highest pair', () => {
        // EXECUTIVO = high GESTAO_RECURSOS + COGNITIVA
        // Set GESTAO and COGNITIVA high, others moderate
        const answers = makeIEAAAnswersByDimension(5, 3, 5, 3);
        const result = calculateIEAAScores(answers);

        // COGNITIVA: 60/60 = 100%
        // METACOGNITIVA: 36/60 = 60%
        // GESTAO_RECURSOS: 60/60 = 100%
        // MOTIVACIONAL: 42/70 = 60%
        // executivoScore = (100 + 100) / 2 = 100
        // cientistaScore = (60 + 100) / 2 = 80
        // engajadoScore = (60 + 100) / 2 = 80
        // Highest is EXECUTIVO
        expect(result.profile).toBe(IEAAProfile.EXECUTIVO);
    });

    it('profile is CIENTISTA when Metacognitiva + Cognitiva are the highest pair', () => {
        // CIENTISTA = high METACOGNITIVA + COGNITIVA
        const answers = makeIEAAAnswersByDimension(5, 5, 3, 3);
        const result = calculateIEAAScores(answers);

        // COGNITIVA: 60/60 = 100%
        // METACOGNITIVA: 60/60 = 100%
        // GESTAO_RECURSOS: 36/60 = 60%
        // MOTIVACIONAL: 42/70 = 60%
        // executivoScore = (60 + 100) / 2 = 80
        // cientistaScore = (100 + 100) / 2 = 100
        // engajadoScore = (60 + 60) / 2 = 60
        // Highest is CIENTISTA
        expect(result.profile).toBe(IEAAProfile.CIENTISTA);
    });

    it('profile is ENGAJADO when Motivacional + Gestao are the highest pair', () => {
        // ENGAJADO = high MOTIVACIONAL + GESTAO_RECURSOS
        const answers = makeIEAAAnswersByDimension(3, 3, 5, 5);
        const result = calculateIEAAScores(answers);

        // COGNITIVA: 36/60 = 60%
        // METACOGNITIVA: 36/60 = 60%
        // GESTAO_RECURSOS: 60/60 = 100%
        // MOTIVACIONAL: 70/70 = 100%
        // executivoScore = (100 + 60) / 2 = 80
        // cientistaScore = (60 + 60) / 2 = 60
        // engajadoScore = (100 + 100) / 2 = 100
        // Highest is ENGAJADO
        expect(result.profile).toBe(IEAAProfile.ENGAJADO);
    });

    it('handles empty answers gracefully (all dimensions score 0)', () => {
        const answers: IEAARawAnswers = {};
        const result = calculateIEAAScores(answers);

        expect(result.totalScore).toBe(0);
        expect(result.totalPercentage).toBe(0);
        expect(result.overallLevel).toBe(IEAALevel.REATIVO);
        expect(result.profile).toBe(IEAAProfile.VULNERAVEL);

        result.dimensions.forEach(dim => {
            expect(dim.score).toBe(0);
            expect(dim.percentage).toBe(0);
        });
    });

    it('profileLabel and profileDescription are non-empty strings', () => {
        const answers = makeIEAAAnswers(3);
        const result = calculateIEAAScores(answers);

        expect(result.profileLabel.length).toBeGreaterThan(0);
        expect(result.profileDescription.length).toBeGreaterThan(0);
        expect(result.interventionRecommendation.length).toBeGreaterThan(0);
    });
});

describe('getIEAARadarData', () => {
    it('returns radar data with correct structure for all dimensions', () => {
        const answers = makeIEAAAnswers(4);
        const result = calculateIEAAScores(answers);
        const radarData = getIEAARadarData(result.dimensions);

        expect(radarData).toHaveLength(4);
        radarData.forEach(point => {
            expect(point).toHaveProperty('dimension');
            expect(point).toHaveProperty('score');
            expect(point).toHaveProperty('fullMark');
            expect(point.fullMark).toBe(100);
            expect(typeof point.score).toBe('number');
            expect(typeof point.dimension).toBe('string');
        });
    });
});

describe('getIEAAInterventions', () => {
    it('returns interventions for dimensions below 50%', () => {
        // Set COGNITIVA low (2 => 40%), others moderate
        const answers = makeIEAAAnswersByDimension(2, 4, 4, 4);
        const result = calculateIEAAScores(answers);
        const interventions = getIEAAInterventions(result);

        // Only COGNITIVA is below 50%
        expect(interventions.length).toBeGreaterThanOrEqual(1);
        expect(interventions[0].suggestions.length).toBeGreaterThan(0);
    });

    it('returns no interventions when all dimensions are above 50%', () => {
        const answers = makeIEAAAnswers(4); // All at 80%
        const result = calculateIEAAScores(answers);
        const interventions = getIEAAInterventions(result);

        expect(interventions).toHaveLength(0);
    });
});
