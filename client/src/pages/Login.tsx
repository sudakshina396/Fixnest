import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { setCredentials } from '../store/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [otpInConsole, setOtpInConsole] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetComplete, setResetComplete] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const requestOtp = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const endpoint = resetMode ? '/auth/forgot-password/send-otp' : adminMode ? '/auth/admin-login' : '/auth/login/send-otp';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetMode ? { email } : { email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not verify your password.');
      setOtpInConsole(result.delivery === 'console');
      setShowOtp(true);
      setOtp('');
    } catch (error) {
      setMessage(error instanceof TypeError && error.message === 'Failed to fetch'
        ? 'Cannot reach the API server. Check that the backend is running.'
        : error instanceof Error ? error.message : 'Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void requestOtp();
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(resetMode ? { email, otp, newPassword } : { email, otp }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not verify the code.');
      if (resetMode) {
        setResetComplete(true);
        setResetMode(false);
        setShowOtp(false);
        setOtp('');
        setPassword('');
        setNewPassword('');
        setMessage(result.message || 'Password updated. You can now sign in.');
        return;
      }
      dispatch(setCredentials({
        token: result.token,
        user: { ...result.user, name: result.user.name || result.user.email },
      }));
      setPassword('');
      if (result.user.role === 'admin') {
        navigate('/admin/services');
      } else {
          const returnPath = (location.state as { from?: string } | null)?.from;
          navigate(returnPath === '/cart' || returnPath === '/account' || returnPath?.startsWith('/services/') ? returnPath : '/');
      }
    } catch (error) {
      setMessage(error instanceof TypeError && error.message === 'Failed to fetch'
        ? 'Cannot reach the API server. Check that the backend is running.'
        : error instanceof Error ? error.message : 'Could not reach the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const changeLoginMethod = (isAdmin: boolean) => {
    setAdminMode(isAdmin);
    setMessage('');
    setShowOtp(false);
    setOtp('');
    setResetMode(false);
    setNewPassword('');
    setResetComplete(false);
    setPassword('');
  };

  const startPasswordReset = () => {
    setResetMode(true);
    setResetComplete(false);
    setShowOtp(false);
    setPassword('');
    setOtp('');
    setNewPassword('');
    setMessage('');
  };

  const loginDescription = resetComplete
    ? 'Your password has been changed. Sign in with your new password.'
    : showOtp && resetMode
      ? otpInConsole
        ? 'Email delivery is not configured. In development, the OTP is printed in the server terminal.'
        : `Enter the 6-digit code sent to ${email}, then choose a new password.`
      : showOtp
        ? otpInConsole
          ? 'Email delivery is not configured. In development, the OTP is printed in the server terminal.'
          : `Enter the 6-digit code sent to ${email}.`
        : resetMode
          ? 'Enter your email and we’ll send a verification code.'
          : adminMode
            ? 'Enter your admin password, then verify the email code.'
            : 'Enter your password, then verify the email code.';

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">{resetMode ? 'Reset your password' : 'Welcome back'}</h1>
          <p className="text-slate-500">{loginDescription}</p>
          {message && <p role={resetComplete ? 'status' : 'alert'} className={`mt-3 rounded-lg border px-3 py-2.5 text-sm ${resetComplete ? 'border-brand-200 bg-brand-50 text-brand-800' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>{message}</p>}
        </div>

        {!showOtp && !resetMode && (
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
            <button type="button" onClick={() => changeLoginMethod(false)} aria-pressed={!adminMode} className={`rounded-md px-3 py-2 text-sm font-medium ${adminMode ? 'text-slate-600' : 'bg-white text-slate-900 shadow-sm'}`}>
              User
            </button>
            <button type="button" onClick={() => changeLoginMethod(true)} aria-pressed={adminMode} className={`rounded-md px-3 py-2 text-sm font-medium ${adminMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'}`}>
              Admin
            </button>
          </div>
        )}

        {resetComplete ? (
          <button type="button" onClick={() => { setResetComplete(false); setMessage(''); }} className="btn-primary w-full py-3">Back to login</button>
        ) : showOtp ? (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <label className="block text-center text-sm font-medium text-slate-700">Email verification code
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]{6}"
                required
                autoComplete="one-time-code"
                className="input-field mt-2 text-center font-mono text-2xl tracking-widest"
                placeholder="------"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))}
              />
            </label>
            {resetMode && <label className="block text-left text-sm font-medium text-slate-700">New password
              <input type="password" minLength={8} autoComplete="new-password" required className="input-field mt-2" placeholder="At least 8 characters" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
            </label>}
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 disabled:opacity-60">
              {isLoading ? (resetMode ? 'Updating password…' : 'Verifying…') : resetMode ? 'Verify code and reset password' : 'Verify and sign in'}
            </button>
            <div className="flex justify-between text-sm">
              <button type="button" disabled={isLoading} onClick={() => void requestOtp()} className="font-medium text-brand-600 hover:underline disabled:opacity-60">Resend code</button>
              <button type="button" disabled={isLoading} onClick={() => { setShowOtp(false); setOtp(''); setNewPassword(''); setMessage(''); if (resetMode) setResetMode(false); }} className="text-slate-600 hover:underline disabled:opacity-60">Back</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">{adminMode ? 'Admin email' : 'Email address'}
              <input type="email" autoComplete="username" required className="input-field mt-1" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            {!resetMode && <label className="block text-sm font-medium text-slate-700">Password
              <input type="password" autoComplete="current-password" required className="input-field mt-1" value={password} onChange={(event) => setPassword(event.target.value)} />
            </label>}
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 disabled:opacity-60">
              {isLoading ? (resetMode ? 'Sending reset code…' : 'Sending OTP…') : resetMode ? 'Send reset code' : 'Sent OTP'}
            </button>
            {!resetMode && <button type="button" onClick={startPasswordReset} className="block w-full text-center text-sm font-medium text-brand-700 hover:underline">Forgot password?</button>}
            {resetMode && <button type="button" onClick={() => { setResetMode(false); setMessage(''); }} className="block w-full text-center text-sm text-slate-600 hover:underline">Back to login</button>}
            {!adminMode && <p className="text-center text-sm text-slate-600">New to Fixnest? <Link to="/signup" className="font-medium text-brand-700 hover:underline">Create an account</Link></p>}
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Login;
