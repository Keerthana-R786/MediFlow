import React from 'react';
import { cn } from '../../utils/cn';

const Skeleton = ({ className, ...props }) => (
  <div className={cn('skeleton rounded-[8px]', className)} {...props} />
);

export const SkeletonCard = () => (
  <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-6 space-y-3">
    <Skeleton className="h-4 w-1/3" />
    <Skeleton className="h-3 w-full" />
    <Skeleton className="h-3 w-4/5" />
    <Skeleton className="h-3 w-2/3" />
  </div>
);

export const SkeletonRow = () => (
  <div className="flex items-center gap-4 py-3 border-b border-[#F1F5F9]">
    <Skeleton className="w-9 h-9 rounded-full" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-3 w-1/3" />
    </div>
    <Skeleton className="h-6 w-16 rounded-[4px]" />
  </div>
);

export default Skeleton;
