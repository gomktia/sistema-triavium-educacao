'use client';

import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';

interface Child {
  id: string;
  name: string;
  grade: string;
}

interface ChildSelectorProps {
  children: Child[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function ChildSelector({ children, selectedId, onSelect }: ChildSelectorProps) {
  if (children.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 mb-6">
      <Users size={16} className="text-slate-400" />
      <span className="text-sm text-slate-500 font-medium mr-2">Filho(a):</span>
      <div className="flex gap-2">
        {children.map((child) => (
          <Button
            key={child.id}
            variant={child.id === selectedId ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelect(child.id)}
            className={child.id === selectedId ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          >
            {child.name}
          </Button>
        ))}
      </div>
    </div>
  );
}
