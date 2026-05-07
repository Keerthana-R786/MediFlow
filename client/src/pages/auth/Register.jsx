import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Stethoscope, CheckCircle2 } from 'lucide-react';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const steps = ['Account', 'Personal', 'Done'];

const step1Schema = z.object({
  firstName: z.string().min(2, 'First name required'),
  lastName:  z.string().min(2, 'Last name required'),
  email:     z.string().email('Enter a valid email'),
  password:  z.string().min(8, 'Minimum 8 characters'),
  phone:     z.string().optional(),
});

const step2Schema = z.object({
  dateOfBirth: z.string().optional(),
  gender:      z.string().optional(),
});

const Register = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const schema = step === 0 ? step1Schema : step2Schema;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (data) => {
    const merged = { ...formData, ...data };
    if (step === 0) {
      setFormData(merged);
      setStep(1);
      return;
    }
    try {
      const res = await api.post('/auth/register', { ...merged, role: 'patient' });
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      setStep(2);
      setTimeout(() => navigate('/patient/dashboard'), 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Stethoscope size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800">MediFlow</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200/50 backdrop-blur-xl">
          {/* Step indicator */}
          <div className="flex items-center gap-0 mb-8">
            {steps.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${i <= step ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg shadow-teal-500/30' : 'bg-slate-200 text-slate-500'}`}>
                    {i + 1}
                  </div>
                  <span className={`text-sm ${i === step ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>{s}</span>
                </div>
                {i < steps.length - 1 && <div className={`h-0.5 w-full mx-2 ${i < step ? 'bg-gradient-to-r from-teal-500 to-cyan-500' : 'bg-slate-200'}`} />}
              </div>
            ))}
          </div>

          {step === 2 ? (
            <div className="text-center py-8 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Account created successfully!</h2>
              <p className="text-slate-500">Redirecting to your dashboard...</p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Create your account</h1>
              <p className="text-slate-500 mb-6">Join MediFlow for better healthcare</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {step === 0 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">First name</label>
                        <input
                          className={`h-11 px-4 rounded-xl border-2 bg-white text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${errors.firstName ? 'border-red-300' : 'border-slate-200'}`}
                          {...register('firstName')}
                        />
                        {errors.firstName && <span className="text-xs text-red-600">{errors.firstName.message}</span>}
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-slate-700">Last name</label>
                        <input
                          className={`h-11 px-4 rounded-xl border-2 bg-white text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${errors.lastName ? 'border-red-300' : 'border-slate-200'}`}
                          {...register('lastName')}
                        />
                        {errors.lastName && <span className="text-xs text-red-600">{errors.lastName.message}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Email</label>
                      <input
                        type="email"
                        placeholder="you@example.com"
                        className={`h-11 px-4 rounded-xl border-2 bg-white text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${errors.email ? 'border-red-300' : 'border-slate-200'}`}
                        {...register('email')}
                      />
                      {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Password</label>
                      <input
                        type="password"
                        placeholder="Min. 8 characters"
                        className={`h-11 px-4 rounded-xl border-2 bg-white text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${errors.password ? 'border-red-300' : 'border-slate-200'}`}
                        {...register('password')}
                      />
                      {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Phone (optional)</label>
                      <input
                        type="tel"
                        placeholder="+91 98765 43210"
                        className="h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        {...register('phone')}
                      />
                    </div>
                  </>
                )}
                {step === 1 && (
                  <>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Date of birth (optional)</label>
                      <input
                        type="date"
                        className="h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        {...register('dateOfBirth')}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-700">Gender (optional)</label>
                      <select
                        className="h-11 px-4 rounded-xl border-2 border-slate-200 bg-white text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                        {...register('gender')}
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </>
                )}
                <div className="flex gap-3 pt-2">
                  {step > 0 && (
                    <Button type="button" variant="secondary" onClick={() => setStep(step - 1)} className="flex-1 h-11">
                      Back
                    </Button>
                  )}
                  <Button type="submit" loading={isSubmitting} className="flex-1 h-11 font-semibold">
                    {step === 1 ? 'Create account' : 'Continue'}
                  </Button>
                </div>
              </form>
            </>
          )}

          {step === 0 && (
            <p className="text-center text-sm text-slate-600 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-teal-600 hover:text-teal-700 transition-colors">Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
