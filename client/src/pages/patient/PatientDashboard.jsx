import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ClipboardList } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { SkeletonCard } from '../../components/common/Skeleton';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { formatDate } from '../../utils/formatDate';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await api.get('/auth/me');
        const patientProfile = meRes.data.data?.patientProfile;
        if (!patientProfile?._id) {
          // User is logged in but has no patient profile yet
          setLoading(false);
          return;
        }
        const apptRes = await api.get(`/patients/${patientProfile._id}/appointments`);
        setAppointments(apptRes.data.data || []);
      } catch (err) {
        console.error('PatientDashboard error:', err.response?.data || err.message);
        setError(err.response?.data?.message || 'Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const upcoming = appointments.filter((a) => !['completed', 'cancelled', 'no-show'].includes(a.status));
  const past = appointments.filter((a) => ['completed', 'cancelled', 'no-show'].includes(a.status));

  return (
    <PageWrapper>
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-[20px] font-medium text-[#0F172A]">Welcome, {user?.firstName}</h1>
        <p className="text-xs sm:text-[13px] text-[#94A3B8] mt-0.5">Your appointments</p>
      </div>

      {loading ? (
        <div className="space-y-3"><SkeletonCard /><SkeletonCard /></div>
      ) : error ? (
        <div className="bg-[#FEE2E2] border border-[#FCA5A5] rounded-[8px] p-3 sm:p-4">
          <p className="text-xs sm:text-[13px] text-[#991B1B]">{error}</p>
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState icon={Calendar} title="No appointments" description="You have no appointments yet." />
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {upcoming.length > 0 && (
            <div>
              <p className="text-[11px] sm:text-[12px] font-medium text-[#94A3B8] uppercase tracking-wide mb-2 sm:mb-3">Upcoming</p>
              <div className="space-y-3">
                {upcoming.map((appt) => {
                  const intake = appt.intakeSessionId;
                  const intakeComplete = intake?.status === 'completed';
                  const doctor = appt.doctorId || {};
                  return (
                    <Card key={appt._id}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex-1">
                          <p className="text-sm sm:text-[14px] font-medium text-[#0F172A]">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </p>
                          <p className="text-xs sm:text-[13px] text-[#94A3B8] mt-0.5">
                            {formatDate(appt.appointmentDate)} · {appt.slot?.startTime}
                          </p>
                          {appt.chiefComplaint && (
                            <p className="text-xs sm:text-[13px] text-[#475569] mt-1 line-clamp-2">{appt.chiefComplaint}</p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                          <Badge variant="primary" className="capitalize text-xs">{appt.status}</Badge>
                          {!intakeComplete ? (
                            <Button size="sm" onClick={() => navigate(`/intake/${appt._id}`)} className="w-full sm:w-auto text-xs">
                              <ClipboardList size={12} className="sm:w-[14px] sm:h-[14px]" /> Complete Check-in
                            </Button>
                          ) : (
                            <Badge variant="success" className="text-xs">Check-in done</Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <p className="text-[11px] sm:text-[12px] font-medium text-[#94A3B8] uppercase tracking-wide mb-2 sm:mb-3">Past</p>
              <div className="space-y-3">
                {past.map((appt) => {
                  const doctor = appt.doctorId || {};
                  return (
                    <Card key={appt._id}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm sm:text-[14px] font-medium text-[#0F172A]">
                            Dr. {doctor.firstName} {doctor.lastName}
                          </p>
                          <p className="text-xs sm:text-[13px] text-[#94A3B8] mt-0.5">
                            {formatDate(appt.appointmentDate)} · {appt.slot?.startTime}
                          </p>
                        </div>
                        <Badge variant={appt.status === 'completed' ? 'success' : 'default'} className="capitalize text-xs self-start sm:self-auto">
                          {appt.status}
                        </Badge>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </PageWrapper>
  );
};

export default PatientDashboard;
