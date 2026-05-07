import React from 'react';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Button from '../../components/common/Button';

// CheckIn is handled inline in Queue; this is a redirect fallback
const CheckIn = () => {
  const navigate = useNavigate();
  return (
    <PageWrapper>
      <div className="flex flex-col items-center justify-center py-24">
        <p className="text-[14px] text-[#475569] mb-4">Check-in is managed from the Queue view.</p>
        <Button onClick={() => navigate('/receptionist/queue')}>Go to Queue</Button>
      </div>
    </PageWrapper>
  );
};

export default CheckIn;
