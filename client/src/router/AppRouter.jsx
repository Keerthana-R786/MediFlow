import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { SkeletonCard } from '../components/common/Skeleton';

const Login            = lazy(() => import('../pages/auth/Login'));
const Register         = lazy(() => import('../pages/auth/Register'));
const ForgotPassword   = lazy(() => import('../pages/auth/ForgotPassword'));
const DoctorDashboard  = lazy(() => import('../pages/doctor/DoctorDashboard'));
const PatientBrief     = lazy(() => import('../pages/doctor/PatientBrief'));
const AppointmentList  = lazy(() => import('../pages/doctor/AppointmentList'));
const PrescriptionWriter = lazy(() => import('../pages/doctor/PrescriptionWriter'));
const Queue            = lazy(() => import('../pages/receptionist/Queue'));
const CheckIn          = lazy(() => import('../pages/receptionist/CheckIn'));
const AdminDashboard   = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminUsers       = lazy(() => import('../pages/admin/Users'));
const ClinicSettings   = lazy(() => import('../pages/admin/ClinicSettings'));
const IntakeFlow       = lazy(() => import('../pages/patient/IntakeFlow'));
const PatientDashboard = lazy(() => import('../pages/patient/PatientDashboard'));
const Prescriptions    = lazy(() => import('../pages/patient/Prescriptions'));
const NotFound         = lazy(() => import('../pages/NotFound'));

const Fallback = () => (
  <div className="p-8 space-y-4">
    <SkeletonCard /><SkeletonCard />
  </div>
);

const RootRedirect = () => {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  const map = { doctor: '/doctor/dashboard', receptionist: '/receptionist/queue', admin: '/admin/dashboard', patient: '/patient/dashboard' };
  return <Navigate to={map[user.role] || '/login'} replace />;
};

const AppRouter = () => (
  <BrowserRouter>
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Patient intake — accessible without full auth (uses appointmentId) */}
        <Route path="/intake/:appointmentId" element={<IntakeFlow />} />

        {/* Doctor */}
        <Route path="/doctor/dashboard" element={<ProtectedRoute roles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
        <Route path="/doctor/brief/:appointmentId" element={<ProtectedRoute roles={['doctor']}><PatientBrief /></ProtectedRoute>} />
        <Route path="/doctor/prescription/:appointmentId" element={<ProtectedRoute roles={['doctor']}><PrescriptionWriter /></ProtectedRoute>} />
        <Route path="/doctor/appointments" element={<ProtectedRoute roles={['doctor']}><AppointmentList /></ProtectedRoute>} />
        <Route path="/doctor/patients" element={<ProtectedRoute roles={['doctor', 'receptionist', 'admin']}><Queue /></ProtectedRoute>} />

        {/* Receptionist */}
        <Route path="/receptionist/queue" element={<ProtectedRoute roles={['receptionist', 'admin']}><Queue /></ProtectedRoute>} />
        <Route path="/receptionist/appointments" element={<ProtectedRoute roles={['receptionist', 'admin']}><AppointmentList /></ProtectedRoute>} />
        <Route path="/receptionist/patients" element={<ProtectedRoute roles={['receptionist', 'admin']}><Queue /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/clinic" element={<ProtectedRoute roles={['admin']}><ClinicSettings /></ProtectedRoute>} />

        {/* Patient */}
        <Route path="/patient/dashboard" element={<ProtectedRoute roles={['patient']}><PatientDashboard /></ProtectedRoute>} />
        <Route path="/patient/prescriptions" element={<ProtectedRoute roles={['patient']}><Prescriptions /></ProtectedRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default AppRouter;
