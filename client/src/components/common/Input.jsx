import React from 'react';
import { cn } from '../../utils/cn';

const Input = React.forwardRef(({
  label, error, hint, className, containerClassName, ...props
}, ref) => {
  return (
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      {label && (
        <label className="text-[13px] font-medium text-[#334155]">{label}</label>
      )}
      <input
        ref={ref}
        className={cn(
          'h-10 px-3 rounded-[8px] border bg-white text-[#0F172A]',
          'placeholder:text-[#94A3B8]',
          'transition-colors duration-150',
          'focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:ring-offset-2 focus:border-[#0EA5E9]',
          error ? 'border-[#EF4444]' : 'border-[#E2E8F0]',
          className
        )}
        {...props}
      />
      {error && <span className="text-[12px] text-[#EF4444]">{error}</span>}
      {hint && !error && <span className="text-[12px] text-[#94A3B8]">{hint}</span>}
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
