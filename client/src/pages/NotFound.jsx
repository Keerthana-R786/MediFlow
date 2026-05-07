import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope } from 'lucide-react';
import Button from '../components/common/Button';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mx-auto mb-4">
          <Stethoscope size={20} className="text-[#94A3B8]" />
        </div>
        <p className="text-[32px] font-medium text-[#0F172A]">404</p>
        <p className="text-[14px] text-[#94A3B8] mt-1 mb-6">This page doesn't exist.</p>
        <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    </div>
  );
};

export default NotFound;
