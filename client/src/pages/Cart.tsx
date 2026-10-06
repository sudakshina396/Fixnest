import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import type { RootState } from '../store';
import { clearCart, removeFromCart } from '../store/slices/cartSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
type SavedAddress = { _id: string; label?: string; fullName: string; phone: string; house: string; street: string; city: string; state: string; pincode: string; instructions?: string };

export default function Cart() {
  const { items } = useSelector((state: RootState) => state.cart);
  const { token, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: user?.name || '', phone: '', house: '', street: '', city: '', state: '', pincode: '', scheduledDate: '', scheduledTime: '', instructions: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const total = items.reduce((sum, item) => sum + Number(item.basePrice || 0) + 49, 0);
  const update = (field: keyof typeof form, value: string) => setForm((current) => ({ ...current, [field]: value }));
  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/account/addresses`, { headers: { Authorization: `Bearer ${token}` } }).then((response) => response.json()).then((result) => { if (result.success) setSavedAddresses(result.data || []); }).catch(() => undefined);
  }, [token]);

  const checkout = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) { navigate('/login', { state: { from: '/cart' } }); return; }
    setBusy(true); setError('');
    try {
      const response = await fetch(`${API_URL}/bookings/cart-checkout`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: items.map(({ _id }) => ({ serviceId: _id })), address: { fullName: form.fullName, phone: form.phone, house: form.house, street: form.street, city: form.city, state: form.state, pincode: form.pincode }, scheduledDate: form.scheduledDate, scheduledTime: form.scheduledTime, instructions: form.instructions }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not place your order.');
      dispatch(clearCart());
      navigate('/account', { state: { notice: `${result.count} order${result.count === 1 ? '' : 's'} placed successfully.` } });
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : 'Could not place your order.'); }
    finally { setBusy(false); }
  };

  return <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
    <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700"><ArrowLeft size={16} /> Continue browsing</Link>
    <div className="mt-5 grid items-start gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><ShoppingBag size={21} /></span><div><h1 className="text-2xl font-semibold text-slate-950">Your cart</h1><p className="text-sm text-slate-500">{items.length} service{items.length === 1 ? '' : 's'} · each service is booked separately</p></div></div>
        {items.length === 0 ? <div className="py-14 text-center"><p className="font-medium text-slate-800">Your cart is empty</p><Link to="/" className="mt-4 inline-flex btn-primary">Browse services</Link></div> : <>
          <ul className="mt-6 divide-y divide-slate-100">{items.map((item) => <li key={item._id} className="flex gap-4 py-4 first:pt-0"><div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">{item.image && <img src={item.image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="truncate font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.category} · {item.duration} min</p><p className="mt-2 text-sm font-medium">₹{item.basePrice} + ₹49 fee</p></div><button type="button" onClick={() => dispatch(removeFromCart(item._id))} className="h-9 w-9 shrink-0 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label={`Remove ${item.name}`}><Trash2 size={17} /></button></li>)}</ul>
          <div className="mt-2 flex justify-between border-t border-slate-200 pt-4 text-base font-semibold"><span>Total</span><span>₹{total}</span></div><p className="mt-2 text-xs text-slate-500">Payment: cash after service</p>
        </>}
      </section>
      {items.length > 0 && <form onSubmit={checkout} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div><h2 className="text-xl font-semibold text-slate-950">Delivery and appointment</h2><p className="mt-1 text-sm text-slate-500">One checkout for all cart services.</p></div>
        {!token && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="font-semibold text-amber-950">Please log in to place your order</p><p className="mt-1 text-sm text-amber-800">Your cart will be saved while you sign in.</p><button type="button" onClick={() => navigate('/login', { state: { from: '/cart' } })} className="btn-primary mt-3">Log in to continue</button></div>}
        {savedAddresses.length > 0 && <label className="block text-sm font-medium text-slate-700">Use a saved address<select className="input-field mt-1" defaultValue="" onChange={(event) => { const address = savedAddresses.find((item) => item._id === event.target.value); if (address) setForm((current) => ({ ...current, ...address, scheduledDate: current.scheduledDate, scheduledTime: current.scheduledTime })); }}><option value="">Enter a new address</option>{savedAddresses.map((address) => <option key={address._id} value={address._id}>{address.label || 'Address'} · {address.city}</option>)}</select></label>}
        <div className="grid gap-3 sm:grid-cols-2">
          {([['fullName','Full name'],['phone','Phone'],['house','House / apartment'],['street','Street / area'],['city','City'],['state','State'],['pincode','PIN code']] as const).map(([key,label]) => <label key={key} className={`text-sm font-medium text-slate-700 ${['house','street'].includes(key) ? 'sm:col-span-2' : ''}`}>{label}<input required type={key === 'phone' || key === 'pincode' ? 'tel' : 'text'} inputMode={key === 'phone' || key === 'pincode' ? 'numeric' : undefined} pattern={key === 'phone' ? '[0-9]{10}' : undefined} maxLength={key === 'phone' ? 10 : undefined} title={key === 'phone' ? 'Enter a 10-digit phone number.' : undefined} className="input-field mt-1" value={form[key]} onChange={(event) => update(key, event.target.value)} /></label>)}
          <label className="text-sm font-medium text-slate-700">Date<input required type="date" min={today()} className="input-field mt-1" value={form.scheduledDate} onChange={(event) => update('scheduledDate', event.target.value)} /></label>
          <label className="text-sm font-medium text-slate-700">Time<input required type="time" className="input-field mt-1" value={form.scheduledTime} onChange={(event) => update('scheduledTime', event.target.value)} /></label>
        </div>
        <label className="block text-sm font-medium text-slate-700">Instructions (optional)<textarea rows={2} className="input-field mt-1" value={form.instructions} onChange={(event) => update('instructions', event.target.value)} /></label>
        <div className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-900"><strong>Payment method: Cash</strong><br />Pay the professional after each service is completed.</div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full py-3">{busy ? 'Placing orders…' : `Place ${items.length} order${items.length === 1 ? '' : 's'} · ₹${total}`}</button>
        {!token && <p className="text-center text-xs text-slate-500">Sign in first, then return here to place your order.</p>}
      </form>}
    </div>
  </main>;
}
