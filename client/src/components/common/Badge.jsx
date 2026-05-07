import React from 'react';
import { cn } from '../../utils/cn';

const variants = {
  default:  'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-600',
  primary:  'bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 shadow-sm shadow-teal-200',
  success:  'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 shadow-sm shadow-emerald-200',
  warning:  'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 shadow-sm shadow-amber-200',
  danger:   'bg-gradient-to-r from-red-100 to-rose-100 text-red-700 shadow-sm shadow-red-200',
  critical: 'bg-gradient-to-r from-red-900 to-rose-900 text-red-200 shadow-lg shadow-red-500/50 animate-pulse',
};

const urgencyVariants = {
  low:      'success',
  moderate: 'warning',
  high:     'danger',
  critical: 'critical',
};

const Badge = ({ children, variant = 'default', urgency, className, dot }) => {
  const v = urgency ? urgencyVariants[urgency] || 'default' : variant;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[4px] text-[12px] font-medium',
      variants[v],
      className
    )}>
      {dot && urgency === 'critical' && (
        <span className="w-1.5 h-1.5 rounded-full bg-[#FCA5A5] animate-pulse" />
      )}
      {children}
    </span>
  );
};

export default Badge;
