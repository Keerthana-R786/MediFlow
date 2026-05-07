import React from 'react';
import { Stethoscope } from 'lucide-react';

const AuthLayout = ({ children }) => (
  <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
    <div className="w-full max-w-[380px]">
      <div className="flex items-center justify-center gap-2 mb-8">
        <Stethoscope size={20} className="text-[#0EA5E9]" />
        <span className="text-[18px] font-medium text-[#0F172A]">MediFlow</span>
      </div>
      {children}
    </div>
  </div>
);

export default AuthLayout;
