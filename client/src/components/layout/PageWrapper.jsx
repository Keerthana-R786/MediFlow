import React from 'react';
import Sidebar from './Sidebar';

const PageWrapper = ({ children }) => (
  <div className="flex min-h-screen bg-[#F8FAFC]">
    <Sidebar />
    <main className="flex-1 overflow-auto">
      <div className="page-enter p-8 max-w-[1200px]">
        {children}
      </div>
    </main>
  </div>
);

export default PageWrapper;
