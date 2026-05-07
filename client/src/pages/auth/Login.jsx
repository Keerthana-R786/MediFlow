import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Stethoscope, Shield, Zap, Heart } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

const Login = () => {
  const [showPass, setShowPass] = useState(false);
  const { setAuth } = useAuthStore();
  const toast = useToast();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const res = await api.post('/auth/login', data);
      const { user, accessToken } = res.data.data;
      setAuth(user, accessToken);
      const redirects = { doctor: '/doctor/dashboard', receptionist: '/receptionist/queue', admin: '/admin/dashboard', patient: '/patient/dashboard' };
      navigate(redirects[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:flex-1 relative overflow-hidden bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-700">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-300 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center shadow-2xl">
              <Stethoscope size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">MediFlow</h1>
              <p className="text-teal-100 text-sm">Healthcare Management System</p>
            </div>
          </div>
          
          <h2 className="text-4xl font-bold mb-4 leading-tight">
            Welcome to the Future<br />of Healthcare
          </h2>
          <p className="text-lg text-teal-50 mb-12 leading-relaxed max-w-md">
            Streamline your practice with AI-powered patient intake, intelligent briefs, and seamless workflow management.
          </p>
          
          <div className="space-y-4 max-w-md">
            {[
              { icon: Zap, text: 'AI-Powered Patient Intake' },
              { icon: Shield, text: 'Secure & HIPAA Compliant' },
              { icon: Heart, text: 'Better Patient Care' }
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <Icon size={20} />
                </div>
                <span className="font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Stethoscope size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">MediFlow</span>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200/50 backdrop-blur-xl">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Sign in to your account</h1>
              <p className="text-slate-500">Enter your credentials to continue</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Email Address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className={`h-11 w-full px-4 rounded-xl border-2 bg-white text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${errors.email ? 'border-red-300 focus:border-red-500' : 'border-slate-200'}`}
                  {...register('email')}
                />
                {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    className={`h-11 w-full px-4 pr-11 rounded-xl border-2 bg-white text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${errors.password ? 'border-red-300 focus:border-red-500' : 'border-slate-200'}`}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="text-xs text-red-600">{errors.password.message}</span>}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-teal-500 focus:ring-teal-500" />
                  <span className="group-hover:text-slate-800 transition-colors">Remember me</span>
                </label>
                <Link to="/forgot-password" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="w-full h-11 text-base font-semibold" loading={isSubmitting}>
                Sign in
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600">
                New patient?{' '}
                <Link to="/register" className="font-medium text-teal-600 hover:text-teal-700 transition-colors">
                  Create an account
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-slate-500 mt-6">
            Protected by enterprise-grade security
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
