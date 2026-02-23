// Pure functions for intervention monitoring calculations.
// No server-side dependencies — fully testable.

interface TierEntry {
    studentId: string;
    tier: string;
}

interface GroupStudentEntry {
    studentId: string;
    tierBefore: string;
    tierAfter: string;
}

interface MigrationResult {
    improved: number;
    unchanged: number;
    worsened: number;
    total: number;
}

interface EfficacyResult {
    improved: number;
    unchanged: number;
    worsened: number;
    percentImproved: number;
    percentUnchanged: number;
    percentWorsened: number;
}

const TIER_VALUES: Record<string, number> = {
    TIER_1: 1,
    TIER_2: 2,
    TIER_3: 3,
};

/** Convert tier string to numeric value for comparison. Lower = better. */
export function tierToNumber(tier: string | null | undefined): number {
    if (!tier) return 0;
    return TIER_VALUES[tier] ?? 0;
}

/**
 * Compare tiers between two screening windows for the same students.
 * Only students present in both arrays are counted.
 */
export function calculateTierMigration(
    before: TierEntry[],
    after: TierEntry[]
): MigrationResult {
    const afterMap = new Map(after.map((e) => [e.studentId, e.tier]));

    let improved = 0;
    let unchanged = 0;
    let worsened = 0;

    for (const entry of before) {
        const afterTier = afterMap.get(entry.studentId);
        if (afterTier === undefined) continue;

        const beforeNum = tierToNumber(entry.tier);
        const afterNum = tierToNumber(afterTier);

        if (afterNum < beforeNum) improved++;
        else if (afterNum === beforeNum) unchanged++;
        else worsened++;
    }

    return { improved, unchanged, worsened, total: improved + unchanged + worsened };
}

/**
 * Calculate efficacy for a single intervention group.
 * Each entry has the student's tier before joining the group and their current tier.
 */
export function calculateGroupEfficacy(
    students: GroupStudentEntry[]
): EfficacyResult {
    if (students.length === 0) {
        return { improved: 0, unchanged: 0, worsened: 0, percentImproved: 0, percentUnchanged: 0, percentWorsened: 0 };
    }

    let improved = 0;
    let unchanged = 0;
    let worsened = 0;

    for (const student of students) {
        const beforeNum = tierToNumber(student.tierBefore);
        const afterNum = tierToNumber(student.tierAfter);

        if (afterNum < beforeNum) improved++;
        else if (afterNum === beforeNum) unchanged++;
        else worsened++;
    }

    const percentImproved = Math.round((improved / students.length) * 100);
    const percentWorsened = Math.round((worsened / students.length) * 100);
    const percentUnchanged = 100 - percentImproved - percentWorsened;
    return { improved, unchanged, worsened, percentImproved, percentUnchanged, percentWorsened };
}
