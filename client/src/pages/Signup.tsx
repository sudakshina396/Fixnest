import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { setCredentials } from '../store/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const requestErrorMessage = (error: unknown, fallback: string) => {
  if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
    return 'The request took too long. Check the backend terminal for a development OTP, then try again.';
  }
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Cannot reach the API server. Check that the backend is running.';
  }
  return error instanceof Error ? error.message : fallback;
};

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [otpInConsole, setOtpInConsole] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/auth/signup/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone, password }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not send the verification code.');
      setOtpInConsole(result.delivery === 'console');
      setShowOtp(true);
    } catch (error) {
      setMessage(requestErrorMessage(error, 'Could not reach the server. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/auth/signup/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone, password }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not resend the verification code.');
      setOtpInConsole(result.delivery === 'console');
    } catch (error) {
      setMessage(requestErrorMessage(error, 'Could not resend the verification code.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, name, phone }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not verify the code.');
      dispatch(setCredentials({
        token: result.token,
        user: { ...result.user, name: result.user.name || name || result.user.email },
      }));
      const returnPath = (location.state as { from?: string } | null)?.from;
      navigate(returnPath === '/cart' || returnPath === '/account' ? returnPath : '/');
    } catch (error) {
      setMessage(requestErrorMessage(error, 'Could not reach the server. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-slate-50 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-brand-600">Fixnest</h1>
          <h2 className="mb-2 text-2xl font-bold text-slate-900">Create an account</h2>
          <p className="text-slate-500">Join Fixnest to book trusted professionals.</p>
        </div>

        {message && <p role="alert" className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{message}</p>}

        {!showOtp ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Full name
              <input type="text" required autoComplete="name" className="input-field mt-1" placeholder="John Doe" value={name} onChange={(event) => setName(event.target.value)} />
            </label>
            <label className="block text-sm font-medium text-slate-700">Email address
              <input type="email" required autoComplete="email" className="input-field mt-1" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </label>
            <label className="block text-sm font-medium text-slate-700">Phone number
              <input type="tel" required autoComplete="tel-national" inputMode="numeric" maxLength={10} pattern="[0-9]{10}" title="Enter a 10-digit mobile number." className="input-field mt-1" placeholder="9876543210" value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} />
              <span className="mt-1 block text-xs font-normal text-slate-500">Enter a 10-digit mobile number.</span>
            </label>
            <label className="block text-sm font-medium text-slate-700">Password
              <input type="password" required minLength={8} autoComplete="new-password" className="input-field mt-1" value={password} onChange={(event) => setPassword(event.target.value)} />
              <span className="mt-1 block text-xs font-normal text-slate-500">Use at least 8 characters.</span>
            </label>
            <button type="submit" disabled={isLoading} className="btn-primary mt-4 w-full py-3 disabled:opacity-60">
              {isLoading ? 'Sending…' : 'Continue'}
            </button>
            <p className="text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-medium text-brand-700 hover:underline">Log in</Link></p>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <p className="text-center text-sm text-slate-600">
              {otpInConsole
                ? 'Email delivery is not configured. In development, the OTP is printed in the server terminal.'
                : `Enter the 6-digit verification code sent to ${email}.`}
            </p>
            <label className="block text-center text-sm font-medium text-slate-700">Verification code
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
            <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 disabled:opacity-60">
              {isLoading ? 'Verifying…' : 'Verify and create account'}
            </button>
            <button type="button" disabled={isLoading} onClick={() => void handleResendOtp()} className="block w-full text-center text-sm font-medium text-brand-600 hover:underline disabled:opacity-60">
              Resend code
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default Signup;
