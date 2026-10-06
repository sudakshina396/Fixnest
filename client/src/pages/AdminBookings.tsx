import { useCallback, useEffect, useState } from 'react';
import { CalendarDays, RefreshCw, UserRound, Wrench } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
type Worker = { _id: string; name: string; phone: string; verificationStatus: string };
type Booking = { _id: string; userId?: { name: string; email: string; phone?: string }; serviceId?: { name: string; category: string }; workerId?: Worker; scheduledDate: string; scheduledTime: string; price: number; status: string; address?: { city?: string; house?: string; street?: string } };
const statuses = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ON_THE_WAY', 'STARTED', 'COMPLETED', 'CANCELLED'];
const pretty = (value: string) => value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function AdminBookings() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      const [bookingResponse, workerResponse] = await Promise.all([
        fetch(`${API_URL}/bookings/admin/all`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/workers`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const [bookingData, workerData] = await Promise.all([bookingResponse.json(), workerResponse.json()]);
      if (!bookingResponse.ok) throw new Error(bookingData.message || 'Could not load bookings.');
      setBookings(bookingData.data || []);
      if (workerResponse.ok) setWorkers((workerData.data || []).filter((worker: Worker) => worker.verificationStatus === 'APPROVED'));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load bookings.'); }
  }, [token]);
  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (booking: Booking, status: string) => {
    setBusyId(booking._id); setError(''); setNotice('');
    try {
      const response = await fetch(`${API_URL}/bookings/${booking._id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not update booking.');
      setNotice(`Order status changed to ${pretty(status)}.`); await load();
    } catch (updateError) { setError(updateError instanceof Error ? updateError.message : 'Could not update booking.'); }
    finally { setBusyId(''); }
  };
  const assignWorker = async (booking: Booking, workerId: string) => {
    if (!workerId) return;
    setBusyId(booking._id); setError(''); setNotice('');
    try {
      const response = await fetch(`${API_URL}/bookings/${booking._id}/assign`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ workerId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not assign the professional.');
      setNotice('Professional assigned and customer notified.'); await load();
    } catch (assignError) { setError(assignError instanceof Error ? assignError.message : 'Could not assign the professional.'); }
    finally { setBusyId(''); }
  };

  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-brand-700">Admin workspace</p><h1 className="mt-1 text-3xl font-semibold text-slate-950">Booking dashboard</h1><p className="mt-2 text-sm text-slate-600">Assign approved professionals and keep customers updated.</p></div><button type="button" onClick={() => void load()} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={16} /> Refresh</button></div>
    {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}{notice && <p role="status" className="mt-5 rounded-xl bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    <section className="mt-7 grid gap-4">{bookings.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-slate-500">No bookings have been placed yet.</div> : bookings.map((booking) => <article key={booking._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="grid gap-5 lg:grid-cols-[1fr_auto]"><div><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{booking.serviceId?.category}</p><h2 className="mt-1 text-lg font-semibold text-slate-950">{booking.serviceId?.name || 'Service'}</h2><p className="mt-1 break-all text-xs text-slate-400">#{booking._id}</p></div><span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{pretty(booking.status)}</span></div><div className="mt-4 grid gap-3 text-sm text-slate-600 sm:grid-cols-2"><p className="flex gap-2"><UserRound size={16} className="shrink-0" />{booking.userId?.name || booking.userId?.email}<br />{booking.userId?.phone}</p><p className="flex gap-2"><CalendarDays size={16} className="shrink-0" />{booking.scheduledDate} at {booking.scheduledTime}</p><p className="flex gap-2"><Wrench size={16} className="shrink-0" />{booking.address?.house}, {booking.address?.street}, {booking.address?.city}</p><p className="font-semibold text-slate-900">₹{booking.price} · cash</p></div>{booking.workerId && <p className="mt-3 text-sm text-green-800">Professional: {booking.workerId.name} · {booking.workerId.phone}</p>}</div>
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 lg:min-w-60 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0"><label className="text-xs font-semibold text-slate-600">Assign approved professional<select disabled={Boolean(booking.workerId) || busyId === booking._id || workers.length === 0} defaultValue="" onChange={(event) => void assignWorker(booking, event.target.value)} className="input-field mt-1 text-sm"><option value="">{booking.workerId ? 'Already assigned' : workers.length ? 'Select professional' : 'No approved professionals'}</option>{workers.map((worker) => <option key={worker._id} value={worker._id}>{worker.name} · {worker.phone}</option>)}</select></label><label className="text-xs font-semibold text-slate-600">Update booking status<select disabled={busyId === booking._id} value={booking.status} onChange={(event) => void updateStatus(booking, event.target.value)} className="input-field mt-1 text-sm">{statuses.map((status) => <option key={status} value={status}>{pretty(status)}</option>)}</select></label></div>
    </div></article>)}</section>
  </main>;
}
