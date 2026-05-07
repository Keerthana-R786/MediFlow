import React from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

const icons = {
  success: <CheckCircle size={16} className="text-[#10B981]" />,
  error:   <XCircle    size={16} className="text-[#EF4444]" />,
  info:    <Info       size={16} className="text-[#0EA5E9]" />,
};

const borderColors = {
  success: 'border-l-[#10B981]',
  error:   'border-l-[#EF4444]',
  info:    'border-l-[#0EA5E9]',
};

const ToastContainer = () => {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-3 bg-white border border-[#E2E8F0] border-l-4 ${borderColors[t.type] || borderColors.info} rounded-[8px] px-4 py-3 shadow-lg min-w-[280px] max-w-[360px] animate-[fadeIn_150ms_ease]`}
        >
          {icons[t.type]}
          <span className="flex-1 text-[13px] text-[#334155]">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="p-0.5 hover:bg-[#F1F5F9] rounded">
            <X size={14} className="text-[#94A3B8]" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
