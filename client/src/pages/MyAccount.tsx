import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CalendarDays, Clock3, RefreshCw, ShoppingBag, XCircle, MapPin, Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
type Order = { _id: string; serviceId?: { name: string; image?: string; category?: string } | null; workerId?: { name: string; phone?: string } | null; scheduledDate: string; scheduledTime: string; price: number; status: string; paymentStatus: string; paymentMethod?: string; address?: { city?: string }; review?: { rating: number; comment?: string } };
type Address = { _id: string; label?: string; fullName: string; phone: string; house: string; street: string; city: string; state: string; pincode: string; instructions?: string };
const canCancel = (status: string) => ['PENDING', 'CONFIRMED'].includes(status);
const titleCase = (value: string) => value.toLowerCase().replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export default function MyAccount() {
  const { token, user } = useSelector((state: RootState) => state.auth);
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState((location.state as { notice?: string } | null)?.notice || '');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressForm, setAddressForm] = useState({ label: 'Home', fullName: user?.name || '', phone: '', house: '', street: '', city: '', state: '', pincode: '' });
  const [addressError, setAddressError] = useState('');
  const [reschedulingId, setReschedulingId] = useState('');
  const [schedule, setSchedule] = useState({ scheduledDate: '', scheduledTime: '' });
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const loadOrders = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API_URL}/bookings`, { headers: { Authorization: `Bearer ${token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not load your orders.');
      setOrders(result.data || []);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : 'Could not load your orders.'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { void loadOrders(); }, [loadOrders]);

  const loadAddresses = useCallback(async () => {
    try { const response = await fetch(`${API_URL}/account/addresses`, { headers: { Authorization: `Bearer ${token}` } }); const result = await response.json(); if (response.ok) setAddresses(result.data || []); }
    catch { setAddressError('Could not load saved addresses.'); }
  }, [token]);
  useEffect(() => { void loadAddresses(); }, [loadAddresses]);

  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAddressError('');
    try {
      const response = await fetch(`${API_URL}/account/addresses`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(addressForm) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not save address.');
      setAddresses(result.data || []); setAddressForm({ label: 'Home', fullName: user?.name || '', phone: '', house: '', street: '', city: '', state: '', pincode: '' });
    } catch (saveError) { setAddressError(saveError instanceof Error ? saveError.message : 'Could not save address.'); }
  };
  const deleteAddress = async (id: string) => {
    const response = await fetch(`${API_URL}/account/addresses/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    const result = await response.json(); if (response.ok) setAddresses(result.data || []); else setAddressError(result.message || 'Could not delete address.');
  };

  const rescheduleOrder = async (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault(); setBusyId(id); setError('');
    try {
      const response = await fetch(`${API_URL}/bookings/${id}/reschedule`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(schedule) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not reschedule this order.');
      setNotice('Appointment rescheduled.'); setReschedulingId(''); await loadOrders();
    } catch (scheduleError) { setError(scheduleError instanceof Error ? scheduleError.message : 'Could not reschedule this order.'); }
    finally { setBusyId(''); }
  };

  const submitReview = async (event: FormEvent<HTMLFormElement>, id: string) => {
    event.preventDefault(); setBusyId(id); setError('');
    try {
      const response = await fetch(`${API_URL}/bookings/${id}/review`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ rating, comment: reviewText }) });
      const result = await response.json(); if (!response.ok) throw new Error(result.message || 'Could not submit review.');
      setNotice('Thank you for reviewing your service.'); setReviewText(''); await loadOrders();
    } catch (reviewError) { setError(reviewError instanceof Error ? reviewError.message : 'Could not submit review.'); }
    finally { setBusyId(''); }
  };

  const cancelOrder = async (id: string) => {
    if (!window.confirm('Cancel this service order?')) return;
    setBusyId(id); setError(''); setNotice('');
    try {
      const response = await fetch(`${API_URL}/bookings/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status: 'CANCELLED' }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not cancel this order.');
      setNotice('Order cancelled.');
      await loadOrders();
    } catch (cancelError) { setError(cancelError instanceof Error ? cancelError.message : 'Could not cancel this order.'); }
    finally { setBusyId(''); }
  };

  return <main className="mx-auto max-w-6xl px-4 py-9 sm:px-6 sm:py-12">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-medium text-brand-700">Welcome back, {user?.name || user?.email}</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">My account</h1><p className="mt-2 text-sm text-slate-600">Track upcoming visits and see your order history.</p></div><div className="flex gap-2"><button type="button" onClick={() => void loadOrders()} className="btn-secondary inline-flex items-center gap-2"><RefreshCw size={16} /> Refresh</button><Link to="/" className="btn-primary inline-flex items-center gap-2"><ShoppingBag size={16} /> Book a service</Link></div></div>
    {notice && <p role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
    {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <section className="mt-7"><h2 className="text-lg font-semibold text-slate-900">Your orders</h2>{loading ? <p className="py-12 text-center text-slate-500">Loading your orders…</p> : orders.length === 0 ? <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><ShoppingBag className="mx-auto text-slate-400" size={30} /><p className="mt-3 font-semibold text-slate-900">No orders yet</p><p className="mt-1 text-sm text-slate-500">Your bookings will show up here.</p><Link to="/" className="mt-5 inline-flex btn-primary">Explore services</Link></div> : <div className="mt-4 grid gap-4">{orders.map((order) => <article key={order._id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"><div className="flex flex-col gap-4 sm:flex-row"><div className="h-28 w-full shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:w-36">{order.serviceId?.image && <img src={order.serviceId.image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="text-xs font-medium uppercase tracking-wide text-brand-700">{order.serviceId?.category || 'Home service'}</p><h3 className="mt-1 text-lg font-semibold text-slate-950">{order.serviceId?.name || 'Service'}</h3><p className="mt-1 break-all text-xs text-slate-400">Order #{order._id}</p></div><span className={`rounded-full px-3 py-1 text-xs font-semibold ${order.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' : order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>{titleCase(order.status)}</span></div>
      {order.status !== 'CANCELLED' && <div className="mt-4 flex flex-wrap gap-1" aria-label={`Booking progress: ${titleCase(order.status)}`}>{['CONFIRMED','ASSIGNED','ON_THE_WAY','COMPLETED'].map((step, index) => { const current = ['CONFIRMED','ASSIGNED','ON_THE_WAY','STARTED','COMPLETED'].indexOf(order.status); const passed = current >= index; return <div key={step} className={`rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${passed ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-500'}`}>{titleCase(step)}</div>; })}</div>}
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600"><span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{order.scheduledDate}</span><span className="inline-flex items-center gap-1.5"><Clock3 size={15} />{order.scheduledTime}</span><span>{order.address?.city}</span>{order.workerId && <span>Professional: {order.workerId.name}{order.workerId.phone ? ` · ${order.workerId.phone}` : ''}</span>}</div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><div><span className="font-semibold text-slate-900">₹{order.price}</span><span className="ml-2 text-xs text-slate-500">Cash · payment {titleCase(order.paymentStatus)}</span></div><div className="flex flex-wrap gap-2">{canCancel(order.status) && <><button type="button" onClick={() => { setReschedulingId(reschedulingId === order._id ? '' : order._id); setSchedule({ scheduledDate: order.scheduledDate, scheduledTime: order.scheduledTime }); }} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700">Reschedule</button><button type="button" disabled={busyId === order._id} onClick={() => void cancelOrder(order._id)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"><XCircle size={16} />{busyId === order._id ? 'Cancelling…' : 'Cancel order'}</button></>}</div></div>
      {reschedulingId === order._id && <form onSubmit={(event) => void rescheduleOrder(event, order._id)} className="mt-3 grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[1fr_1fr_auto]"><label className="text-xs font-medium text-slate-600">New date<input required type="date" min={new Date().toISOString().slice(0,10)} className="input-field mt-1" value={schedule.scheduledDate} onChange={(event) => setSchedule({ ...schedule, scheduledDate: event.target.value })} /></label><label className="text-xs font-medium text-slate-600">New time<input required type="time" className="input-field mt-1" value={schedule.scheduledTime} onChange={(event) => setSchedule({ ...schedule, scheduledTime: event.target.value })} /></label><button disabled={busyId === order._id} className="btn-primary self-end">Save time</button></form>}
      {order.status === 'COMPLETED' && (order.review ? <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm"><span className="font-semibold text-amber-800">{'★'.repeat(order.review.rating)}{'☆'.repeat(5-order.review.rating)}</span><p className="mt-1 text-slate-700">{order.review.comment || 'Thanks for your feedback.'}</p></div> : <form onSubmit={(event) => void submitReview(event, order._id)} className="mt-3 rounded-xl bg-slate-50 p-3"><label className="text-sm font-medium text-slate-700">Rate your service <span className="ml-2 inline-flex gap-1">{[1,2,3,4,5].map((value) => <button type="button" key={value} aria-label={`${value} stars`} onClick={() => setRating(value)} className={value <= rating ? 'text-amber-500' : 'text-slate-300'}><Star size={18} fill="currentColor" /></button>)}</span></label><textarea maxLength={1000} rows={2} placeholder="Share a few details (optional)" className="input-field mt-2" value={reviewText} onChange={(event) => setReviewText(event.target.value)} /><button disabled={busyId === order._id} className="btn-primary mt-2">Submit review</button></form>)}
      </div></div></article>)}</div>}</section>
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-2"><MapPin size={18} className="text-brand-700"/><h2 className="text-lg font-semibold text-slate-900">Saved addresses</h2></div><div className="mt-4 grid gap-3 sm:grid-cols-2">{addresses.map((address) => <article key={address._id} className="rounded-xl border border-slate-200 p-4"><div className="flex justify-between"><p className="font-semibold text-slate-900">{address.label || 'Address'} · {address.fullName}</p><button type="button" onClick={() => void deleteAddress(address._id)} className="text-sm text-red-700">Remove</button></div><p className="mt-1 text-sm text-slate-600">{address.house}, {address.street}, {address.city}, {address.state} {address.pincode}</p><p className="mt-1 text-xs text-slate-500">{address.phone}</p></article>)}</div><form onSubmit={(event) => void saveAddress(event)} className="mt-5 border-t border-slate-100 pt-5"><h3 className="font-medium text-slate-800">Add an address</h3><div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Object.entries(addressForm).map(([key,value]) => <label key={key} className="text-xs font-medium capitalize text-slate-600">{key.replace(/([A-Z])/g,' $1')}<input required className="input-field mt-1" inputMode={key === 'phone' || key === 'pincode' ? 'numeric' : undefined} maxLength={key === 'phone' ? 10 : undefined} value={value} onChange={(event) => setAddressForm({ ...addressForm, [key]: event.target.value })} /></label>)}</div>{addressError && <p role="alert" className="mt-2 text-sm text-red-600">{addressError}</p>}<button className="btn-primary mt-4">Save address</button></form></section>
  </main>;
}
