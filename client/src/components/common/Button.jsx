import React from 'react';
import { cn } from '../../utils/cn';

const variants = {
  primary:   'bg-gradient-to-r from-[#14B8A6] to-[#06B6D4] text-white hover:from-[#0D9488] hover:to-[#0891B2] border border-transparent shadow-lg shadow-teal-500/30',
  secondary: 'bg-white text-[#334155] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]',
  success:   'bg-gradient-to-r from-[#10B981] to-[#059669] text-white hover:from-[#059669] hover:to-[#047857] border border-transparent shadow-lg shadow-emerald-500/30',
  danger:    'bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white hover:from-[#DC2626] hover:to-[#B91C1C] border border-transparent shadow-lg shadow-red-500/30',
  ghost:     'bg-transparent text-[#475569] hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 border border-transparent',
};

const Button = React.forwardRef(({
  children, variant = 'primary', size = 'md',
  className, loading, disabled, ...props
}, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-[8px]',
        'transition-colors duration-150 ease-in-out',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        size === 'sm' ? 'h-8 px-3 text-[13px]' : 'h-10 px-4 text-[14px]',
        variants[variant],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
