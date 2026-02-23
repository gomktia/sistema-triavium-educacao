import { describe, it, expect } from 'vitest';
import { validateGuardianInviteInput } from '@/app/actions/guardian-invite';

describe('validateGuardianInviteInput', () => {
  it('rejects empty email', () => {
    const result = validateGuardianInviteInput({ email: '', relationship: 'MAE', studentId: 'stu1' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid email', () => {
    const result = validateGuardianInviteInput({ email: 'not-email', relationship: 'MAE', studentId: 'stu1' });
    expect(result.success).toBe(false);
  });

  it('rejects missing studentId', () => {
    const result = validateGuardianInviteInput({ email: 'parent@test.com', relationship: 'MAE', studentId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects invalid relationship', () => {
    const result = validateGuardianInviteInput({ email: 'parent@test.com', relationship: 'INVALID' as any, studentId: 'stu1' });
    expect(result.success).toBe(false);
  });

  it('accepts valid input', () => {
    const result = validateGuardianInviteInput({ email: 'parent@test.com', relationship: 'MAE', studentId: 'stu1' });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('parent@test.com');
  });

  it('trims and lowercases email', () => {
    const result = validateGuardianInviteInput({ email: ' Parent@Test.COM ', relationship: 'PAI', studentId: 'stu1' });
    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('parent@test.com');
  });
});
