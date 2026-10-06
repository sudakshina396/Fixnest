import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

type Service = {
  _id: string;
  name: string;
  category: string;
  city: string;
  description: string;
  basePrice: number;
  duration: string;
  image?: string;
  isAvailable?: boolean;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AdminServices = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [services, setServices] = useState<Service[]>([]);
  const [form, setForm] = useState({ name: '', category: '', city: '', description: '', basePrice: '', duration: '', image: '', imageUrl: '', isAvailable: true });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/services`)
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'Could not load services.');
        setServices(result.data);
      })
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : 'Could not load services.'));
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const image = form.image || form.imageUrl.trim();
    if (!image && !editingId) {
      setError('Choose an image file or enter an image URL.');
      return;
    }
    setIsLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${API_URL}/services${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, image, basePrice: Number(form.basePrice) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not add the service.');
      setServices((current) => editingId
        ? current.map((service) => service._id === editingId ? result.data : service)
        : [...current, result.data]);
      const wasEditing = Boolean(editingId);
      setEditingId(null);
      setForm({ name: '', category: '', city: '', description: '', basePrice: '', duration: '', image: '', imageUrl: '', isAvailable: true });
      setNotice(wasEditing ? 'Service updated.' : 'Service added.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not add the service.');
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (service: Service) => {
    setEditingId(service._id);
    setForm({
      name: service.name,
      category: service.category,
      city: service.city || '',
      description: service.description,
      basePrice: String(service.basePrice),
      duration: service.duration,
      image: service.image?.startsWith('data:image/') ? service.image : '',
      imageUrl: service.image && !service.image.startsWith('data:image/') ? service.image : '',
      isAvailable: service.isAvailable !== false,
    });
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteService = async (service: Service) => {
    if (!window.confirm(`Delete “${service.name}”? This cannot be undone.`)) return;
    setError('');
    setNotice('');
    try {
      const response = await fetch(`${API_URL}/services/${service._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not delete the service.');
      setServices((current) => current.filter((item) => item._id !== service._id));
      if (editingId === service._id) {
        setEditingId(null);
        setForm({ name: '', category: '', city: '', description: '', basePrice: '', duration: '', image: '', imageUrl: '', isAvailable: true });
      }
      setNotice('Service deleted.');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete the service.');
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError('Choose a JPG, PNG, WebP, or GIF image.');
      event.target.value = '';
      return;
    }
    if (file.size > 1024 * 1024) {
      setError('Images must be 1 MB or smaller.');
      event.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, image: String(reader.result), imageUrl: '' }));
      setError('');
    };
    reader.onerror = () => setError('Could not read this image. Choose another file.');
    reader.readAsDataURL(file);
  };

  return (
    <section className="container mx-auto max-w-4xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold text-slate-900">Manage services</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800">{editingId ? 'Edit service' : 'Add a service'}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-sm font-medium text-slate-700">Service name
            <input required className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">Category
            <input required className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">City
            <input required className="input-field" placeholder="e.g. Kolkata" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">Base price
            <input required type="number" min="0" step="0.01" className="input-field" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
          </label>
          <label className="space-y-1 text-sm font-medium text-slate-700">Duration
            <input required placeholder="e.g. 1 hour" className="input-field" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} />
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.isAvailable} onChange={(event) => setForm({ ...form, isAvailable: event.target.checked })} className="accent-green-700" />Available for booking</label>
        <label className="block space-y-1 text-sm font-medium text-slate-700">Description
          <textarea required rows={3} className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label className="block space-y-1 text-sm font-medium text-slate-700">Image URL (optional if uploading a file)
          <input type="url" placeholder="https://example.com/service.jpg" className="input-field" value={form.imageUrl} onChange={(e) => setForm({ ...form, image: '', imageUrl: e.target.value })} />
        </label>
        <label className="block space-y-1 text-sm font-medium text-slate-700">Or upload an image file (max 1 MB)
          <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="input-field file:mr-3 file:rounded-md file:border-0 file:bg-brand-100 file:px-3 file:py-1 file:text-brand-700" onChange={handleImageChange} />
        </label>
        {(form.image || form.imageUrl) && <img src={form.image || form.imageUrl} alt="Service preview" className="h-40 w-full rounded-xl object-cover sm:w-64" />}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {notice && <p role="status" className="text-sm text-green-700">{notice}</p>}
        <button type="submit" disabled={isLoading} className="btn-primary disabled:opacity-60">
          {isLoading ? (editingId ? 'Saving…' : 'Adding…') : (editingId ? 'Save changes' : 'Add service')}
        </button>
        {editingId && <button type="button" className="ml-3 rounded-lg border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-50" onClick={() => { setEditingId(null); setForm({ name: '', category: '', city: '', description: '', basePrice: '', duration: '', image: '', imageUrl: '', isAvailable: true }); setError(''); }}>Cancel edit</button>}
      </form>

      <div className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Current services</h2>
        {services.length === 0 ? (
          <p className="text-slate-600">No active services yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-white">
            {services.map((service) => (
              <li key={service._id} className="flex flex-wrap items-center justify-between gap-2 p-4">
                <div className="flex items-center gap-4">
                  {service.image && <img src={service.image} alt="" className="h-16 w-20 rounded-lg object-cover" />}
                  <div>
                  <h3 className="font-medium text-slate-900">{service.name}</h3>
                  <p className="text-sm text-slate-600">{[service.category, service.city, service.duration, service.isAvailable === false ? 'Unavailable' : 'Available'].filter(Boolean).join(' · ')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-medium text-slate-800">₹{service.basePrice}</p>
                  <button type="button" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => startEditing(service)}>Edit</button>
                  <button type="button" className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50" onClick={() => void deleteService(service)}>Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};

export default AdminServices;
