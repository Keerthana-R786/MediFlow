import React, { useEffect, useState } from 'react';
import { Users, Calendar, Activity, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import PageWrapper from '../../components/layout/PageWrapper';
import { SkeletonCard } from '../../components/common/Skeleton';
import api from '../../services/api';

const URGENCY_COLORS = { low: '#10B981', moderate: '#F59E0B', high: '#EF4444', critical: '#450A0A' };

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then((r) => setStats(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <PageWrapper><div className="space-y-4"><SkeletonCard /><SkeletonCard /></div></PageWrapper>;
  }

  const urgencyData = stats?.urgencyDist?.map((d) => ({ name: d._id, value: d.count })) || [];

  return (
    <PageWrapper>
      <h1 className="text-[20px] font-medium text-[#0F172A] mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Patients', value: stats?.totalPatients, icon: Users },
          { label: 'Appointments Today', value: stats?.appointmentsToday, icon: Calendar },
          { label: 'Intake Completion', value: `${stats?.intakeCompletionRate}%`, icon: Activity },
          { label: 'Avg. Brief Gen Time', value: `${stats?.avgBriefGenTime}s`, icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white border border-[#E2E8F0] rounded-[12px] p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[12px] text-[#94A3B8]">{label}</span>
              <Icon size={14} className="text-[#CBD5E1]" />
            </div>
            <p className="text-[22px] font-medium text-[#0F172A]">{value ?? '—'}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Appointments per day */}
        <div className="col-span-2 bg-white border border-[#E2E8F0] rounded-[12px] p-5">
          <p className="text-[13px] font-medium text-[#0F172A] mb-4">Appointments — Last 30 Days</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats?.appointmentsByDay || []}>
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#0EA5E9" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Urgency distribution */}
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-5">
          <p className="text-[13px] font-medium text-[#0F172A] mb-4">Urgency Distribution</p>
          {urgencyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={urgencyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                  {urgencyData.map((entry) => (
                    <Cell key={entry.name} fill={URGENCY_COLORS[entry.name] || '#94A3B8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #E2E8F0', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[13px] text-[#94A3B8]">No data yet</div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default AdminDashboard;
