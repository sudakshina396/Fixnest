import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { setCredentials } from '../store/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const response = await fetch(API_URL + '/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, phone, password }),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not create the account.');
      dispatch(setCredentials({
        token: result.token,
        user: { ...result.user, name: result.user.name || name || result.user.email },
      }));
      const returnPath = (location.state as { from?: string } | null)?.from;
      navigate(returnPath === '/cart' || returnPath === '/account' ? returnPath : '/');
    } catch (error) {
      if (error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)) {
        setMessage('The request took too long. Please try again.');
      } else if (error instanceof TypeError && error.message === 'Failed to fetch') {
        setMessage('Cannot reach the API server. Check that the backend is running.');
      } else {
        setMessage(error instanceof Error ? error.message : 'Could not reach the server. Please try again.');
      }
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

        <form onSubmit={handleSignup} className="space-y-4">
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
            {isLoading ? 'Creating account…' : 'Create account'}
          </button>
          <p className="text-center text-sm text-slate-600">Already have an account? <Link to="/login" className="font-medium text-brand-700 hover:underline">Log in</Link></p>
        </form>
      </motion.div>
    </div>
  );
};

export default Signup;
