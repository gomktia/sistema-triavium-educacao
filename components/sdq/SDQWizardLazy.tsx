'use client';

import dynamic from 'next/dynamic';
import { SDQRawAnswers } from '@/src/core/types';

const SDQWizard = dynamic(
    () => import('@/components/sdq/SDQWizard').then((mod) => mod.SDQWizard),
    {
        loading: () => <div className="animate-pulse h-96 bg-slate-200 rounded-lg" />,
        ssr: false,
    }
);

interface SDQWizardLazyProps {
    initialAnswers?: SDQRawAnswers;
    studentId: string;
    studentName?: string;
}

export function SDQWizardLazy(props: SDQWizardLazyProps) {
    return <SDQWizard {...props} />;
}
