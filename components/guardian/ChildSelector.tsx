'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Users } from 'lucide-react';

interface Child {
  id: string;
  name: string;
}

interface ChildSelectorProps {
  children: Child[];
  selectedId: string;
}

export function ChildSelector({ children, selectedId }: ChildSelectorProps) {
  if (children.length <= 1) return null;

  const pathname = usePathname();

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Users size={16} className="text-slate-400 shrink-0" />
      <span className="text-sm text-slate-500 font-medium mr-1">Filho(a):</span>
      <div className="flex gap-2 flex-wrap">
        {children.map((child) => (
          <Link
            key={child.id}
            href={`${pathname}?filho=${child.id}`}
            className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-bold transition-all active:scale-95 ${
              child.id === selectedId
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            {child.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
