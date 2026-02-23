'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/src/core/types';

export interface ClassroomComparisonRow {
  id: string;
  name: string;
  grade: string;
  totalStudents: number;
  tier1: number;
  tier2: number;
  tier3: number;
  completionRate: number;
}

export async function getClassroomComparison(screeningWindow?: string) {
  const user = await getCurrentUser();
  const allowedRoles = [UserRole.TEACHER, UserRole.PSYCHOLOGIST, UserRole.COUNSELOR, UserRole.MANAGER, UserRole.ADMIN];

  if (!user || !allowedRoles.includes(user.role)) {
    return { success: false, error: 'Sem permissão.', classrooms: [] };
  }

  const currentYear = new Date().getFullYear();
  const window = screeningWindow || 'DIAGNOSTIC';

  const classrooms = await prisma.classroom.findMany({
    where: { tenantId: user.tenantId },
    select: {
      id: true,
      name: true,
      grade: true,
      students: {
        where: { isActive: true },
        select: {
          id: true,
          assessments: {
            where: {
              type: 'SRSS_IE',
              academicYear: currentYear,
              screeningWindow: window as any,
            },
            select: { overallTier: true },
            orderBy: { appliedAt: 'desc' },
            take: 1,
          },
        },
      },
    },
    orderBy: [{ grade: 'asc' }, { name: 'asc' }],
  });

  const result: ClassroomComparisonRow[] = classrooms.map((c) => {
    const totalStudents = c.students.length;
    let tier1 = 0;
    let tier2 = 0;
    let tier3 = 0;
    let completed = 0;

    for (const student of c.students) {
      if (student.assessments.length > 0) {
        completed++;
        const tier = student.assessments[0].overallTier;
        if (tier === 'TIER_1') tier1++;
        else if (tier === 'TIER_2') tier2++;
        else if (tier === 'TIER_3') tier3++;
      }
    }

    const completionRate = totalStudents > 0 ? Math.round((completed / totalStudents) * 100) : 0;

    return {
      id: c.id,
      name: c.name,
      grade: c.grade,
      totalStudents,
      tier1,
      tier2,
      tier3,
      completionRate,
    };
  });

  return { success: true, classrooms: result };
}
