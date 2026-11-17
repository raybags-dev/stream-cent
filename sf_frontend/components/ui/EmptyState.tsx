import React from 'react';
import { Film, Plus } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center mb-4 text-neutral-400">
        {icon || <Film className="w-7 h-7 text-[#e50914]" />}
      </div>
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-neutral-400 mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction} leftIcon={<Plus className="w-4 h-4" />}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
