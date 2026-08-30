import React from 'react';
import { cn } from '../../lib/utils';

export interface SwitchProps extends Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange'
> {
  label?: string;
  description?: string;
  onChange?: (checked: boolean) => void;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, description, id, checked, onChange, ...props }, ref) => {
    const switchId = id || `switch-${React.useId()}`;

    return (
      <div className="flex items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={label ? `${switchId}-label` : undefined}
          aria-describedby={description ? `${switchId}-description` : undefined}
          onClick={() => {
            // Direct toggle through onChange callback for proper ARIA support
            if (onChange) {
              onChange(!checked);
            }
          }}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:ring-offset-2 focus:ring-offset-neutral-900',
            checked ? 'bg-amber-500' : 'bg-neutral-700',
            className
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200',
              checked ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>

        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <label
                id={`${switchId}-label`}
                htmlFor={switchId}
                className="text-sm font-medium text-neutral-200"
              >
                {label}
              </label>
            )}
            {description && (
              <p id={`${switchId}-description`} className="text-xs text-neutral-500">
                {description}
              </p>
            )}
          </div>
        )}

        <input
          ref={ref}
          type="checkbox"
          id={switchId}
          className="sr-only"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          {...props}
        />
      </div>
    );
  }
);

Switch.displayName = 'Switch';

export { Switch };
