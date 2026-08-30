import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50',
  {
    variants: {
      variant: {
        default: 'bg-neutral-800 text-neutral-300 border border-neutral-700',
        gold: 'bg-amber-500/10 text-amber-400 border border-amber-500/30',
        fire: 'bg-red-500/10 text-red-400 border border-red-500/30',
        mint: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30',
        outline: 'bg-transparent border border-neutral-600 text-neutral-400',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants };
