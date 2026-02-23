'use client';

import dynamic from 'next/dynamic';
import type { OrganizationLabels } from '@/src/lib/utils/labels';

const LaudoForm = dynamic(
    () => import('@/components/reports/LaudoForm').then((mod) => mod.LaudoForm),
    {
        loading: () => <div className="animate-pulse h-96 bg-slate-200 rounded-lg" />,
        ssr: false,
    }
);

interface LaudoFormLazyProps {
    student: any;
    labels: OrganizationLabels;
    currentUser: { name: string; role: string };
}

export function LaudoFormLazy(props: LaudoFormLazyProps) {
    return <LaudoForm {...props} />;
}
