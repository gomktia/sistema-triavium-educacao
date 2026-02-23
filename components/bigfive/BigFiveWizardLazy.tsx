'use client';

import dynamic from 'next/dynamic';
import { BigFiveRawAnswers } from '@/src/core/types';

const BigFiveWizard = dynamic(
    () => import('@/components/bigfive/BigFiveWizard').then((mod) => mod.BigFiveWizard),
    {
        loading: () => <div className="animate-pulse h-96 bg-slate-200 rounded-lg" />,
        ssr: false,
    }
);

interface BigFiveWizardLazyProps {
    initialAnswers?: BigFiveRawAnswers;
    studentId?: string;
    studentName?: string;
}

export function BigFiveWizardLazy(props: BigFiveWizardLazyProps) {
    return <BigFiveWizard {...props} />;
}
