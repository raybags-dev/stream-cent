import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-md transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 select-none whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0b0f] active:scale-[0.98]';

    const variants = {
      primary: 'bg-[#e50914] text-white hover:bg-[#b80710] active:bg-[#990008] shadow-sm',
      secondary: 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm active:bg-white/10',
      outline: 'border border-white/30 text-white hover:border-white hover:bg-white/10',
      ghost: 'text-neutral-300 hover:text-white hover:bg-white/10',
      danger: 'bg-red-900/80 text-red-200 hover:bg-red-800 border border-red-700/50',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[36px] gap-1.5',
      md: 'text-sm px-4 py-2 min-h-[42px] gap-2',
      lg: 'text-base px-6 py-3 min-h-[48px] gap-2.5 font-bold',
      icon: 'p-2.5 min-w-[42px] min-h-[42px] aspect-square rounded-full',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
