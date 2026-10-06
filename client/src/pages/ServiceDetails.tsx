import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/slices/cartSlice';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type Service = {
  _id: string;
  name: string;
  category: string;
  description: string;
  basePrice: number;
  duration: string;
  image?: string;
  isAvailable?: boolean;
};

type BookingForm = {
  fullName: string;
  phone: string;
  house: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  scheduledDate: string;
  scheduledTime: string;
  instructions: string;
};

const today = () => {
  const localDate = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const ServiceDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const [cartMessage, setCartMessage] = useState('');
  const [service, setService] = useState<Service | null>(null);
  const [form, setForm] = useState<BookingForm>({
    fullName: user?.name || '', phone: '', house: '', street: '', city: '', state: '', pincode: '',
    scheduledDate: '', scheduledTime: '', instructions: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/services/${id}`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load this service.');
        setService(result.data);
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Could not load this service.'));
  }, [id]);

  const updateField = (field: keyof BookingForm, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const handleBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!service) return;
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          serviceId: service._id,
          address: {
            fullName: form.fullName,
            phone: form.phone,
            house: form.house,
            street: form.street,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          scheduledDate: form.scheduledDate,
          scheduledTime: form.scheduledTime,
          instructions: form.instructions,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login', { state: { from: location.pathname } });
          return;
        }
        throw new Error(result.message || 'Could not create the booking.');
      }
      setMessage(`Booking request submitted. Booking reference: ${result.data._id}`);
    } catch (bookingError) {
      setError(bookingError instanceof Error ? bookingError.message : 'Could not create the booking.');
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !service) return <section className="container mx-auto px-4 py-16"><p role="alert" className="text-red-600">{error}</p><Link to="/" className="mt-4 inline-block text-brand-700">← Back to services</Link></section>;
  if (!service) return <section className="container mx-auto px-4 py-16 text-slate-600">Loading service…</section>;

  return (
    <section className="container mx-auto max-w-6xl px-4 py-10">
      <Link to="/" className="mb-6 inline-block text-sm font-medium text-brand-700 hover:underline">← All services</Link>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          {service.image && <img src={service.image} alt={service.name} className="h-72 w-full rounded-2xl object-cover sm:h-96" />}
          <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-brand-700">{service.category}</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900 sm:text-4xl">{service.name}</h1>
          <p className="mt-4 leading-7 text-slate-600">{service.description}</p>
          <div className="mt-6 flex flex-wrap gap-6 rounded-xl bg-white p-5 shadow-sm">
            <div><p className="text-sm text-slate-500">Starting price</p><p className="mt-1 text-xl font-semibold text-slate-900">₹{service.basePrice}</p></div>
            <div><p className="text-sm text-slate-500">Estimated time</p><p className="mt-1 text-xl font-semibold text-slate-900">{service.duration}</p></div>
          </div>
        </div>

        <form onSubmit={handleBooking} className="h-fit space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Book this service</h2>
          <p className="text-sm text-slate-600">Service price ₹{service.basePrice} + ₹49 service fee. Pay cash after the service.</p>
          {service.isAvailable === false && <p role="status" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This service is temporarily unavailable for booking.</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Full name<input required className="input-field mt-1" value={form.fullName} onChange={(e) => updateField('fullName', e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">Phone<input required type="tel" className="input-field mt-1" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">House / apartment<input required className="input-field mt-1" value={form.house} onChange={(e) => updateField('house', e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Street / area<input required className="input-field mt-1" value={form.street} onChange={(e) => updateField('street', e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">City<input required className="input-field mt-1" value={form.city} onChange={(e) => updateField('city', e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">State<input required className="input-field mt-1" value={form.state} onChange={(e) => updateField('state', e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">PIN code<input required inputMode="numeric" className="input-field mt-1" value={form.pincode} onChange={(e) => updateField('pincode', e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700">Date<input required type="date" min={today()} className="input-field mt-1" value={form.scheduledDate} onChange={(e) => updateField('scheduledDate', e.target.value)} /></label>
            <label className="text-sm font-medium text-slate-700 sm:col-span-2">Preferred time<input required type="time" className="input-field mt-1" value={form.scheduledTime} onChange={(e) => updateField('scheduledTime', e.target.value)} /></label>
          </div>
          <label className="block text-sm font-medium text-slate-700">Instructions (optional)<textarea rows={2} className="input-field mt-1" value={form.instructions} onChange={(e) => updateField('instructions', e.target.value)} /></label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {message && <p role="status" className="break-all text-sm text-green-700">{message}</p>}
          {cartMessage && <p role="status" className="text-sm text-green-700">{cartMessage}</p>}
          <button type="button" disabled={service.isAvailable === false} onClick={() => { dispatch(addToCart(service)); setCartMessage('Added to your cart. You can keep browsing or check out now.'); }} className="btn-secondary w-full py-3 disabled:opacity-50">Add to cart</button>
          <button type="submit" disabled={isLoading || service.isAvailable === false} className="btn-primary w-full py-3 disabled:opacity-60">{isLoading ? 'Submitting…' : service.isAvailable === false ? 'Currently unavailable' : token ? 'Request booking' : 'Sign in to book'}</button>
        </form>
      </div>
    </section>
  );
};

export default ServiceDetails;
