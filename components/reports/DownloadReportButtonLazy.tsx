'use client';

import dynamic from 'next/dynamic';

const DownloadReportButton = dynamic(
    () => import('@/components/reports/DownloadReportButton').then((mod) => mod.DownloadReportButton),
    {
        loading: () => <div className="animate-pulse h-10 w-48 bg-slate-200 rounded-lg" />,
        ssr: false,
    }
);

interface DownloadReportButtonLazyProps {
    studentName: string;
    grade: string;
    signatureStrengths: any[];
}

export function DownloadReportButtonLazy(props: DownloadReportButtonLazyProps) {
    return <DownloadReportButton {...props} />;
}
