import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Search, UserPlus, FileText, Send, X } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import EmptyState from '../../components/common/EmptyState';
import Input from '../../components/common/Input';
import { SkeletonRow } from '../../components/common/Skeleton';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import { getAge } from '../../utils/formatDate';

// Extract patient name from deeply populated appointment
const getPatientName = (appt) => {
  const p = appt.patientId;
  if (!p) return 'Unknown';
  const u = p.userId;
  if (u && u.firstName) return `${u.firstName} ${u.lastName || ''}`.trim();
  if (p.firstName) return `${p.firstName} ${p.lastName || ''}`.trim();
  return 'Unknown';
};

const Queue = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm();

  useEffect(() => {
    loadQueue();
  }, []);

  const loadQueue = () => {
    api.get('/appointments/queue')
      .then((r) => setAppointments(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  const loadModalData = async () => {
    setModalLoading(true);
    try {
      const [pRes, dRes] = await Promise.all([
        api.get('/patients?limit=100'),
        api.get('/appointments/doctors'),
      ]);
      setPatients(pRes.data.data.patients || []);
      setDoctors(dRes.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patients or doctors');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOpenModal = () => {
    setShowModal(true);
    loadModalData();
  };

  const handleCloseModal = () => {
    setShowModal(false);
    reset();
  };

  const onSubmitAppointment = async (data) => {
    try {
      await api.post('/appointments', {
        patientId:       data.patientId,
        doctorId:        data.doctorId,
        appointmentDate: data.appointmentDate,
        slot:            { startTime: data.startTime },
        type:            data.type,
        chiefComplaint:  data.chiefComplaint,
      });
      toast.success('Appointment created');
      handleCloseModal();
      loadQueue();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create appointment');
    }
  };

  const filtered = appointments.filter((a) => {
    const name = getPatientName(a).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const stats = {
    total:     appointments.length,
    checkedIn: appointments.filter((a) => a.status === 'checked-in').length,
    remaining: appointments.filter((a) => a.status === 'scheduled').length,
  };

  const handleCheckIn = async (id) => {
    const appt = appointments.find(a => a._id === id);
    const intakeComplete = appt?.intakeSessionId?.status === 'completed';
    
    // Warn if intake not completed
    if (!intakeComplete) {
      const proceed = window.confirm(
        'This patient has not completed their pre-visit check-in.\n\n' +
        'The doctor will not have an AI-generated brief.\n\n' +
        'Do you want to check them in anyway?'
      );
      if (!proceed) return;
    }
    
    try {
      await api.put(`/appointments/${id}/status`, { status: 'checked-in' });
      setAppointments((prev) => prev.map((a) => a._id === id ? { ...a, status: 'checked-in' } : a));
    } catch (err) {
      console.error('Check-in failed:', err);
      alert('Check-in failed. Please try again.');
    }
  };

  const copyIntakeLink = (apptId) => {
    const link = `${window.location.origin}/intake/${apptId}`;
    navigator.clipboard.writeText(link).catch(() => {});
    alert(`Intake link copied:\n${link}\n\nYou can share this with the patient.`);
  };

  const resendIntakeEmail = async (apptId) => {
    try {
      // This would require a backend endpoint to resend the email
      // For now, just copy the link
      copyIntakeLink(apptId);
    } catch (err) {
      console.error('Failed to resend:', err);
    }
  };

  return (
    <PageWrapper>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[20px] font-medium text-[#0F172A]">Queue</h1>
          <p className="text-[13px] text-[#94A3B8] mt-0.5">Today's appointments</p>
        </div>
        <Button onClick={handleOpenModal}>
          <UserPlus size={16} /> New Walk-in
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Appointments', value: stats.total },
          { label: 'Checked In',         value: stats.checkedIn },
          { label: 'Remaining',          value: stats.remaining },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-[#E2E8F0] rounded-[12px] p-4">
            <p className="text-[12px] text-[#94A3B8] mb-1">{label}</p>
            <p className="text-[22px] font-medium text-[#0F172A]">{value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
        <input
          type="text"
          placeholder="Search patients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-10 pl-10 pr-4 rounded-[8px] border border-[#E2E8F0] bg-white text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-[12px] overflow-hidden">
        <table className="w-full">
          <thead className="bg-[#F8FAFC] border-b border-[#F1F5F9]">
            <tr>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Token</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Patient</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Time</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Doctor</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Chief Complaint</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Urgency</th>
              <th className="text-left px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Intake</th>
              <th className="text-right px-4 py-3 text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={8} className="px-4"><SkeletonRow /></td></tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <EmptyState title="Queue is empty" description="No appointments scheduled for today." />
                </td>
              </tr>
            ) : (
              filtered.map((appt) => {
                const name = getPatientName(appt);
                const patient = appt.patientId || {};
                const age = getAge(patient.dateOfBirth);
                const doctor = appt.doctorId || {};
                const intake = appt.intakeSessionId;
                const urgency = appt.patientBriefId?.urgencyLevel || intake?.urgencyLevel;

                return (
                  <tr key={appt._id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-[13px] font-medium text-[#0F172A]">#{appt.tokenNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={name} size="sm" />
                        <div>
                          <p className="text-[13px] font-medium text-[#0F172A]">{name}</p>
                          {age && <p className="text-[11px] text-[#94A3B8]">{age}y{patient.gender ? ` · ${patient.gender}` : ''}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#475569]">{appt.slot?.startTime}</td>
                    <td className="px-4 py-3 text-[13px] text-[#475569]">
                      Dr. {doctor.firstName} {doctor.lastName}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[#475569] max-w-[180px] truncate">
                      {appt.chiefComplaint || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {urgency
                        ? <Badge urgency={urgency} dot>{urgency}</Badge>
                        : <span className="text-[12px] text-[#94A3B8]">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={intake?.status === 'completed' ? 'success' : 'warning'}>
                        {intake?.status === 'completed' ? 'Done' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {appt.status === 'scheduled' && (
                          <>
                            <Button size="sm" variant="secondary" onClick={() => handleCheckIn(appt._id)}>
                              Check In
                            </Button>
                            {intake?.status !== 'completed' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                title="Copy intake link to share with patient" 
                                onClick={() => copyIntakeLink(appt._id)}
                              >
                                <Send size={14} />
                              </Button>
                            )}
                          </>
                        )}
                        {appt.status === 'checked-in' && (
                          <span className="text-[11px] px-2 py-0.5 rounded-[4px] bg-[#E0F2FE] text-[#0284C7]">Checked In</span>
                        )}
                        {(appt.patientBriefId || intake?.status === 'completed') && (
                          <Button size="sm" variant="ghost" title="View Brief" onClick={() => navigate(`/doctor/brief/${appt._id}`)}>
                            <FileText size={14} />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Glassmorphism Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
            onClick={handleCloseModal}
          />
          
          {/* Modal */}
          <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-lg border border-white/50 animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200/50">
              <h2 className="text-lg font-semibold text-slate-800">New Walk-in Appointment</h2>
              <button 
                onClick={handleCloseModal}
                className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {modalLoading ? (
                <div className="text-center py-8">
                  <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-slate-500">Loading...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmitAppointment)} className="space-y-4">
                  {/* Patient */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Patient</label>
                    <select
                      className="h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      {...register('patientId', { required: 'Select a patient' })}
                    >
                      <option value="">Select patient</option>
                      {patients.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.user?.firstName || p.firstName} {p.user?.lastName || p.lastName}
                        </option>
                      ))}
                    </select>
                    {errors.patientId && <span className="text-xs text-red-600">{errors.patientId.message}</span>}
                  </div>

                  {/* Doctor */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Doctor</label>
                    <select
                      className="h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      {...register('doctorId', { required: 'Select a doctor' })}
                    >
                      <option value="">Select doctor</option>
                      {doctors.map((d) => (
                        <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
                      ))}
                    </select>
                    {errors.doctorId && <span className="text-xs text-red-600">{errors.doctorId.message}</span>}
                  </div>

                  {/* Date and Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Date</label>
                      <input
                        type="date"
                        className="h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        {...register('appointmentDate', { required: 'Date required' })}
                      />
                      {errors.appointmentDate && <span className="text-xs text-red-600">{errors.appointmentDate.message}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Time</label>
                      <input
                        type="time"
                        className="h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                        {...register('startTime', { required: 'Time required' })}
                      />
                      {errors.startTime && <span className="text-xs text-red-600">{errors.startTime.message}</span>}
                    </div>
                  </div>

                  {/* Type */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Type</label>
                    <select
                      className="h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      {...register('type')}
                    >
                      <option value="consultation">Consultation</option>
                      <option value="follow-up">Follow-up</option>
                      <option value="routine-checkup">Routine Checkup</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>

                  {/* Chief Complaint */}
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-slate-700">Chief Complaint</label>
                    <input
                      type="text"
                      placeholder="Reason for visit"
                      className="h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                      {...register('chiefComplaint')}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button 
                      type="button" 
                      variant="secondary" 
                      onClick={handleCloseModal} 
                      className="flex-1 h-11"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      loading={isSubmitting} 
                      className="flex-1 h-11 font-semibold"
                    >
                      Create Appointment
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </PageWrapper>
  );
};

export default Queue;
