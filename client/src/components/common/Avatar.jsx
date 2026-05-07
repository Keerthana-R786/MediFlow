import React from 'react';
import { cn } from '../../utils/cn';

const colors = [
  'bg-[#E0F2FE] text-[#0284C7]',
  'bg-[#DCFCE7] text-[#166534]',
  'bg-[#FEF9C3] text-[#854D0E]',
  'bg-[#FEE2E2] text-[#991B1B]',
  'bg-[#F3E8FF] text-[#7E22CE]',
];

const getColor = (name = '') => colors[name.charCodeAt(0) % colors.length];

const Avatar = ({ name = '', src, size = 'md', className }) => {
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const sizeClass = size === 'sm' ? 'w-7 h-7 text-[11px]' : size === 'lg' ? 'w-12 h-12 text-[16px]' : 'w-9 h-9 text-[13px]';

  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover', sizeClass, className)} />;
  }

  return (
    <div className={cn('rounded-full flex items-center justify-center font-medium flex-shrink-0', sizeClass, getColor(name), className)}>
      {initials}
    </div>
  );
};

export default Avatar;
