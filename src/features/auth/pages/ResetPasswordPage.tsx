import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import { KeyRound, Loader2, CheckCircle2, Smartphone, Mail } from 'lucide-react';
import axios from 'axios';
import { authService } from '../../../features/auth/services/authService';
import Input from '../../../components/ui/Input';
import Toast, { type ToastType } from '../../../components/ui/Toast';

const resetSchema = z.object({
  otp_code: z.string().trim().min(1, "OTP code is required").optional(),
  password: z.string().min(8, "Password must be at least 8 characters").refine((value) => /\d/.test(value), "Password must contain at least one number"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetData = z.infer<typeof resetSchema>;

const getResetErrorMessage = (error: unknown) => {
  if (!axios.isAxiosError(error)) return 'Unable to reset your password. Check your connection and try again.';
  const data = error.response?.data as { error?: string; detail?: string } | undefined;
  return data?.error || data?.detail || 'Unable to reset your password. Please try again.';
};

const ResetPasswordPage: React.FC = () => {
  const { token: urlToken } = useParams<{ token: string }>(); 
  const [searchParams] = useSearchParams();
  const tokenFromQuery = searchParams.get('token');
  const tempIdFromQuery = searchParams.get('temp_id');
  
  // Final token check (from URL path or Query string)
  const activeToken = urlToken || tokenFromQuery;
  const resetMethod = activeToken ? 'email' : tempIdFromQuery ? 'sms' : null;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: ToastType }>({
    show: false, msg: '', type: 'info'
  });

  const showToast = (msg: string, type: ToastType) => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(p => ({ ...p, show: false })), 4000);
  };

  const { register, handleSubmit, formState: { errors } } = useForm<ResetData>({
    resolver: zodResolver(resetSchema),
  });

  const onResetSubmit = async (data: ResetData) => {
    setLoading(true);
    try {
      if (resetMethod === 'email') {
        if (!activeToken) {
          showToast("Missing reset token. Please check your email link.", "error");
          setLoading(false);
          return;
        }
        await authService.resetPasswordConfirm({
          token: activeToken,
          password: data.password,
          confirm_password: data.confirmPassword
        });
      } else {
        if (!tempIdFromQuery || !data.otp_code) {
          showToast("Missing reset session or OTP code. Start forgot password again.", "error");
          setLoading(false);
          return;
        }
        await authService.verifyResetOTP({
          temp_id: tempIdFromQuery,
          otp_code: data.otp_code,
          new_password: data.password,
          confirm_password: data.confirmPassword
        });
      }

      setSuccess(true);
      showToast("Password updated successfully!", "success");
      setTimeout(() => navigate('/login'), 3000);
    } catch (error: unknown) {
      showToast(getResetErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-tertiary p-10 rounded-[3rem] border border-secondary/5 shadow-2xl"
      >
        <header className="mb-10 text-center">
          <div className="flex justify-center mb-4">
            {resetMethod === 'sms' ? <Smartphone className="text-secondary/20" size={32}/> : <Mail className="text-secondary/20" size={32}/>}
          </div>
          <h1 className="font-header text-3xl font-black text-secondary tracking-tighter uppercase">
            {resetMethod === 'sms' ? "Verify" : "New"} <span className="font-light">Password</span>
          </h1>
          <p className="text-[10px] text-secondary/40 uppercase tracking-[0.3em] mt-3 font-bold">
            {resetMethod === 'sms' ? "Enter the OTP sent to your phone" : "Secure your account credentials"}
          </p>
        </header>

        {success ? (
          <div className="text-center py-10 space-y-4">
            <CheckCircle2 size={48} className="text-green-500 mx-auto animate-bounce" />
            <p className="text-xs font-black uppercase tracking-widest text-secondary">Success!</p>
            <p className="text-[10px] text-secondary/50 uppercase">Redirecting to login...</p>
          </div>
        ) : !resetMethod ? (
          <div className="space-y-4 text-center">
            <p className="text-sm text-red-600">This reset link is missing or invalid. Please start again from Forgot Password.</p>
            <button type="button" onClick={() => navigate('/login')} className="text-xs font-bold text-secondary underline">Back to login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onResetSubmit)} className="space-y-6">
            <div className="space-y-4">
              {resetMethod === 'sms' && (
                <>
                  <Input 
                    label="OTP Code" 
                    type="text" 
                    placeholder="123456"
                    {...register("otp_code")} 
                    error={errors.otp_code?.message} 
                    autoComplete="one-time-code"
                  />
                </>
              )}

              <Input 
                label="New Password" 
                type="password" 
                placeholder="••••••••"
                {...register("password")} 
                error={errors.password?.message} 
                autoComplete="new-password"
              />
              <Input 
                label="Confirm New Password" 
                type="password" 
                placeholder="••••••••"
                {...register("confirmPassword")} 
                error={errors.confirmPassword?.message} 
                autoComplete="new-password"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full group flex items-center justify-between py-6 border-b border-secondary/10 hover:border-secondary transition-all disabled:opacity-50"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.5em] text-secondary">
                {loading ? "Processing..." : "Reset Password"}
              </span>
              {loading ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : (
                <KeyRound size={16} className="group-hover:rotate-12 transition-transform" />
              )}
            </button>
          </form>
        )}
      </motion.div>

      <Toast 
        isVisible={toast.show} 
        message={toast.msg} 
        type={toast.type} 
        onClose={() => setToast(p => ({...p, show: false}))} 
      />
    </div>
  );
};

export default ResetPasswordPage;
