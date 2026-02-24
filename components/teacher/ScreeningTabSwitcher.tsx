'use client';

import { useState } from 'react';
import { SRSSGrid } from './SRSSGrid';
import { SDQGrid } from './SDQGrid';
import { cn } from '@/lib/utils';
import type { OrganizationLabels } from '@/src/lib/utils/labels';

interface Student {
    id: string;
    name: string;
}

interface StudentData {
    answers: Record<number, number>;
    tier?: string;
    band?: string;
}

interface FormQuestion {
    number: number;
    text: string;
    category?: string | null;
}

interface ScreeningTabSwitcherProps {
    students: Student[];
    srssExistingData: Record<string, any>;
    sdqExistingData: Record<string, any>;
    labels?: OrganizationLabels;
    srssQuestions?: FormQuestion[];
}

type TabId = 'srss' | 'sdq';

const TABS: { id: TabId; label: string; description: string }[] = [
    { id: 'srss', label: 'SRSS-IE', description: 'Rastreio de Risco' },
    { id: 'sdq', label: 'SDQ', description: 'Capacidades e Dificuldades' },
];

export function ScreeningTabSwitcher({
    students,
    srssExistingData,
    sdqExistingData,
    labels,
    srssQuestions,
}: ScreeningTabSwitcherProps) {
    const [activeTab, setActiveTab] = useState<TabId>('srss');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 bg-slate-100/60 rounded-2xl p-1.5 w-fit">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95",
                            activeTab === tab.id
                                ? "bg-white text-slate-900 shadow-sm"
                                : "text-slate-400 hover:text-slate-600 hover:bg-white/50"
                        )}
                    >
                        <span>{tab.label}</span>
                        <span className={cn(
                            "text-[10px] font-extrabold uppercase tracking-widest hidden sm:inline",
                            activeTab === tab.id ? "text-indigo-500" : "text-slate-300"
                        )}>
                            {tab.description}
                        </span>
                    </button>
                ))}
            </div>

            {activeTab === 'srss' ? (
                <SRSSGrid
                    students={students}
                    existingData={srssExistingData}
                    labels={labels}
                    questions={srssQuestions}
                />
            ) : (
                <SDQGrid
                    students={students}
                    existingData={sdqExistingData}
                    labels={labels}
                />
            )}
        </div>
    );
}
