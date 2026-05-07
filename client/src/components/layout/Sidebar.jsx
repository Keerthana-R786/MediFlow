import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Users, Settings, LogOut,
  ClipboardList, UserCheck, BarChart3, Stethoscope, Pill
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { cn } from '../../utils/cn';

const navByRole = {
  doctor: [
    { to: '/doctor/dashboard', icon: LayoutDashboard, label: "Today's Patients" },
    { to: '/doctor/appointments', icon: Calendar, label: 'All Appointments' },
    { to: '/doctor/patients', icon: Users, label: 'Patient Records' },
  ],
  receptionist: [
    { to: '/receptionist/queue', icon: ClipboardList, label: 'Queue' },
    { to: '/receptionist/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/receptionist/patients', icon: Users, label: 'Patients' },
  ],
  admin: [
    { to: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/clinic', icon: Settings, label: 'Clinic Settings' },
  ],
  patient: [
    { to: '/patient/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/patient/appointments', icon: Calendar, label: 'Appointments' },
    { to: '/patient/prescriptions', icon: Pill, label: 'Prescriptions' },
  ],
};

const Sidebar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const items = navByRole[user?.role] || [];

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch (_) {}
    logout();
    navigate('/login');
  };

  return (
    <aside className="w-[240px] min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col flex-shrink-0 shadow-2xl">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-700/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/50">
            <Stethoscope size={16} className="text-white" />
          </div>
          <span className="text-white font-semibold text-[16px] tracking-tight">MediFlow</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            )}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-slate-700/50 space-y-0.5">
        <div className="px-3 py-2">
          <p className="text-[13px] text-white font-medium">{user?.firstName} {user?.lastName}</p>
          <p className="text-[12px] text-teal-400 capitalize">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[13px] text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
