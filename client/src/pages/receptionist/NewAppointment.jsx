import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const NewAppointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    Promise.all([
      // Use the patients endpoint which is accessible to receptionist
      api.get('/patients?limit=100'),
      // Use a dedicated staff endpoint accessible to receptionist
      api.get('/appointments/doctors'),
    ]).then(([pRes, dRes]) => {
      setPatients(pRes.data.data.patients || []);
      setDoctors(dRes.data.data || []);
    }).catch((err) => {
      console.error(err);
      toast.error('Failed to load patients or doctors');
    }).finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data) => {
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
      navigate('/receptionist/queue');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create appointment');
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-lg">
        <h1 className="text-[20px] font-medium text-[#0F172A] mb-6">New Appointment</h1>
        <Card>
          {loading ? (
            <p className="text-[13px] text-[#94A3B8]">Loading...</p>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Patient */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-[#334155]">Patient</label>
                <select
                  className="h-10 px-3 rounded-[8px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  {...register('patientId', { required: 'Select a patient' })}
                >
                  <option value="">Select patient</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.user?.firstName || p.firstName} {p.user?.lastName || p.lastName}
                    </option>
                  ))}
                </select>
                {errors.patientId && <span className="text-[12px] text-[#EF4444]">{errors.patientId.message}</span>}
              </div>

              {/* Doctor */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-[#334155]">Doctor</label>
                <select
                  className="h-10 px-3 rounded-[8px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  {...register('doctorId', { required: 'Select a doctor' })}
                >
                  <option value="">Select doctor</option>
                  {doctors.map((d) => (
                    <option key={d._id} value={d._id}>Dr. {d.firstName} {d.lastName}</option>
                  ))}
                </select>
                {errors.doctorId && <span className="text-[12px] text-[#EF4444]">{errors.doctorId.message}</span>}
              </div>

              <Input
                label="Appointment Date"
                type="date"
                {...register('appointmentDate', { required: 'Date required' })}
                error={errors.appointmentDate?.message}
              />
              <Input
                label="Start Time"
                type="time"
                {...register('startTime', { required: 'Time required' })}
                error={errors.startTime?.message}
              />

              {/* Type */}
              <div className="flex flex-col gap-1">
                <label className="text-[13px] font-medium text-[#334155]">Type</label>
                <select
                  className="h-10 px-3 rounded-[8px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  {...register('type')}
                >
                  <option value="consultation">Consultation</option>
                  <option value="follow-up">Follow-up</option>
                  <option value="routine-checkup">Routine Checkup</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <Input
                label="Chief Complaint"
                placeholder="Reason for visit"
                {...register('chiefComplaint')}
              />

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting} className="flex-1">
                  Create Appointment
                </Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default NewAppointment;
