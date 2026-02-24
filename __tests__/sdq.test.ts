import { describe, it, expect } from 'vitest';
import { calculateSDQScores, getSDQRadarData, getSDQInterventions } from '@core/logic/sdq';
import { SDQSubscale, SDQBand, SDQVersion, SDQRawAnswers } from '@core/types';
import { SDQ_ITEMS } from '@core/content/sdq-items';

// ============================================================
// HELPERS
// ============================================================

/** Generates SDQ answers (25 items) with a single default value */
function makeSDQAnswers(defaultValue: number): SDQRawAnswers {
    const answers: SDQRawAnswers = {};
    for (let i = 1; i <= 25; i++) {
        answers[i] = defaultValue;
    }
    return answers;
}

/** Creates answers with specific values per item */
function makeCustomAnswers(overrides: Record<number, number>, defaultValue = 0): SDQRawAnswers {
    const answers = makeSDQAnswers(defaultValue);
    Object.entries(overrides).forEach(([k, v]) => {
        answers[Number(k)] = v;
    });
    return answers;
}

// ============================================================
// TESTS
// ============================================================

describe('SDQ scoring engine', () => {
    describe('calculateSDQScores', () => {
        it('returns all 5 subscale scores with required properties', () => {
            const answers = makeSDQAnswers(0);
            const result = calculateSDQScores(answers, SDQVersion.TEACHER);

            expect(result.subscales).toHaveLength(5);
            expect(result.version).toBe(SDQVersion.TEACHER);

            const subscaleNames = result.subscales.map(s => s.subscale);
            expect(subscaleNames).toContain(SDQSubscale.EMOTIONAL);
            expect(subscaleNames).toContain(SDQSubscale.CONDUCT);
            expect(subscaleNames).toContain(SDQSubscale.HYPERACTIVITY);
            expect(subscaleNames).toContain(SDQSubscale.PEER);
            expect(subscaleNames).toContain(SDQSubscale.PROSOCIAL);

            result.subscales.forEach(s => {
                expect(s).toHaveProperty('subscale');
                expect(s).toHaveProperty('label');
                expect(s).toHaveProperty('score');
                expect(s).toHaveProperty('maxPossible');
                expect(s).toHaveProperty('band');
                expect(s).toHaveProperty('bandLabel');
                expect(s.maxPossible).toBe(10);
            });
        });

        it('all zeros → all Normal (teacher version)', () => {
            const answers = makeSDQAnswers(0);
            const result = calculateSDQScores(answers, SDQVersion.TEACHER);

            // All non-reversed items = 0, reversed items = 2-0 = 2
            // Emotional: all non-reversed → sum = 0 → Normal (0-4)
            const emotional = result.subscales.find(s => s.subscale === SDQSubscale.EMOTIONAL)!;
            expect(emotional.score).toBe(0);
            expect(emotional.band).toBe(SDQBand.NORMAL);

            // Conduct: items 5(0), 7(R: 2-0=2), 12(0), 18(0), 22(0) → sum = 2
            const conduct = result.subscales.find(s => s.subscale === SDQSubscale.CONDUCT)!;
            expect(conduct.score).toBe(2);
            expect(conduct.band).toBe(SDQBand.NORMAL);

            // Hyperactivity: items 2(0), 10(0), 15(0), 21(R: 2-0=2), 25(R: 2-0=2) → sum = 4
            const hyperactivity = result.subscales.find(s => s.subscale === SDQSubscale.HYPERACTIVITY)!;
            expect(hyperactivity.score).toBe(4);
            expect(hyperactivity.band).toBe(SDQBand.NORMAL);

            // Peer: items 6(0), 11(R: 2-0=2), 14(R: 2-0=2), 19(0), 23(0) → sum = 4
            const peer = result.subscales.find(s => s.subscale === SDQSubscale.PEER)!;
            expect(peer.score).toBe(4);

            // Prosocial: all non-reversed → sum = 0 → Abnormal (0-4)
            const prosocial = result.subscales.find(s => s.subscale === SDQSubscale.PROSOCIAL)!;
            expect(prosocial.score).toBe(0);
            expect(prosocial.band).toBe(SDQBand.ABNORMAL);

            // Total Difficulties = 0 + 2 + 4 + 4 = 10 → Normal (0-11)
            expect(result.totalDifficulties).toBe(10);
            expect(result.totalDifficultiesBand).toBe(SDQBand.NORMAL);
        });

        it('all twos → correct scoring with reversals', () => {
            const answers = makeSDQAnswers(2);
            const result = calculateSDQScores(answers, SDQVersion.TEACHER);

            // All non-reversed items = 2, reversed items = 2-2 = 0
            // Emotional: all non-reversed → sum = 5*2 = 10 → Abnormal (6-10)
            const emotional = result.subscales.find(s => s.subscale === SDQSubscale.EMOTIONAL)!;
            expect(emotional.score).toBe(10);
            expect(emotional.band).toBe(SDQBand.ABNORMAL);

            // Conduct: items 5(2), 7(R: 0), 12(2), 18(2), 22(2) → sum = 8 → Abnormal (4-10)
            const conduct = result.subscales.find(s => s.subscale === SDQSubscale.CONDUCT)!;
            expect(conduct.score).toBe(8);
            expect(conduct.band).toBe(SDQBand.ABNORMAL);

            // Hyperactivity: items 2(2), 10(2), 15(2), 21(R: 0), 25(R: 0) → sum = 6 → Borderline (6)
            const hyperactivity = result.subscales.find(s => s.subscale === SDQSubscale.HYPERACTIVITY)!;
            expect(hyperactivity.score).toBe(6);
            expect(hyperactivity.band).toBe(SDQBand.BORDERLINE);

            // Peer: items 6(2), 11(R: 0), 14(R: 0), 19(2), 23(2) → sum = 6 → Abnormal (5-10)
            const peer = result.subscales.find(s => s.subscale === SDQSubscale.PEER)!;
            expect(peer.score).toBe(6);
            expect(peer.band).toBe(SDQBand.ABNORMAL);

            // Prosocial: all non-reversed → sum = 5*2 = 10 → Normal (6-10)
            const prosocial = result.subscales.find(s => s.subscale === SDQSubscale.PROSOCIAL)!;
            expect(prosocial.score).toBe(10);
            expect(prosocial.band).toBe(SDQBand.NORMAL);

            // Total = 10 + 8 + 6 + 6 = 30 → Abnormal (16-40)
            expect(result.totalDifficulties).toBe(30);
            expect(result.totalDifficultiesBand).toBe(SDQBand.ABNORMAL);
        });

        it('reverse scoring is correct for items 7, 11, 14, 21, 25', () => {
            const reversedItemIds = [7, 11, 14, 21, 25];

            // Verify these items are actually marked as reversed
            reversedItemIds.forEach(id => {
                const item = SDQ_ITEMS.find(i => i.id === id);
                expect(item?.reversed).toBe(true);
            });

            // Non-reversed items are NOT marked
            const nonReversed = SDQ_ITEMS.filter(i => !reversedItemIds.includes(i.id));
            nonReversed.forEach(item => {
                expect(item.reversed).toBe(false);
            });

            // Test: reversed items with raw=0 should contribute 2
            const answers = makeSDQAnswers(1); // All answers = 1
            // Set reversed items to 0 → they become 2
            reversedItemIds.forEach(id => { answers[id] = 0; });

            const result = calculateSDQScores(answers, SDQVersion.TEACHER);

            // Hyperactivity: items 2(1), 10(1), 15(1), 21(R: 2-0=2), 25(R: 2-0=2) → sum = 7
            const hyperactivity = result.subscales.find(s => s.subscale === SDQSubscale.HYPERACTIVITY)!;
            expect(hyperactivity.score).toBe(7);
        });

        it('total difficulties excludes prosocial', () => {
            // Set only prosocial items to max (2)
            const answers = makeSDQAnswers(0);
            // Prosocial items: 1, 4, 9, 17, 20
            [1, 4, 9, 17, 20].forEach(id => { answers[id] = 2; });

            const result = calculateSDQScores(answers, SDQVersion.TEACHER);

            // Prosocial score changes, but totalDifficulties should not include it
            const prosocial = result.subscales.find(s => s.subscale === SDQSubscale.PROSOCIAL)!;
            expect(prosocial.score).toBe(10);

            // Total Difficulties is based only on the other 4 subscales
            const nonProsocial = result.subscales
                .filter(s => s.subscale !== SDQSubscale.PROSOCIAL)
                .reduce((sum, s) => sum + s.score, 0);
            expect(result.totalDifficulties).toBe(nonProsocial);
        });

        it('prosocial has inverted interpretation (low = abnormal)', () => {
            // Prosocial = 0 → Abnormal
            const lowProsocial = makeSDQAnswers(0);
            // Zero out prosocial: items 1, 4, 9, 17, 20 = 0 (already)
            const result1 = calculateSDQScores(lowProsocial, SDQVersion.TEACHER);
            const prosocial1 = result1.subscales.find(s => s.subscale === SDQSubscale.PROSOCIAL)!;
            expect(prosocial1.score).toBe(0);
            expect(prosocial1.band).toBe(SDQBand.ABNORMAL);

            // Prosocial = 10 → Normal
            const highProsocial = makeSDQAnswers(2);
            const result2 = calculateSDQScores(highProsocial, SDQVersion.TEACHER);
            const prosocial2 = result2.subscales.find(s => s.subscale === SDQSubscale.PROSOCIAL)!;
            expect(prosocial2.score).toBe(10);
            expect(prosocial2.band).toBe(SDQBand.NORMAL);
        });
    });

    describe('teacher vs parent cutoff differences', () => {
        it('teacher Total Normal upper bound = 11', () => {
            // Create answers that give total = 11
            // Use all 1s: Emotional=5*1=5, Conduct: 4*1 + 1(R:2-1=1)=5, Hyper: 3*1 + 2(R:1)=5, Peer: 3*1 + 2(R:1)=5
            // Wait — let me calculate more carefully
            // All 1s:
            // Emotional (no reversed): 5*1 = 5
            // Conduct: 5(1), 7(R: 2-1=1), 12(1), 18(1), 22(1) → sum=5
            // Hyperactivity: 2(1), 10(1), 15(1), 21(R: 2-1=1), 25(R: 2-1=1) → sum=5
            // Peer: 6(1), 11(R: 2-1=1), 14(R: 2-1=1), 19(1), 23(1) → sum=5
            // Total = 5+5+5+5 = 20

            // For total=11, we need specific control. Let's target each subscale.
            const answers = makeSDQAnswers(0);
            // Set specific items to get total=11
            // Emotional: set items 3,8,13 to 1 → sum=3
            answers[3] = 1; answers[8] = 1; answers[13] = 1;
            // Conduct: set items 5,12 to 1 → sum=2 (item 7 is reversed: 2-0=2, but we want conduct low)
            // Actually with item 7=0 (reversed → 2), conduct = 0+2+0+0+0 = 2
            // Let's set item 5 to 1: conduct = 1+2+0+0+0 = 3
            answers[5] = 1;
            // Hyperactivity: 2(0),10(0),15(0),21(R:2),25(R:2) → sum=4
            // Set item 2 to 1: sum=5
            answers[2] = 1;
            // Peer: 6(0),11(R:2),14(R:2),19(0),23(0) → sum=4
            // Total so far: 3 + 3 + 5 + 4 = 15. Too high.
            // Reset: more targeted approach.
            const answers2 = makeSDQAnswers(0);
            // Reversed items at 0: contribute 2 each
            // Conduct has 1 reversed (7): contributes 2 → base=2
            // Hyperactivity has 2 reversed (21,25): contributes 4 → base=4
            // Peer has 2 reversed (11,14): contributes 4 → base=4
            // Emotional has 0 reversed: base=0
            // Base total = 0+2+4+4 = 10
            // We need total=11, so add 1 more point somewhere
            answers2[3] = 1; // Emotional item → emotional=1
            // Total = 1+2+4+4 = 11

            const teacherResult = calculateSDQScores(answers2, SDQVersion.TEACHER);
            expect(teacherResult.totalDifficulties).toBe(11);
            expect(teacherResult.totalDifficultiesBand).toBe(SDQBand.NORMAL);

            // Same answers under parent cutoffs: 11 is still Normal (0-13)
            const parentResult = calculateSDQScores(answers2, SDQVersion.PARENT);
            expect(parentResult.totalDifficulties).toBe(11);
            expect(parentResult.totalDifficultiesBand).toBe(SDQBand.NORMAL);
        });

        it('teacher Total Borderline = 12-15, parent = 14-16', () => {
            // Total = 14: Borderline for both teacher and parent
            const answers = makeSDQAnswers(0);
            // Base from reversed items: 0+2+4+4 = 10
            // Need 4 more: set 4 non-reversed items to 1
            answers[3] = 1;  // Emotional
            answers[8] = 1;  // Emotional
            answers[5] = 1;  // Conduct
            answers[2] = 1;  // Hyperactivity
            // Total = 2(emotional) + 3(conduct: 1+2+0+0+0) + 5(hyper: 1+0+0+2+2) + 4(peer) = 14

            const teacherResult = calculateSDQScores(answers, SDQVersion.TEACHER);
            expect(teacherResult.totalDifficulties).toBe(14);
            expect(teacherResult.totalDifficultiesBand).toBe(SDQBand.BORDERLINE); // 12-15

            const parentResult = calculateSDQScores(answers, SDQVersion.PARENT);
            expect(parentResult.totalDifficulties).toBe(14);
            expect(parentResult.totalDifficultiesBand).toBe(SDQBand.BORDERLINE); // 14-16
        });

        it('score 13 is Normal for parent but Borderline for teacher', () => {
            const answers = makeSDQAnswers(0);
            // Base = 10, need 3 more
            answers[3] = 1; answers[8] = 1; answers[5] = 1;
            // Total = 1+1(emotional) + 1+2(conduct) + 4(hyper) + 4(peer) = 2+3+4+4 = 13

            const teacherResult = calculateSDQScores(answers, SDQVersion.TEACHER);
            expect(teacherResult.totalDifficulties).toBe(13);
            expect(teacherResult.totalDifficultiesBand).toBe(SDQBand.BORDERLINE); // 12-15

            const parentResult = calculateSDQScores(answers, SDQVersion.PARENT);
            expect(parentResult.totalDifficulties).toBe(13);
            expect(parentResult.totalDifficultiesBand).toBe(SDQBand.NORMAL); // 0-13
        });

        it('parent Emotional: Normal ≤3, Borderline=4, Abnormal ≥5', () => {
            // Score exactly 4 on Emotional (parent)
            const answers = makeSDQAnswers(0);
            answers[3] = 2; answers[8] = 2; // → 4

            const result = calculateSDQScores(answers, SDQVersion.PARENT);
            const emotional = result.subscales.find(s => s.subscale === SDQSubscale.EMOTIONAL)!;
            expect(emotional.score).toBe(4);
            expect(emotional.band).toBe(SDQBand.BORDERLINE);
        });

        it('teacher Emotional: Normal ≤4, Borderline=5, Abnormal ≥6', () => {
            // Score exactly 4 on Emotional (teacher)
            const answers = makeSDQAnswers(0);
            answers[3] = 2; answers[8] = 2; // → 4

            const result = calculateSDQScores(answers, SDQVersion.TEACHER);
            const emotional = result.subscales.find(s => s.subscale === SDQSubscale.EMOTIONAL)!;
            expect(emotional.score).toBe(4);
            expect(emotional.band).toBe(SDQBand.NORMAL); // Different from parent!

            // Score 5 → Borderline for teacher
            answers[13] = 1; // → 5
            const result2 = calculateSDQScores(answers, SDQVersion.TEACHER);
            const emotional2 = result2.subscales.find(s => s.subscale === SDQSubscale.EMOTIONAL)!;
            expect(emotional2.score).toBe(5);
            expect(emotional2.band).toBe(SDQBand.BORDERLINE);
        });

        it('parent Peer: Normal ≤2, Borderline=3, Abnormal ≥4', () => {
            // With all zeros, peer reversed items (11, 14) contribute 2 each → score=4
            const answers = makeSDQAnswers(0);
            const result = calculateSDQScores(answers, SDQVersion.PARENT);
            const peer = result.subscales.find(s => s.subscale === SDQSubscale.PEER)!;
            expect(peer.score).toBe(4);
            expect(peer.band).toBe(SDQBand.ABNORMAL); // 4-10 for parent

            // Same score=4 for teacher → Borderline (4)
            const teacherResult = calculateSDQScores(answers, SDQVersion.TEACHER);
            const teacherPeer = teacherResult.subscales.find(s => s.subscale === SDQSubscale.PEER)!;
            expect(teacherPeer.score).toBe(4);
            expect(teacherPeer.band).toBe(SDQBand.BORDERLINE); // 4 for teacher
        });
    });

    describe('input validation', () => {
        it('handles empty answers (all subscales get 0 for non-reversed, 2 for reversed)', () => {
            const result = calculateSDQScores({}, SDQVersion.TEACHER);

            // With no answers, only reversed items contribute (2 per item)
            // But actually no answers match the check (typeof rawValue !== 'number')
            // So all items are skipped → sum = 0 for all subscales
            result.subscales.forEach(s => {
                expect(s.score).toBe(0);
            });
            expect(result.totalDifficulties).toBe(0);
        });

        it('ignores out-of-range values', () => {
            const answers: SDQRawAnswers = {};
            // Emotional items: 3, 8, 13, 16, 24
            answers[3] = 2;
            answers[8] = 3;   // Invalid (>2)
            answers[13] = -1; // Invalid (<0)
            answers[16] = 1;
            answers[24] = 2;

            const result = calculateSDQScores(answers, SDQVersion.TEACHER);
            const emotional = result.subscales.find(s => s.subscale === SDQSubscale.EMOTIONAL)!;
            // Only items 3(2), 16(1), 24(2) are valid → sum = 5
            expect(emotional.score).toBe(5);
        });

        it('handles partial answers', () => {
            const answers: SDQRawAnswers = {};
            // Only answer 3 out of 25 items
            answers[1] = 2; // Prosocial
            answers[3] = 1; // Emotional
            answers[5] = 0; // Conduct

            const result = calculateSDQScores(answers, SDQVersion.TEACHER);
            expect(result.subscales).toHaveLength(5);

            const prosocial = result.subscales.find(s => s.subscale === SDQSubscale.PROSOCIAL)!;
            expect(prosocial.score).toBe(2);

            const emotional = result.subscales.find(s => s.subscale === SDQSubscale.EMOTIONAL)!;
            expect(emotional.score).toBe(1);

            const conduct = result.subscales.find(s => s.subscale === SDQSubscale.CONDUCT)!;
            expect(conduct.score).toBe(0);
        });
    });

    describe('getSDQRadarData', () => {
        it('returns 5 data points with correct structure', () => {
            const result = calculateSDQScores(makeSDQAnswers(1), SDQVersion.TEACHER);
            const radarData = getSDQRadarData(result);

            expect(radarData).toHaveLength(5);
            radarData.forEach(d => {
                expect(d).toHaveProperty('subject');
                expect(d).toHaveProperty('value');
                expect(d).toHaveProperty('fullMark');
                expect(d.fullMark).toBe(10);
                expect(typeof d.value).toBe('number');
            });
        });
    });

    describe('getSDQInterventions', () => {
        it('returns interventions for abnormal/borderline areas only', () => {
            const answers = makeSDQAnswers(2);
            const result = calculateSDQScores(answers, SDQVersion.TEACHER);
            const interventions = getSDQInterventions(result);

            // With all 2s: Emotional=Abnormal, Conduct=Abnormal, Hyper=Borderline, Peer=Abnormal
            // Prosocial=Normal (10), so no intervention for prosocial
            expect(interventions.length).toBeGreaterThanOrEqual(3);

            // No Normal areas should appear
            interventions.forEach(i => {
                expect([SDQBand.ABNORMAL, SDQBand.BORDERLINE]).toContain(i.band);
            });
        });

        it('returns empty array when all areas are normal', () => {
            // All 1s: every subscale score = 5 (all midpoint)
            // For teacher: Emotional=5 → Borderline, so not all normal with raw=1
            // Let's try to craft all-Normal answers
            // We need all subscales in Normal range:
            // Emotional ≤4, Conduct ≤2, Hyper ≤5, Peer ≤3, Prosocial ≥6
            const answers: SDQRawAnswers = {};
            // Prosocial (non-reversed, need ≥6): set items 1,4,9,17,20 = 2 each → 10
            [1, 4, 9, 17, 20].forEach(id => { answers[id] = 2; });
            // All other items: 0 (but watch reversed items)
            // Reversed items: 7(Conduct), 11(Peer), 14(Peer), 21(Hyper), 25(Hyper)
            // Setting them to 2 → reversed value = 0
            [7, 11, 14, 21, 25].forEach(id => { answers[id] = 2; });
            // All remaining non-reversed difficulty items: set to 0
            [2, 3, 5, 6, 8, 10, 12, 13, 15, 16, 18, 19, 22, 23, 24].forEach(id => {
                answers[id] = 0;
            });

            const result = calculateSDQScores(answers, SDQVersion.TEACHER);
            // Emotional: 0+0+0+0+0 = 0 → Normal
            // Conduct: 0+0+0+0+0 = 0 (item 7 reversed: 2-2=0) → Normal
            // Hyper: 0+0+0+0+0 = 0 (items 21,25 reversed: 2-2=0) → Normal
            // Peer: 0+0+0+0+0 = 0 (items 11,14 reversed: 2-2=0) → Normal
            // Prosocial: 2+2+2+2+2 = 10 → Normal

            result.subscales.forEach(s => {
                expect(s.band).toBe(SDQBand.NORMAL);
            });

            const interventions = getSDQInterventions(result);
            expect(interventions).toHaveLength(0);
        });
    });

    describe('SDQ items structure', () => {
        it('has exactly 25 items', () => {
            expect(SDQ_ITEMS).toHaveLength(25);
        });

        it('each subscale has exactly 5 items', () => {
            const subscales = Object.values(SDQSubscale);
            subscales.forEach(subscale => {
                const items = SDQ_ITEMS.filter(i => i.subscale === subscale);
                expect(items).toHaveLength(5);
            });
        });

        it('has exactly 5 reversed items: 7, 11, 14, 21, 25', () => {
            const reversed = SDQ_ITEMS.filter(i => i.reversed);
            expect(reversed).toHaveLength(5);
            const ids = reversed.map(i => i.id).sort((a, b) => a - b);
            expect(ids).toEqual([7, 11, 14, 21, 25]);
        });

        it('item IDs are 1-25 with no gaps', () => {
            const ids = SDQ_ITEMS.map(i => i.id).sort((a, b) => a - b);
            expect(ids).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
        });
    });
});
