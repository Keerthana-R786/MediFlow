import React from 'react';
import { Inbox } from 'lucide-react';

const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-4">
      <Icon size={20} className="text-[#94A3B8]" />
    </div>
    <p className="text-[14px] font-medium text-[#334155]">{title}</p>
    {description && <p className="text-[13px] text-[#94A3B8] mt-1 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;
