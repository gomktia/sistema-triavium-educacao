import { describe, it, expect } from 'vitest';
import {
    calculateTierMigration,
    calculateGroupEfficacy,
    tierToNumber,
} from '@/lib/intervention-monitoring';

describe('tierToNumber', () => {
    it('maps TIER_1 to 1, TIER_2 to 2, TIER_3 to 3', () => {
        expect(tierToNumber('TIER_1')).toBe(1);
        expect(tierToNumber('TIER_2')).toBe(2);
        expect(tierToNumber('TIER_3')).toBe(3);
    });

    it('returns 0 for null/undefined', () => {
        expect(tierToNumber(null)).toBe(0);
        expect(tierToNumber(undefined)).toBe(0);
    });
});

describe('calculateTierMigration', () => {
    it('counts improved, unchanged, worsened for matching students', () => {
        const before = [
            { studentId: 'a', tier: 'TIER_3' },
            { studentId: 'b', tier: 'TIER_2' },
            { studentId: 'c', tier: 'TIER_1' },
            { studentId: 'd', tier: 'TIER_2' },
        ];
        const after = [
            { studentId: 'a', tier: 'TIER_2' },
            { studentId: 'b', tier: 'TIER_2' },
            { studentId: 'c', tier: 'TIER_2' },
            { studentId: 'd', tier: 'TIER_1' },
        ];
        const result = calculateTierMigration(before, after);
        expect(result.improved).toBe(2);
        expect(result.unchanged).toBe(1);
        expect(result.worsened).toBe(1);
        expect(result.total).toBe(4);
    });

    it('only counts students present in both sets', () => {
        const before = [
            { studentId: 'a', tier: 'TIER_3' },
            { studentId: 'b', tier: 'TIER_2' },
        ];
        const after = [
            { studentId: 'a', tier: 'TIER_1' },
            { studentId: 'c', tier: 'TIER_1' },
        ];
        const result = calculateTierMigration(before, after);
        expect(result.improved).toBe(1);
        expect(result.unchanged).toBe(0);
        expect(result.worsened).toBe(0);
        expect(result.total).toBe(1);
    });

    it('returns zeros for empty arrays', () => {
        const result = calculateTierMigration([], []);
        expect(result.improved).toBe(0);
        expect(result.unchanged).toBe(0);
        expect(result.worsened).toBe(0);
        expect(result.total).toBe(0);
    });
});

describe('calculateGroupEfficacy', () => {
    it('calculates percentage improved correctly', () => {
        const students = [
            { studentId: 'a', tierBefore: 'TIER_3', tierAfter: 'TIER_2' },
            { studentId: 'b', tierBefore: 'TIER_2', tierAfter: 'TIER_1' },
            { studentId: 'c', tierBefore: 'TIER_2', tierAfter: 'TIER_2' },
            { studentId: 'd', tierBefore: 'TIER_1', tierAfter: 'TIER_2' },
        ];
        const result = calculateGroupEfficacy(students);
        expect(result.improved).toBe(2);
        expect(result.unchanged).toBe(1);
        expect(result.worsened).toBe(1);
        expect(result.percentImproved).toBe(50);
        expect(result.percentUnchanged).toBe(25);
        expect(result.percentWorsened).toBe(25);
    });

    it('returns 0% for empty array', () => {
        const result = calculateGroupEfficacy([]);
        expect(result.improved).toBe(0);
        expect(result.percentImproved).toBe(0);
        expect(result.percentUnchanged).toBe(0);
        expect(result.percentWorsened).toBe(0);
    });

    it('returns 100% when all improved', () => {
        const students = [
            { studentId: 'a', tierBefore: 'TIER_3', tierAfter: 'TIER_1' },
            { studentId: 'b', tierBefore: 'TIER_2', tierAfter: 'TIER_1' },
        ];
        const result = calculateGroupEfficacy(students);
        expect(result.percentImproved).toBe(100);
        expect(result.percentWorsened).toBe(0);
        expect(result.percentUnchanged).toBe(0);
    });

    it('percentages always sum to 100', () => {
        const students = [
            { studentId: 'a', tierBefore: 'TIER_3', tierAfter: 'TIER_2' },
            { studentId: 'b', tierBefore: 'TIER_2', tierAfter: 'TIER_2' },
            { studentId: 'c', tierBefore: 'TIER_1', tierAfter: 'TIER_2' },
        ];
        const result = calculateGroupEfficacy(students);
        expect(result.percentImproved + result.percentUnchanged + result.percentWorsened).toBe(100);
    });
});
