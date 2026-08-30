import React, { cloneElement, isValidElement } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[2px] font-mono text-xs uppercase tracking-[.08em] transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-900 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        fire: 'bg-[#ff3c00] px-7 py-3.5 text-[#0d0d0d] hover:-translate-y-0.5 hover:bg-[#ff5520] hover:shadow-[0_0_48px_rgba(255,60,0,.35)]',
        gold: 'bg-[#f5a800] px-6 py-2.5 text-[#0d0d0d] hover:bg-[#ffbb1a] hover:shadow-[0_0_28px_rgba(245,168,0,.35)]',
        ghost:
          'border border-[#f5a800]/40 bg-transparent px-7 py-3.5 text-[#f5a800] hover:bg-[#f5a800]/6 hover:border-[#f5a800]',
      },
      size: { default: '', sm: 'px-4 py-2 text-[10px]' },
    },
    defaultVariants: { variant: 'gold', size: 'default' },
  }
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; children?: ReactNode }) {
  if (asChild && isValidElement(children)) {
    const childProps = children.props as { className?: string };
    return cloneElement(children as React.ReactElement<{ className?: string }>, {
      ...props,
      className: cn(buttonVariants({ variant, size, className }), childProps.className),
    });
  }
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props}>
      {children}
    </button>
  );
}
