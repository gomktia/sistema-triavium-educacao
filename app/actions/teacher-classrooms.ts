'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

/**
 * SECURITY V4.1: Server Actions para gerenciar vínculos Professor-Turma
 * Garante isolamento de acesso conforme auditoria de segurança
 */

/**
 * Retorna turmas vinculadas ao professor atual
 * Se não for TEACHER, retorna todas as turmas do tenant
 */
export async function getMyClassrooms() {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // SECURITY: Se for TEACHER, retornar apenas turmas vinculadas
    if (user.role === 'TEACHER') {
        const teacherClassrooms = await prisma.teacherClassroom.findMany({
            where: {
                teacherId: user.id,
                tenantId: user.tenantId
            },
            include: {
                classroom: {
                    include: {
                        _count: {
                            select: { students: true }
                        }
                    }
                }
            },
            orderBy: {
                classroom: {
                    name: 'asc'
                }
            }
        });

        return teacherClassrooms.map(tc => tc.classroom);
    }

    // Para outros perfis, retornar todas as turmas do tenant
    return await prisma.classroom.findMany({
        where: { tenantId: user.tenantId },
        include: { _count: { select: { students: true } } },
        orderBy: { name: 'asc' }
    });
}

/**
 * Valida se o professor tem permissão para acessar uma turma específica
 * Lança erro se não tiver acesso
 */
export async function validateTeacherClassroomAccess(classroomId: string) {
    const user = await getCurrentUser();
    if (!user) throw new Error('Unauthorized');

    // SECURITY: Apenas TEACHER precisa de validação de vínculo
    if (user.role !== 'TEACHER') {
        // Outros perfis podem acessar qualquer turma do tenant
        const classroom = await prisma.classroom.findUnique({
            where: { id: classroomId, tenantId: user.tenantId }
        });
        if (!classroom) throw new Error('Turma não encontrada ou acesso negado');
        return true;
    }

    // SECURITY: Validar vínculo explícito para TEACHER
    const link = await prisma.teacherClassroom.findFirst({
        where: {
            teacherId: user.id,
            classroomId: classroomId,
            tenantId: user.tenantId
        }
    });

    if (!link) {
        throw new Error('Você não tem permissão para acessar esta turma');
    }

    return true;
}

/**
 * MANAGER/ADMIN: Vincular professor a uma turma
 */
export async function linkTeacherToClassroom(teacherId: string, classroomId: string) {
    const user = await getCurrentUser();
    if (!user || !['MANAGER', 'ADMIN'].includes(user.role)) {
        throw new Error('Apenas gestores podem vincular professores a turmas');
    }

    // Validar que professor e turma pertencem ao mesmo tenant
    const [teacher, classroom] = await Promise.all([
        prisma.user.findUnique({
            where: { id: teacherId, tenantId: user.tenantId }
        }),
        prisma.classroom.findUnique({
            where: { id: classroomId, tenantId: user.tenantId }
        })
    ]);

    if (!teacher || teacher.role !== 'TEACHER') {
        throw new Error('Professor não encontrado');
    }

    if (!classroom) {
        throw new Error('Turma não encontrada');
    }

    // Criar vínculo (ignorar se já existir)
    const link = await prisma.teacherClassroom.upsert({
        where: {
            teacherId_classroomId: {
                teacherId,
                classroomId
            }
        },
        create: {
            teacherId,
            classroomId,
            tenantId: user.tenantId
        },
        update: {} // Não atualizar se já existir
    });

    revalidatePath('/gestao/equipe');
    revalidatePath('/turma');
    return { success: true, link };
}

/**
 * MANAGER/ADMIN: Desvincular professor de uma turma
 */
export async function unlinkTeacherFromClassroom(teacherId: string, classroomId: string) {
    const user = await getCurrentUser();
    if (!user || !['MANAGER', 'ADMIN'].includes(user.role)) {
        throw new Error('Apenas gestores podem desvincular professores de turmas');
    }

    await prisma.teacherClassroom.deleteMany({
        where: {
            teacherId,
            classroomId,
            tenantId: user.tenantId // SECURITY: Garantir isolamento de tenant
        }
    });

    revalidatePath('/gestao/equipe');
    revalidatePath('/turma');
    return { success: true };
}

/**
 * MANAGER/ADMIN: Atualizar todos os vínculos de um professor de uma vez
 */
export async function updateTeacherClassrooms(teacherId: string, classroomIds: string[]) {
    const user = await getCurrentUser();
    if (!user || !['MANAGER', 'ADMIN'].includes(user.role)) {
        throw new Error('Apenas gestores podem gerenciar vínculos de professores');
    }

    // Validar que professor pertence ao tenant
    const teacher = await prisma.user.findUnique({
        where: { id: teacherId, tenantId: user.tenantId }
    });

    if (!teacher || teacher.role !== 'TEACHER') {
        throw new Error('Professor não encontrado');
    }

    // Usar transaction para garantir atomicidade
    await prisma.$transaction(async (tx) => {
        // Deletar todos os vínculos existentes
        await tx.teacherClassroom.deleteMany({
            where: {
                teacherId,
                tenantId: user.tenantId
            }
        });

        // Criar novos vínculos se houver turmas selecionadas
        if (classroomIds.length > 0) {
            await tx.teacherClassroom.createMany({
                data: classroomIds.map(classroomId => ({
                    teacherId,
                    classroomId,
                    tenantId: user.tenantId
                })),
                skipDuplicates: true
            });
        }
    });

    revalidatePath('/gestao/equipe');
    revalidatePath('/turma');
    return { success: true };
}

/**
 * Retorna turmas vinculadas a um professor específico (para UI de gestão)
 */
export async function getTeacherClassrooms(teacherId: string) {
    const user = await getCurrentUser();
    if (!user || !['MANAGER', 'ADMIN', 'PSYCHOLOGIST'].includes(user.role)) {
        throw new Error('Sem permissão para visualizar vínculos');
    }

    const links = await prisma.teacherClassroom.findMany({
        where: {
            teacherId,
            tenantId: user.tenantId
        },
        include: {
            classroom: true
        }
    });

    return links.map(link => link.classroom);
}
