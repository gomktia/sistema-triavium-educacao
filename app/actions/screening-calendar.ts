'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { UserRole } from '@/src/core/types';

export interface ClassroomCompletion {
  id: string;
  name: string;
  total: number;
  completed: number;
  pct: number;
}

export interface ScreeningWindowData {
  window: string;
  label: string;
  classrooms: ClassroomCompletion[];
}

export async function getScreeningCalendar() {
  const user = await getCurrentUser();
  const allowedRoles = [UserRole.TEACHER, UserRole.PSYCHOLOGIST, UserRole.COUNSELOR, UserRole.MANAGER, UserRole.ADMIN];

  if (!user || !allowedRoles.includes(user.role)) {
    return { success: false, error: 'Sem permissão.', windows: [] };
  }

  const currentYear = new Date().getFullYear();

  const classrooms = await prisma.classroom.findMany({
    where: { tenantId: user.tenantId },
    select: {
      id: true,
      name: true,
      students: {
        where: { isActive: true },
        select: {
          id: true,
          assessments: {
            where: {
              type: 'SRSS_IE',
              academicYear: currentYear,
            },
            select: { screeningWindow: true },
          },
        },
      },
    },
    orderBy: [{ grade: 'asc' }, { name: 'asc' }],
  });

  const windowConfigs = [
    { window: 'DIAGNOSTIC', label: 'Diagnóstica (Março)' },
    { window: 'MONITORING', label: 'Monitoramento (Junho)' },
    { window: 'FINAL', label: 'Final (Outubro)' },
  ];

  const windows: ScreeningWindowData[] = windowConfigs.map(({ window, label }) => {
    const classroomData: ClassroomCompletion[] = classrooms.map((c) => {
      const total = c.students.length;
      const completed = c.students.filter((s) =>
        s.assessments.some((a) => a.screeningWindow === window)
      ).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return { id: c.id, name: c.name, total, completed, pct };
    });

    return { window, label, classrooms: classroomData };
  });

  return { success: true, windows };
}
