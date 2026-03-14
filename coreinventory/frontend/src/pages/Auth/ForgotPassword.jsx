import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Box, Mail, Lock, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newpass
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const sendOTP = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const verifyOTP = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, otp });
      setResetToken(data.resetToken);
      setStep(3);
    } catch (err) { toast.error(err.response?.data?.message || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  const resetPass = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, password });
      toast.success('Password reset! Please login.');
      setStep(1);
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center"><Box size={16} className="text-white" /></div>
          <span className="font-bold text-white">CoreInventory</span>
        </div>

        {step === 1 && (
          <>
            <h2 className="text-2xl font-bold text-white mb-1">Forgot password?</h2>
            <p className="text-slate-400 text-sm mb-8">We'll send an OTP to your email</p>
            <form onSubmit={sendOTP} className="space-y-4">
              <div><label className="label">Email</label>
                <div className="relative"><Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input pl-9" placeholder="you@company.com" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center mb-4"><Shield size={20} className="text-amber-400" /></div>
            <h2 className="text-2xl font-bold text-white mb-1">Enter OTP</h2>
            <p className="text-slate-400 text-sm mb-8">Enter the 6-digit OTP sent to <span className="text-primary-400">{email}</span></p>
            <form onSubmit={verifyOTP} className="space-y-4">
              <div><label className="label">OTP Code</label>
                <input value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6} className="input text-center text-2xl tracking-widest font-mono" placeholder="• • • • • •" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <>
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-center mb-4"><Lock size={20} className="text-emerald-400" /></div>
            <h2 className="text-2xl font-bold text-white mb-1">New Password</h2>
            <p className="text-slate-400 text-sm mb-8">Choose a strong password</p>
            <form onSubmit={resetPass} className="space-y-4">
              <div><label className="label">New Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="input" placeholder="Min 6 characters" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-slate-500 mt-6">
          Remember it? <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
