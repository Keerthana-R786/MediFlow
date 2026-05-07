import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import { SkeletonCard } from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import api from '../../services/api';
import { getAge } from '../../utils/formatDate';

const statusColors = {
  scheduled:    'bg-[#F1F5F9] text-[#475569]',
  'checked-in': 'bg-[#E0F2FE] text-[#0284C7]',
  'in-progress':'bg-[#FEF9C3] text-[#854D0E]',
  completed:    'bg-[#DCFCE7] text-[#166534]',
  cancelled:    'bg-[#FEE2E2] text-[#991B1B]',
};

const typeLabels = {
  consultation:     'Consultation',
  'follow-up':      'Follow-up',
  emergency:        'Emergency',
  'routine-checkup':'Routine',
};

// Extract patient name from deeply populated appointment
const getPatientName = (appt) => {
  const p = appt.patientId;
  if (!p) return 'Unknown Patient';
  const u = p.userId;
  if (u && u.firstName) return `${u.firstName} ${u.lastName || ''}`.trim();
  if (p.firstName) return `${p.firstName} ${p.lastName || ''}`.trim();
  return 'Unknown Patient';
};

const DoctorDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/appointments/today')
      .then((r) => setAppointments(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: newStatus });
      setAppointments((prev) => 
        prev.map((a) => a._id === appointmentId ? { ...a, status: newStatus } : a)
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const stats = {
    total:     appointments.length,
    completed: appointments.filter((a) => a.status === 'completed').length,
    remaining: appointments.filter((a) => ['scheduled', 'checked-in', 'in-progress'].includes(a.status)).length,
    avgUrgency: appointments.length
      ? (appointments.reduce((s, a) => s + (a.patientBriefId?.urgencyScore || a.intakeSessionId?.urgencyScore || 0), 0) / appointments.length).toFixed(1)
      : '—',
  };

  return (
    <PageWrapper>
      <div className="mb-6">
        <h1 className="text-[20px] font-medium text-[#0F172A]">
          {format(new Date(), 'EEEE, d MMMM')}
        </h1>
        <p className="text-[13px] text-[#94A3B8] mt-0.5">{appointments.length} patients scheduled today</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Today',   value: stats.total,      icon: Clock },
          { label: 'Completed',     value: stats.completed,  icon: CheckCircle },
          { label: 'Remaining',     value: stats.remaining,  icon: Clock },
          { label: 'Avg. Urgency',  value: stats.avgUrgency, icon: AlertTriangle },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-[#E2E8F0] rounded-[12px] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-[#94A3B8]">{label}</span>
              <Icon size={14} className="text-[#CBD5E1]" />
            </div>
            <p className="text-[22px] font-medium text-[#0F172A]">{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      ) : appointments.length === 0 ? (
        <EmptyState title="No appointments today" description="Your schedule is clear for today." />
      ) : (
        <div className="space-y-3">
          {appointments.map((appt) => {
            const name = getPatientName(appt);
            const age = getAge(appt.patientId?.dateOfBirth);
            const intake = appt.intakeSessionId;
            const brief = appt.patientBriefId;
            const urgency = brief?.urgencyLevel || intake?.urgencyLevel;
            const hasUnreadBrief = brief?.status === 'ready' && !brief?.isRead;

            return (
              <div
                key={appt._id}
                className={`bg-white border border-[#E2E8F0] rounded-[12px] p-4 flex items-center gap-4 ${hasUnreadBrief ? 'border-l-4 border-l-[#0EA5E9]' : ''}`}
              >
                <div className="w-16 text-center flex-shrink-0">
                  <p className="text-[13px] font-medium text-[#0F172A]">{appt.slot?.startTime}</p>
                  <p className="text-[11px] text-[#94A3B8]">#{appt.tokenNumber}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[14px] font-medium text-[#0F172A]">{name}</p>
                    {age && <span className="text-[12px] text-[#94A3B8]">{age}y</span>}
                  </div>
                  <p className="text-[13px] text-[#475569] truncate">{appt.chiefComplaint || 'No complaint specified'}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-[4px] font-medium ${statusColors[appt.status] || statusColors.scheduled}`}>
                    {appt.status}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#F1F5F9] text-[#475569]">
                    {typeLabels[appt.type] || appt.type}
                  </span>
                  {urgency && <Badge urgency={urgency} dot>{urgency}</Badge>}
                  <span className={`text-[11px] px-2 py-0.5 rounded-[4px] ${intake?.status === 'completed' ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FEF9C3] text-[#854D0E]'}`}>
                    {intake?.status === 'completed' ? 'Intake done' : 'Intake pending'}
                  </span>
                  
                  {/* Quick action buttons based on status */}
                  {appt.status === 'checked-in' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => handleStatusUpdate(appt._id, 'in-progress')}
                    >
                      Start Consultation
                    </Button>
                  )}
                  {appt.status === 'in-progress' && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => handleStatusUpdate(appt._id, 'completed')}
                    >
                      Mark Complete
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant={hasUnreadBrief ? 'primary' : 'secondary'}
                    onClick={() => navigate(`/doctor/brief/${appt._id}`)}
                  >
                    <FileText size={14} />
                    View Brief
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageWrapper>
  );
};

export default DoctorDashboard;
