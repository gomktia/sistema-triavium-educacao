import { describe, it, expect } from 'vitest';
import {
    generateEvolutionNarrative,
    getHomeSuggestions,
} from '@/lib/report/family-report-helpers';
import type { EvolutionDataPoint } from '@/lib/report/family-report-helpers';
import { CharacterStrength } from '@core/types';

// ============================================================
// generateEvolutionNarrative
// ============================================================

describe('generateEvolutionNarrative', () => {
    it('retorna string vazia para array vazio', () => {
        const result = generateEvolutionNarrative([]);

        expect(result).toBe('');
    });

    it('retorna mensagem de primeira avaliacao para janela unica', () => {
        const data: EvolutionDataPoint[] = [
            { window: 'Diagnóstica (Março)', externalizing: 5, internalizing: 3 },
        ];

        const result = generateEvolutionNarrative(data);

        expect(result).toContain('primeira avaliação');
        expect(result).toContain('Diagnóstica (Março)');
        expect(result).toContain('referência');
    });

    it('retorna mensagem de melhoria significativa quando diff <= -3', () => {
        const data: EvolutionDataPoint[] = [
            { window: 'Diagnóstica', externalizing: 8, internalizing: 6 },
            { window: 'Monitoramento', externalizing: 4, internalizing: 3 },
        ];
        // First total = 14, Last total = 7, diff = -7

        const result = generateEvolutionNarrative(data);

        expect(result).toContain('melhoria significativa');
    });

    it('retorna mensagem de melhoria gradual quando diff < 0 e diff > -3', () => {
        const data: EvolutionDataPoint[] = [
            { window: 'Diagnóstica', externalizing: 5, internalizing: 4 },
            { window: 'Monitoramento', externalizing: 4, internalizing: 3 },
        ];
        // First total = 9, Last total = 7, diff = -2

        const result = generateEvolutionNarrative(data);

        expect(result).toContain('melhoria gradual');
    });

    it('retorna mensagem de estabilidade quando diff === 0', () => {
        const data: EvolutionDataPoint[] = [
            { window: 'Diagnóstica', externalizing: 5, internalizing: 3 },
            { window: 'Monitoramento', externalizing: 5, internalizing: 3 },
        ];
        // First total = 8, Last total = 8, diff = 0

        const result = generateEvolutionNarrative(data);

        expect(result).toContain('manteve-se estável');
    });

    it('retorna mensagem de atencao quando diff > 0 e diff <= 3', () => {
        const data: EvolutionDataPoint[] = [
            { window: 'Diagnóstica', externalizing: 4, internalizing: 3 },
            { window: 'Monitoramento', externalizing: 5, internalizing: 4 },
        ];
        // First total = 7, Last total = 9, diff = 2

        const result = generateEvolutionNarrative(data);

        expect(result).toContain('áreas que merecem atenção');
    });

    it('retorna mensagem de atencao especial quando diff > 3', () => {
        const data: EvolutionDataPoint[] = [
            { window: 'Diagnóstica', externalizing: 3, internalizing: 2 },
            { window: 'Monitoramento', externalizing: 7, internalizing: 5 },
        ];
        // First total = 5, Last total = 12, diff = 7

        const result = generateEvolutionNarrative(data);

        expect(result).toContain('atenção especial');
    });

    it('compara primeira e ultima janela em trajetoria com tres pontos', () => {
        const data: EvolutionDataPoint[] = [
            { window: 'Diagnóstica', externalizing: 8, internalizing: 6 },
            { window: 'Monitoramento', externalizing: 6, internalizing: 4 },
            { window: 'Final', externalizing: 3, internalizing: 2 },
        ];
        // First total = 14, Last total = 5, diff = -9

        const result = generateEvolutionNarrative(data);

        expect(result).toContain('melhoria significativa');
        expect(result).toContain('Diagnóstica');
        expect(result).toContain('Final');
    });

    it('nao contem jargao tecnico ou scores de risco', () => {
        const data: EvolutionDataPoint[] = [
            { window: 'Diagnóstica', externalizing: 8, internalizing: 6 },
            { window: 'Final', externalizing: 3, internalizing: 2 },
        ];

        const result = generateEvolutionNarrative(data);

        expect(result).not.toMatch(/tier/i);
        expect(result).not.toMatch(/risk/i);
        expect(result).not.toMatch(/score/i);
        expect(result).not.toMatch(/externaliz/i);
        expect(result).not.toMatch(/internaliz/i);
    });
});

// ============================================================
// getHomeSuggestions
// ============================================================

describe('getHomeSuggestions', () => {
    it('retorna sugestoes para forcas informadas', () => {
        const strengths = [
            { strength: CharacterStrength.CRIATIVIDADE, label: 'Criatividade' },
            { strength: CharacterStrength.GRATIDAO, label: 'Gratidao' },
        ];

        const result = getHomeSuggestions(strengths);

        expect(result).toHaveLength(2);
        expect(result[0].strengthLabel).toBe('Criatividade');
        expect(result[0].activities.length).toBeGreaterThanOrEqual(2);
        expect(result[1].strengthLabel).toBe('Gratidao');
        expect(result[1].activities.length).toBeGreaterThanOrEqual(2);

        result.forEach((suggestion) => {
            suggestion.activities.forEach((activity) => {
                expect(typeof activity).toBe('string');
                expect(activity.length).toBeGreaterThan(0);
            });
        });
    });

    it('retorna array vazio para entrada vazia', () => {
        const result = getHomeSuggestions([]);

        expect(result).toEqual([]);
    });

    it('fornece atividades de fallback para forcas desconhecidas', () => {
        const strengths = [
            { strength: 'FORCA_INVENTADA' as CharacterStrength, label: 'Forca Inventada' },
        ];

        const result = getHomeSuggestions(strengths);

        expect(result).toHaveLength(1);
        expect(result[0].strengthLabel).toBe('Forca Inventada');
        expect(result[0].activities.length).toBeGreaterThanOrEqual(2);
    });

    it('cobre todas as 24 forcas do CharacterStrength', () => {
        const allStrengths = Object.values(CharacterStrength).map((s) => ({
            strength: s,
            label: s,
        }));

        const result = getHomeSuggestions(allStrengths);

        expect(result).toHaveLength(24);
        result.forEach((suggestion) => {
            expect(suggestion.activities.length).toBeGreaterThanOrEqual(2);
        });
    });
});
