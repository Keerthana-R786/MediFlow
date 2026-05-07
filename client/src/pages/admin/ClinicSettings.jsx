import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import PageWrapper from '../../components/layout/PageWrapper';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const days = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];

const ClinicSettings = () => {
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    api.get('/admin/clinic').then((r) => {
      reset(r.data.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data) => {
    try {
      await api.put('/admin/clinic', data);
      toast.success('Clinic settings saved');
    } catch (err) {
      toast.error('Failed to save settings');
    }
  };

  if (loading) return <PageWrapper><div className="text-[13px] text-[#94A3B8]">Loading...</div></PageWrapper>;

  return (
    <PageWrapper>
      <h1 className="text-[20px] font-medium text-[#0F172A] mb-6">Clinic Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        <Card>
          <h2 className="text-[14px] font-medium text-[#0F172A] mb-4">General</h2>
          <div className="space-y-4">
            <Input label="Clinic Name" {...register('name')} />
            <Input label="Address" {...register('address')} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Phone" {...register('phone')} />
              <Input label="Email" type="email" {...register('email')} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[13px] font-medium text-[#334155]">Slot Duration (minutes)</label>
              <select className="h-10 px-3 rounded-[8px] border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]" {...register('slotDuration')}>
                <option value={10}>10 min</option>
                <option value={15}>15 min</option>
                <option value={20}>20 min</option>
                <option value={30}>30 min</option>
              </select>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-[14px] font-medium text-[#0F172A] mb-4">Working Hours</h2>
          <div className="space-y-3">
            {days.map((day) => (
              <div key={day} className="flex items-center gap-4">
                <div className="w-24">
                  <label className="flex items-center gap-2 text-[13px] text-[#334155] capitalize cursor-pointer">
                    <input type="checkbox" {...register(`workingHours.${day}.enabled`)} />
                    {day}
                  </label>
                </div>
                <Input type="time" {...register(`workingHours.${day}.start`)} containerClassName="flex-1" />
                <span className="text-[#94A3B8] text-[13px]">to</span>
                <Input type="time" {...register(`workingHours.${day}.end`)} containerClassName="flex-1" />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="text-[14px] font-medium text-[#0F172A] mb-4">Notifications</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...register('settings.emailNotifications')} className="w-4 h-4 rounded" />
              <div>
                <p className="text-[13px] font-medium text-[#334155]">Email notifications</p>
                <p className="text-[12px] text-[#94A3B8]">Send appointment confirmations and brief alerts</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...register('settings.autoIntake')} className="w-4 h-4 rounded" />
              <div>
                <p className="text-[13px] font-medium text-[#334155]">Auto-send intake link</p>
                <p className="text-[12px] text-[#94A3B8]">Automatically send intake link when appointment is created</p>
              </div>
            </label>
          </div>
        </Card>

        <Button type="submit" loading={isSubmitting}>Save Settings</Button>
      </form>
    </PageWrapper>
  );
};

export default ClinicSettings;
