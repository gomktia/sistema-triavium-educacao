'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function completeTour() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { tourCompletedAt: new Date() },
    });

    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error('Error completing tour:', e.message);
    return { error: 'Erro ao salvar progresso do tour.' };
  }
}

export async function resetTour() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Não autorizado.' };

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { tourCompletedAt: null },
    });

    revalidatePath('/');
    return { success: true };
  } catch (e: any) {
    console.error('Error resetting tour:', e.message);
    return { error: 'Erro ao resetar tour.' };
  }
}
