'use client';

import dynamic from 'next/dynamic';
import { IEAARawAnswers } from '@/src/core/types';

const IEAAWizard = dynamic(
    () => import('@/components/ieaa/IEAAWizard').then((mod) => mod.IEAAWizard),
    {
        loading: () => <div className="animate-pulse h-96 bg-slate-200 rounded-lg" />,
        ssr: false,
    }
);

interface IEAAWizardLazyProps {
    initialAnswers?: IEAARawAnswers;
    studentId?: string;
    studentName?: string;
}

export function IEAAWizardLazy(props: IEAAWizardLazyProps) {
    return <IEAAWizard {...props} />;
}
