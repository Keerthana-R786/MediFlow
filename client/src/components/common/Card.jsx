import React from 'react';
import { cn } from '../../utils/cn';

const Card = ({ children, className, onClick, ...props }) => (
  <div
    className={cn(
      'bg-white border border-[#E2E8F0] rounded-[12px] p-6',
      onClick && 'cursor-pointer hover:shadow-md transition-shadow duration-150',
      className
    )}
    onClick={onClick}
    {...props}
  >
    {children}
  </div>
);

export default Card;
