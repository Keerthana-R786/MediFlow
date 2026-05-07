import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FileText } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonRow } from '../../components/common/Skeleton';
import api from '../../services/api';
import { getAge } from '../../utils/formatDate';

const getPatientName = (appt) => {
  const p = appt.patientId;
  if (!p) return 'Unknown';
  const u = p.userId;
  if (u && u.firstName) return `${u.firstName} ${u.lastName || ''}`.trim();
  if (p.firstName) return `${p.firstName} ${p.lastName || ''}`.trim();
  return 'Unknown';
};

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const params = dateFilter ? `?date=${dateFilter}` : '';
    api.get(`/appointments${params}`)
      .then((r) => setAppointments(r.data.data.appointments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [dateFilter]);

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[20px] font-medium text-[#0F172A]">Appointments</h1>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-10 px-3 rounded-[8px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
        />
      </div>

      <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
            <tr>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Patient</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Date & Time</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Type</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Status</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Urgency</th>
              <th className="text-right px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Brief</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={6} className="px-4"><SkeletonRow /></td></tr>
              ))
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <EmptyState title="No appointments" description="No appointments found for the selected date." />
                </td>
              </tr>
            ) : (
              appointments.map((appt) => {
                const name = getPatientName(appt);
                const age = getAge(appt.patientId?.dateOfBirth);
                const urgency = appt.patientBriefId?.urgencyLevel || appt.intakeSessionId?.urgencyLevel;

                return (
                  <tr key={appt._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-[13px] font-medium text-[#0F172A]">{name}</p>
                      {age && <p className="text-[11px] text-[#94A3B8]">{age}y</p>}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#475569]">
                      {format(new Date(appt.appointmentDate), 'dd MMM')} · {appt.slot?.startTime}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-[4px] capitalize">
                        {appt.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] px-2 py-0.5 bg-[#F1F5F9] text-[#475569] rounded-[4px] capitalize">
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {urgency
                        ? <Badge urgency={urgency}>{urgency}</Badge>
                        : <span className="text-[12px] text-[#94A3B8]">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/doctor/brief/${appt._id}`)}>
                        <FileText size={14} /> View
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </PageWrapper>
  );
};

export default AppointmentList;
