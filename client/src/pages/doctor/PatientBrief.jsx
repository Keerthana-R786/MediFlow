import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, ChevronLeft, Printer, Pill } from 'lucide-react';
import PageWrapper from '../../components/layout/PageWrapper';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Avatar from '../../components/common/Avatar';
import { SkeletonCard } from '../../components/common/Skeleton';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';
import { formatDate, getAge } from '../../utils/formatDate';

const severityStyles = {
  high:     'border-l-[#EF4444] bg-[#FFF5F5]',
  moderate: 'border-l-[#F59E0B] bg-[#FFFBEB]',
  low:      'border-l-[#CBD5E1] bg-[#F8FAFC]',
};
const severityIconColors = {
  high:     'text-[#EF4444]',
  moderate: 'text-[#F59E0B]',
  low:      'text-[#94A3B8]',
};

// Get patient name from populated brief data
const getPatientName = (brief) => {
  const p = brief.patientId;
  if (!p) return 'Patient';
  const u = p.userId;
  if (u && u.firstName) return `${u.firstName} ${u.lastName || ''}`.trim();
  return 'Patient';
};

const PatientBrief = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [appointmentStatus, setAppointmentStatus] = useState('');
  const pollRef = useRef(null);
  const notesTimer = useRef(null);

  const fetchBrief = async () => {
    try {
      const res = await api.get(`/briefs/${appointmentId}`);
      if (res.status === 202) {
        setGenerating(true);
        return false;
      }
      const brief = res.data.data;
      if (brief.status === 'generating') {
        setGenerating(true);
        return false;
      }
      setData(brief);
      setNotes(brief.doctorNotes || '');
      setAppointmentStatus(brief.appointmentId?.status || 'scheduled');
      setGenerating(false);
      if (!brief.isRead) {
        api.put(`/briefs/${brief._id}/read`).catch(() => {});
      }
      return true;
    } catch (err) {
      if (err.response?.status === 202) {
        setGenerating(true);
        return false;
      }
      toast.error('Failed to load brief');
      return true;
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchBrief().then((done) => {
      setLoading(false);
      if (!done) {
        pollRef.current = setInterval(async () => {
          const done = await fetchBrief();
          if (done) clearInterval(pollRef.current);
        }, 3000);
      }
    });
    return () => clearInterval(pollRef.current);
  }, [appointmentId]);

  const handleNotesChange = (e) => {
    setNotes(e.target.value);
    setNotesSaved(false);
    clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      if (data?._id) {
        await api.put(`/briefs/${data._id}/notes`, { notes: e.target.value });
        setNotesSaved(true);
      }
    }, 1000);
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    setData(null);
    await api.post(`/briefs/${appointmentId}/generate`);
    pollRef.current = setInterval(async () => {
      const done = await fetchBrief();
      if (done) clearInterval(pollRef.current);
    }, 3000);
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await api.put(`/appointments/${appointmentId}/status`, { status: newStatus });
      setAppointmentStatus(newStatus);
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to update status');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
      </PageWrapper>
    );
  }

  if (generating || !data) {
    return (
      <PageWrapper>
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-2 border-[#0EA5E9] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-[14px] font-medium text-[#0F172A]">Generating brief...</p>
          <p className="text-[13px] text-[#94A3B8] mt-1">This usually takes 10–20 seconds</p>
        </div>
      </PageWrapper>
    );
  }

  const patient = data.patientId || {};
  const patientUser = patient.userId || {};
  const name = getPatientName(data);
  const age = getAge(patient.dateOfBirth);
  const appt = data.appointmentId || {};

  return (
    <PageWrapper>
      <div className="no-print flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-[13px] text-[#94A3B8] hover:text-[#475569]">
          <ChevronLeft size={16} /> Back
        </button>
      </div>

      <div className="flex gap-6">
        {/* Left — Brief content */}
        <div className="flex-[2] space-y-5">
          {/* Header */}
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-[18px] font-medium text-[#0F172A]">{name}</h1>
                  {age && <span className="text-[13px] text-[#94A3B8]">{age}y</span>}
                  {patient.gender && <span className="text-[13px] text-[#94A3B8] capitalize">{patient.gender}</span>}
                </div>
                <p className="text-[13px] text-[#94A3B8]">
                  {appt.slot?.startTime && `${appt.slot.startTime} · `}{appt.type}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {data.urgencyLevel && <Badge urgency={data.urgencyLevel} dot>{data.urgencyLevel} urgency</Badge>}
                
                {/* Status Dropdown */}
                <select
                  value={appointmentStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="h-9 px-3 rounded-[8px] border border-[#E2E8F0] bg-white text-[13px] text-[#0F172A] font-medium focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] cursor-pointer"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="checked-in">Checked In</option>
                  <option value="in-progress">In Consultation</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <Button size="sm" variant="secondary" onClick={() => window.print()}>
                  <Printer size={14} /> Print
                </Button>
                <Button size="sm" onClick={() => navigate(`/doctor/prescription/${appointmentId}`)}>
                  <Pill size={14} /> Prescription
                </Button>
                <Button size="sm" variant="secondary" onClick={handleRegenerate}>
                  Regenerate
                </Button>
              </div>
            </div>

            {/* Status timeline */}
            <div className="flex items-center mt-4 pt-4 border-t border-[#F1F5F9]">
              {[
                { label: 'Scheduled', status: 'scheduled' },
                { label: 'Checked In', status: 'checked-in' },
                { label: 'Brief Ready', status: 'brief-ready' },
                { label: 'In Consultation', status: 'in-progress' },
                { label: 'Completed', status: 'completed' }
              ].map((step, i) => {
                const isActive = 
                  (step.status === 'scheduled') ||
                  (step.status === 'checked-in' && ['checked-in', 'in-progress', 'completed'].includes(appointmentStatus)) ||
                  (step.status === 'brief-ready' && data) ||
                  (step.status === 'in-progress' && ['in-progress', 'completed'].includes(appointmentStatus)) ||
                  (step.status === 'completed' && appointmentStatus === 'completed');
                
                return (
                  <React.Fragment key={step.status}>
                    <div className="flex flex-col items-center">
                      <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-[#0EA5E9]' : 'bg-[#E2E8F0]'}`} />
                      <span className="text-[10px] text-[#94A3B8] mt-1 whitespace-nowrap">{step.label}</span>
                    </div>
                    {i < 4 && <div className={`flex-1 h-px ${isActive ? 'bg-[#0EA5E9]' : 'bg-[#E2E8F0]'} mb-3`} />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Chief Complaint */}
          {data.chiefComplaint && (
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
              <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide mb-2">Chief Complaint</p>
              <blockquote className="text-[16px] text-[#0F172A] font-medium border-l-4 border-[#0EA5E9] pl-4 italic">
                "{data.chiefComplaint}"
              </blockquote>
            </div>
          )}

          {/* Symptom Summary */}
          {data.symptomSummary && (
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
              <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide mb-2">Symptom Summary</p>
              <p className="text-[14px] text-[#334155] leading-relaxed">{data.symptomSummary}</p>
            </div>
          )}

          {/* Clinical Timeline */}
          {data.clinicalTimeline && (
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
              <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide mb-3">Clinical Timeline</p>
              <p className="text-[14px] text-[#334155] leading-relaxed">{data.clinicalTimeline}</p>
            </div>
          )}

          {/* Risk Flags */}
          {data.riskFlags?.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
              <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide mb-3">Risk Flags</p>
              <div className="space-y-2">
                {data.riskFlags.map((flag, i) => (
                  <div key={i} className={`border-l-4 rounded-r-[8px] p-3 ${severityStyles[flag.severity] || severityStyles.low}`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={14} className={`mt-0.5 flex-shrink-0 ${severityIconColors[flag.severity]}`} />
                      <div>
                        <p className="text-[13px] font-medium text-[#0F172A]">{flag.flag}</p>
                        {flag.notes && <p className="text-[12px] text-[#475569] mt-0.5">{flag.notes}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Focus Areas */}
          {data.suggestedFocusAreas?.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
              <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide mb-3">Suggested Focus Areas</p>
              <div className="flex flex-wrap gap-2">
                {data.suggestedFocusAreas.map((area, i) => (
                  <span key={i} className="px-3 py-1 bg-[#E0F2FE] text-[#0284C7] rounded-[9999px] text-[12px] font-medium">{area}</span>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Investigations */}
          {data.suggestedTests?.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
              <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide mb-3">Suggested Investigations</p>
              <ol className="space-y-2">
                {data.suggestedTests.map((test, i) => (
                  <li key={i} className="flex gap-3 text-[13px]">
                    <span className="text-[#94A3B8] font-medium w-5 flex-shrink-0">{i + 1}.</span>
                    <span className="text-[#334155]">{test}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Differential Clusters */}
          {data.differentialClusters?.length > 0 && (
            <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
              <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide mb-3">Differential Clusters</p>
              <div className="flex flex-wrap gap-2">
                {data.differentialClusters.map((c, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[#F1F5F9] text-[#475569] rounded-[8px] text-[13px]">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Doctor Notes */}
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide">Doctor Notes</p>
              {notesSaved && (
                <span className="flex items-center gap-1 text-[11px] text-[#10B981]">
                  <CheckCircle size={12} /> Saved
                </span>
              )}
            </div>
            <textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Add your notes here..."
              rows={4}
              className="w-full px-3 py-2 rounded-[8px] border border-[#E2E8F0] text-[13px] text-[#334155] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] resize-none"
            />
          </div>
        </div>

        {/* Right — Patient profile sidebar */}
        <div className="w-[280px] flex-shrink-0 space-y-4">
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
            <div className="flex flex-col items-center text-center mb-4">
              <Avatar name={name} size="lg" className="mb-3" />
              <p className="text-[14px] font-medium text-[#0F172A]">{name}</p>
              <p className="text-[12px] text-[#94A3B8]">
                {age ? `${age} years` : ''}
                {patient.gender ? ` · ${patient.gender}` : ''}
                {patient.bloodGroup ? ` · ${patient.bloodGroup}` : ''}
              </p>
              {patientUser.email && (
                <p className="text-[11px] text-[#94A3B8] mt-1">{patientUser.email}</p>
              )}
            </div>

            {patient.allergies?.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide mb-2">Allergies</p>
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies.map((a, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#FEE2E2] text-[#991B1B] rounded-[4px] text-[11px] font-medium">
                      {a.substance}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {patient.currentMedications?.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide mb-2">Current Medications</p>
                <ul className="space-y-1">
                  {patient.currentMedications.map((m, i) => (
                    <li key={i} className="text-[12px] text-[#334155]">
                      {m.name} {m.dosage && `— ${m.dosage}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {patient.medicalHistory?.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-[#94A3B8] uppercase tracking-wide mb-2">Medical History</p>
                <ul className="space-y-1">
                  {patient.medicalHistory.map((h, i) => (
                    <li key={i} className="text-[12px] text-[#334155]">
                      {h.condition}{h.diagnosedYear ? ` (${h.diagnosedYear})` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {patient.allergies?.length === 0 && patient.currentMedications?.length === 0 && patient.medicalHistory?.length === 0 && (
              <p className="text-[12px] text-[#94A3B8] text-center">No medical history on file</p>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default PatientBrief;
