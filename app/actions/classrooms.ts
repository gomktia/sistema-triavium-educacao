'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { GradeLevel } from '@/src/core/types';

export async function getClassrooms() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // SECURITY V4.1: TEACHER só vê turmas vinculadas
    if (user.role === 'TEACHER') {
        const teacherClassrooms = await prisma.teacherClassroom.findMany({
            where: {
                teacherId: user.id,
                tenantId: user.tenantId
            },
            include: {
                classroom: {
                    include: {
                        _count: { select: { students: true } }
                    }
                }
            }
        });

        return teacherClassrooms.map(tc => tc.classroom).sort((a, b) => a.name.localeCompare(b.name));
    }

    // Outros perfis veem todas as turmas do tenant
    return await prisma.classroom.findMany({
        where: { tenantId: user.tenantId },
        include: { _count: { select: { students: true } } },
        orderBy: { name: 'asc' }
    });
}

export async function getClassroomById(id: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    return await prisma.classroom.findUnique({
        where: { id, tenantId: user.tenantId },
        include: {
            students: {
                select: {
                    id: true,
                    name: true,
                    grade: true,
                    enrollmentId: true,
                    isActive: true
                }
            }
        }
    });
}

export async function createClassroom(data: { name: string; grade: GradeLevel; year: number; shift?: string }) {
    const user = await getCurrentUser();
    if (!user || user.role === 'STUDENT') throw new Error('Unauthorized');

    const classroom = await prisma.classroom.create({
        data: {
            ...data,
            tenantId: user.tenantId
        }
    });

    revalidatePath('/turmas');
    return classroom;
}

export async function deleteClassroom(id: string) {
    const user = await getCurrentUser();
    if (!user || user.role === 'STUDENT') throw new Error('Unauthorized');

    await prisma.classroom.delete({
        where: { id, tenantId: user.tenantId }
    });

    revalidatePath('/turmas');
    return { success: true };
}

export async function addStudentsToClass(classroomId: string, studentIds: string[]) {
    const user = await getCurrentUser();
    if (!user || user.role === 'STUDENT') throw new Error('Unauthorized');

    await prisma.student.updateMany({
        where: {
            id: { in: studentIds },
            tenantId: user.tenantId
        },
        data: { classroomId }
    });

    revalidatePath('/turmas');
    revalidatePath(`/turmas/${classroomId}`);
    return { success: true };
}

export async function removeStudentFromClass(studentId: string) {
    const user = await getCurrentUser();
    if (!user || user.role === 'STUDENT') throw new Error('Unauthorized');

    await prisma.student.update({
        where: { id: studentId, tenantId: user.tenantId },
        data: { classroomId: null }
    });

    revalidatePath('/turmas');
    return { success: true };
}

/**
 * Enables IEAA questionnaire for all students in a classroom.
 * This sets the isFormEnabled flag so students can access the IEAA.
 */
export async function enableIEAAForClassroom(classroomId: string) {
    const user = await getCurrentUser();

    // Only MANAGER and ADMIN can enable assessments
    if (!user || !['MANAGER', 'ADMIN'].includes(user.role)) {
        return { success: false, error: 'Permissao negada.' };
    }

    try {
        // Verify classroom belongs to tenant
        const classroom = await prisma.classroom.findUnique({
            where: { id: classroomId, tenantId: user.tenantId },
            select: { id: true, name: true }
        });

        if (!classroom) {
            return { success: false, error: 'Turma nao encontrada.' };
        }

        // Update all students in the classroom to enable form access
        const result = await prisma.student.updateMany({
            where: {
                classroomId: classroomId,
                tenantId: user.tenantId
            },
            data: {
                isFormEnabled: true
            }
        });

        revalidatePath(`/turmas/${classroomId}`);
        revalidatePath('/turmas');

        return { success: true, count: result.count };
    } catch (error) {
        console.error('Error enabling IEAA:', error);
        return { success: false, error: 'Erro ao liberar IEAA.' };
    }
}
