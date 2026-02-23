const VALID_RELATIONSHIPS = ['MAE', 'PAI', 'AVO_A', 'TIO_A', 'OUTRO'] as const;

interface InviteInput {
  email: string;
  relationship: string;
  studentId: string;
}

interface ValidationResult {
  success: boolean;
  data?: { email: string; relationship: string; studentId: string };
  error?: string;
}

export function validateGuardianInviteInput(input: InviteInput): ValidationResult {
  const email = input.email?.trim().toLowerCase();
  const { relationship, studentId } = input;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'E-mail inválido.' };
  }

  if (!studentId) {
    return { success: false, error: 'Aluno não informado.' };
  }

  if (!VALID_RELATIONSHIPS.includes(relationship as any)) {
    return { success: false, error: 'Tipo de parentesco inválido.' };
  }

  return { success: true, data: { email, relationship, studentId } };
}
