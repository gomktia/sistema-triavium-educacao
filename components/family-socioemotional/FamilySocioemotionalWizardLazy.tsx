'use client';

import dynamic from 'next/dynamic';
import { FamilySocioemotionalRawAnswers } from '@/src/core/types';

const FamilySocioemotionalWizard = dynamic(
    () => import('@/components/family-socioemotional/FamilySocioemotionalWizard').then((mod) => mod.FamilySocioemotionalWizard),
    {
        loading: () => <div className="animate-pulse h-96 bg-slate-200 rounded-lg" />,
        ssr: false,
    }
);

interface FamilySocioemotionalWizardLazyProps {
    initialAnswers?: FamilySocioemotionalRawAnswers;
    studentId: string;
    studentName?: string;
}

export function FamilySocioemotionalWizardLazy(props: FamilySocioemotionalWizardLazyProps) {
    return <FamilySocioemotionalWizard {...props} />;
}
