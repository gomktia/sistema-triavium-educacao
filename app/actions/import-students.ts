'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import * as XLSX from 'xlsx';
import { parseImportData, type ValidatedStudent } from '@/lib/import/parse-students';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface ImportPreview {
  valid: { row: number; data: ValidatedStudent }[];
  errors: { row: number; rawData: Record<string, string>; errors: string[] }[];
  duplicates: { row: number; data: ValidatedStudent; reason: string }[];
  newClassrooms: string[];
  existingClassrooms: string[];
}

export async function parseImportFile(formData: FormData): Promise<
  { success: true; preview: ImportPreview } |
  { success: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
    return { success: false, error: 'Sem permissao para importar alunos.' };
  }

  const file = formData.get('file') as File | null;
  if (!file) return { success: false, error: 'Nenhum arquivo enviado.' };
  if (file.size > MAX_FILE_SIZE) return { success: false, error: 'Arquivo excede 5MB.' };

  // Parse file to 2D array
  let rows: string[][];
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as string[][];
  } catch {
    return { success: false, error: 'Erro ao ler arquivo. Verifique se e um CSV ou Excel valido.' };
  }

  const parsed = parseImportData(rows);
  if (parsed.headerError) return { success: false, error: parsed.headerError };

  // Check duplicates against DB
  const existingCpfs = new Set<string>();
  const existingEnrollments = new Set<string>();

  const cpfsToCheck = parsed.valid.map(r => r.data.cpf).filter(Boolean) as string[];
  if (cpfsToCheck.length > 0) {
    const existing = await prisma.student.findMany({
      where: { tenantId: user.tenantId, cpf: { in: cpfsToCheck } },
      select: { cpf: true },
    });
    existing.forEach(s => { if (s.cpf) existingCpfs.add(s.cpf); });
  }

  const enrollmentsToCheck = parsed.valid.map(r => r.data.enrollmentId).filter(Boolean) as string[];
  if (enrollmentsToCheck.length > 0) {
    const existing = await prisma.student.findMany({
      where: { tenantId: user.tenantId, enrollmentId: { in: enrollmentsToCheck } },
      select: { enrollmentId: true },
    });
    existing.forEach(s => { if (s.enrollmentId) existingEnrollments.add(s.enrollmentId); });
  }

  // Separate duplicates from valid
  const duplicates: ImportPreview['duplicates'] = [];
  const uniqueValid = parsed.valid.filter(r => {
    if (r.data.cpf && existingCpfs.has(r.data.cpf)) {
      duplicates.push({ row: r.row, data: r.data, reason: `CPF ${r.data.cpf} ja cadastrado` });
      return false;
    }
    if (r.data.enrollmentId && existingEnrollments.has(r.data.enrollmentId)) {
      duplicates.push({ row: r.row, data: r.data, reason: `Matricula ${r.data.enrollmentId} ja cadastrada` });
      return false;
    }
    return true;
  });

  // Check which classrooms exist
  const existingClassroomsDB = await prisma.classroom.findMany({
    where: { tenantId: user.tenantId, year: new Date().getFullYear() },
    select: { name: true },
  });
  const existingNames = new Set(existingClassroomsDB.map(c => c.name));

  const newClassrooms = [...parsed.classrooms].filter(name => !existingNames.has(name));
  const existingClassrooms = [...parsed.classrooms].filter(name => existingNames.has(name));

  return {
    success: true,
    preview: {
      valid: uniqueValid,
      errors: parsed.errors,
      duplicates,
      newClassrooms,
      existingClassrooms,
    },
  };
}

export async function executeImport(
  validStudents: { data: ValidatedStudent }[],
  newClassroomNames: string[]
): Promise<
  { success: true; created: number; classroomsCreated: number; skipped: number } |
  { success: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
    return { success: false, error: 'Sem permissao.' };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create new classrooms
      const classroomMap = new Map<string, string>(); // name -> id
      const year = new Date().getFullYear();

      // Fetch existing classrooms for mapping
      const existing = await tx.classroom.findMany({
        where: { tenantId: user.tenantId, year },
        select: { id: true, name: true },
      });
      existing.forEach(c => classroomMap.set(c.name, c.id));

      // Create missing classrooms
      for (const name of newClassroomNames) {
        if (!classroomMap.has(name)) {
          const grade = inferGradeFromName(name);
          const created = await tx.classroom.create({
            data: { tenantId: user.tenantId, name, grade, year },
          });
          classroomMap.set(name, created.id);
        }
      }

      // 2. Create students
      let createdCount = 0;
      for (const { data } of validStudents) {
        const classroomId = classroomMap.get(data.classroomName);
        await tx.student.create({
          data: {
            tenantId: user.tenantId,
            name: data.name,
            grade: inferGradeFromName(data.classroomName),
            classroomId: classroomId || null,
            enrollmentId: data.enrollmentId || null,
            birthDate: data.birthDate || null,
            cpf: data.cpf || null,
            guardianName: data.guardianName || null,
            guardianPhone: data.guardianPhone || null,
            guardianEmail: data.guardianEmail || null,
          },
        });
        createdCount++;
      }

      return { created: createdCount, classroomsCreated: newClassroomNames.length };
    });

    await logAudit({
      tenantId: user.tenantId,
      userId: user.id,
      action: 'STUDENTS_BULK_IMPORTED',
      details: {
        created: result.created,
        classroomsCreated: result.classroomsCreated,
      },
    });

    revalidatePath('/alunos');
    revalidatePath('/turma');

    return { success: true, ...result, skipped: 0 };
  } catch (error: any) {
    console.error('[IMPORT] Error executing bulk import:', error);
    return { success: false, error: 'Erro ao importar alunos. Nenhum dado foi alterado.' };
  }
}

/** Infer GradeLevel from classroom name. Defaults to ANO_1_EM. */
function inferGradeFromName(name: string): 'ANO_1_EM' | 'ANO_2_EM' | 'ANO_3_EM' {
  const lower = name.toLowerCase();
  if (lower.includes('3') || lower.includes('terceiro') || lower.includes('3a') || lower.includes('3o')) return 'ANO_3_EM';
  if (lower.includes('2') || lower.includes('segundo') || lower.includes('2a') || lower.includes('2o')) return 'ANO_2_EM';
  return 'ANO_1_EM';
}
