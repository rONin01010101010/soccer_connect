import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import { FiMail, FiLock, FiArrowLeft, FiArrowRight, FiCheck } from 'react-icons/fi';
import { GiSoccerBall } from 'react-icons/gi';
import { authAPI } from '../api/auth';

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = email, 2 = new password
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm({ resolver: zodResolver(emailSchema) });

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
  } = useForm({ resolver: zodResolver(passwordSchema) });

  const onEmailSubmit = async ({ email }) => {
    setIsChecking(true);
    try {
      const res = await authAPI.checkEmail(email);
      const available = res.data?.data?.available ?? res.data?.available;
      if (available) {
        // email not in system
        toast.error('No account found with that email address');
        return;
      }
      setVerifiedEmail(email);
      setStep(2);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsChecking(false);
    }
  };

  const onPasswordSubmit = async ({ newPassword }) => {
    setIsResetting(true);
    try {
      await authAPI.resetPasswordDirect(verifiedEmail, newPassword);
      toast.success('Password reset! You can now sign in.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center px-4 py-12">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }} />
      </div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#22c55e]/5 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#0d1219] border border-[#1c2430] rounded-2xl p-8">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1a5f2a] mb-6">
              <GiSoccerBall className="w-8 h-8 text-[#4ade80]" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {step === 1 ? 'Forgot Password' : 'Set New Password'}
            </h1>
            <p className="text-[#64748b] text-sm">
              {step === 1
                ? 'Enter your account email to get started'
                : `Setting new password for ${verifiedEmail}`}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-3 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center gap-3 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  step > s
                    ? 'bg-[#22c55e] text-white'
                    : step === s
                    ? 'bg-[#1a5f2a] border-2 border-[#4ade80] text-[#4ade80]'
                    : 'bg-[#141c28] border border-[#2a3a4d] text-[#64748b]'
                }`}>
                  {step > s ? <FiCheck className="w-4 h-4" /> : s}
                </div>
                {s < 2 && (
                  <div className={`flex-1 h-0.5 ${step > s ? 'bg-[#22c55e]' : 'bg-[#2a3a4d]'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Email */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit(onEmailSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    autoFocus
                    className={`w-full pl-12 pr-4 py-3 bg-[#141c28] border rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4ade80]/50 transition-colors ${
                      emailErrors.email ? 'border-[#ef4444]' : 'border-[#2a3a4d]'
                    }`}
                    {...registerEmail('email')}
                  />
                </div>
                {emailErrors.email && (
                  <p className="mt-1 text-xs text-[#ef4444]">{emailErrors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isChecking}
                className="w-full py-3 bg-[#1a5f2a] text-[#4ade80] font-semibold rounded-lg border border-[#22c55e]/30 hover:bg-[#22723a] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChecking ? (
                  <span className="w-5 h-5 border-2 border-[#4ade80]/30 border-t-[#4ade80] rounded-full animate-spin" />
                ) : (
                  <>
                    Continue
                    <FiArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Step 2: New Password */}
          {step === 2 && (
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2">
                  New Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    autoFocus
                    className={`w-full pl-12 pr-4 py-3 bg-[#141c28] border rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4ade80]/50 transition-colors ${
                      passwordErrors.newPassword ? 'border-[#ef4444]' : 'border-[#2a3a4d]'
                    }`}
                    {...registerPassword('newPassword')}
                  />
                </div>
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-xs text-[#ef4444]">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#64748b] uppercase tracking-wider mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748b]" />
                  <input
                    type="password"
                    placeholder="Re-enter your password"
                    className={`w-full pl-12 pr-4 py-3 bg-[#141c28] border rounded-lg text-white placeholder-[#64748b] focus:outline-none focus:border-[#4ade80]/50 transition-colors ${
                      passwordErrors.confirmPassword ? 'border-[#ef4444]' : 'border-[#2a3a4d]'
                    }`}
                    {...registerPassword('confirmPassword')}
                  />
                </div>
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-xs text-[#ef4444]">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#141c28] border border-[#2a3a4d] text-[#94a3b8] rounded-lg hover:bg-[#1c2430] transition-colors"
                >
                  <FiArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="flex-1 py-3 bg-[#1a5f2a] text-[#4ade80] font-semibold rounded-lg border border-[#22c55e]/30 hover:bg-[#22723a] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResetting ? (
                    <span className="w-5 h-5 border-2 border-[#4ade80]/30 border-t-[#4ade80] rounded-full animate-spin" />
                  ) : (
                    <>
                      <FiCheck className="w-5 h-5" />
                      Reset Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-[#64748b] hover:text-[#4ade80] transition-colors inline-flex items-center gap-1">
              <FiArrowLeft className="w-3 h-3" />
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
