import { useState } from 'react';
import { motion } from 'framer-motion';
import { useDispatch } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { setCredentials } from '../store/slices/authSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
type AuthResult = {
  token: string;
  user: { id: string; email: string; name?: string; role: 'customer' | 'worker' | 'admin' };
};

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const finishLogin = (result: AuthResult) => {
    dispatch(setCredentials({
      token: result.token,
      user: { ...result.user, name: result.user.name || result.user.email },
    }));
    setPassword('');
    if (result.user.role === 'admin') {
      navigate('/admin/services');
      return;
    }
    const returnPath = (location.state as { from?: string } | null)?.from;
    navigate(returnPath === '/cart' || returnPath === '/account' || returnPath?.startsWith('/services/') ? returnPath : '/');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');
    try {
      const endpoint = adminMode ? '/auth/admin-login' : '/auth/login';
      const response = await fetch(API_URL + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not sign in.');
      finishLogin(result);
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
    setPassword('');
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl"
      >
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500">{adminMode ? 'Sign in to manage Fixnest services.' : 'Sign in with your email and password.'}</p>
          {message && <p role="alert" className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700">{message}</p>}
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          <button type="button" onClick={() => changeLoginMethod(false)} aria-pressed={!adminMode} className={'rounded-md px-3 py-2 text-sm font-medium ' + (adminMode ? 'text-slate-600' : 'bg-white text-slate-900 shadow-sm')}>
            User
          </button>
          <button type="button" onClick={() => changeLoginMethod(true)} aria-pressed={adminMode} className={'rounded-md px-3 py-2 text-sm font-medium ' + (adminMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600')}>
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700">{adminMode ? 'Admin email' : 'Email address'}
            <input type="email" autoComplete="username" required className="input-field mt-1" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label className="block text-sm font-medium text-slate-700">Password
            <input type="password" autoComplete="current-password" required className="input-field mt-1" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 disabled:opacity-60">
            {isLoading ? 'Signing in…' : 'Log in'}
          </button>
          {!adminMode && <p className="text-center text-sm text-slate-600">New to Fixnest? <Link to="/signup" className="font-medium text-brand-700 hover:underline">Create an account</Link></p>}
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
