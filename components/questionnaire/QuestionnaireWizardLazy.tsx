'use client';

import dynamic from 'next/dynamic';
import { VIARawAnswers } from '@/src/core/types';

const QuestionnaireWizard = dynamic(
    () => import('@/components/questionnaire/QuestionnaireWizard').then((mod) => mod.QuestionnaireWizard),
    {
        loading: () => <div className="animate-pulse h-96 bg-slate-200 rounded-lg" />,
        ssr: false,
    }
);

interface QuestionnaireWizardLazyProps {
    initialAnswers?: VIARawAnswers;
    studentId?: string;
    studentName?: string;
    isInterviewMode?: boolean;
}

export function QuestionnaireWizardLazy(props: QuestionnaireWizardLazyProps) {
    return <QuestionnaireWizard {...props} />;
}
