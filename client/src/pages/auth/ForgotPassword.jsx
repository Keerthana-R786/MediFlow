import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Stethoscope, Mail, ArrowLeft } from 'lucide-react';
import Button from '../../components/common/Button';
import api from '../../services/api';

const ForgotPassword = () => {
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data) => {
    await api.post('/auth/forgot-password', data);
    setSent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-teal-500/30">
            <Stethoscope size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-800">MediFlow</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-slate-200/50 backdrop-blur-xl">
          {sent ? (
            <div className="text-center py-4 animate-scale-in">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-teal-100 to-cyan-100 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20">
                <Mail size={32} className="text-teal-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Check your email</h1>
              <p className="text-slate-600 leading-relaxed">
                If that email is registered, we've sent a password reset link. Please check your inbox.
              </p>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-800 mb-2">Reset your password</h1>
              <p className="text-slate-500 mb-6">Enter your email and we'll send you a reset link</p>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className={`h-11 px-4 rounded-xl border-2 bg-white text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 ${errors.email ? 'border-red-300' : 'border-slate-200'}`}
                    {...register('email', { required: 'Email required' })}
                  />
                  {errors.email && <span className="text-xs text-red-600">{errors.email.message}</span>}
                </div>

                <Button type="submit" className="w-full h-11 font-semibold" loading={isSubmitting}>
                  Send reset link
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="inline-flex items-center gap-2 text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
