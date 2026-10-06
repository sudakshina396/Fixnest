import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Brush, Bug, CalendarDays, Fan, MapPin, Paintbrush, Plug, Search, ShieldCheck, Sparkles, Wrench, Clock3 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type Service = {
  _id: string;
  name: string;
  category: string;
  city?: string;
  description: string;
  basePrice: number;
  duration: number;
  image?: string;
  isAvailable?: boolean;
};

const categories = [
  { name: 'AC Repair', icon: Fan, match: ['ac', 'air conditioner', 'appliance'] },
  { name: 'Electrician', icon: Plug, match: ['electric'] },
  { name: 'Plumber', icon: Wrench, match: ['plumb'] },
  { name: 'Cleaning', icon: Brush, match: ['clean'] },
  { name: 'Painting', icon: Paintbrush, match: ['paint'] },
  { name: 'Pest Control', icon: Bug, match: ['pest'] },
];

const photos = [
  { src: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1100&q=85', alt: 'Home professional cleaning a bright living room', className: 'row-span-2 min-h-[280px] sm:min-h-[410px]' },
  { src: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=85', alt: 'A warm, well cared for home', className: 'min-h-[135px] sm:min-h-[198px]' },
  { src: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?auto=format&fit=crop&w=900&q=85', alt: 'An electrician working on a home repair', className: 'min-h-[135px] sm:min-h-[198px]' },
];

function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [serviceError, setServiceError] = useState('');
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/services`)
      .then(async (response) => {
        if (!response.ok) throw new Error('Services could not be loaded right now. Please try again shortly.');
        return response.json();
      })
      .then((data) => { if (active) setServices(Array.isArray(data) ? data : data.data || data.services || []); })
      .catch((error: Error) => { if (active) setServiceError(error.message || 'Services could not be loaded right now.'); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const sectionId = window.location.hash.slice(1);
    if (!sectionId) return;
    window.requestAnimationFrame(() => document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, []);

  const visibleServices = useMemo(() => services.filter((service) => {
    const text = `${service.name} ${service.category} ${service.description}`.toLowerCase();
    const category = categories.find((item) => item.name === selectedCategory);
    const categoryMatch = !category || category.match.some((word) => text.includes(word));
    const cityMatch = !city || service.city?.toLowerCase().includes(city.toLowerCase());
    const priceMatch = (!minPrice || service.basePrice >= Number(minPrice)) && (!maxPrice || service.basePrice <= Number(maxPrice));
    return categoryMatch && cityMatch && priceMatch && (!availableOnly || service.isAvailable !== false) && (!search || text.includes(search.toLowerCase()));
  }), [services, search, city, selectedCategory, minPrice, maxPrice, availableOnly]);

  const chooseCategory = (name: string) => {
    setSelectedCategory((current) => current === name ? '' : name);
    window.setTimeout(() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 0);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    document.getElementById('services')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="bg-white">
      <section className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-8 sm:gap-12 sm:px-5 sm:pb-16 sm:pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:px-8 lg:pb-24 lg:pt-16">
        <div>
          <p className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-brand-700"><Sparkles size={15} /> A little help goes a long way</p>
          <h1 className="max-w-xl text-4xl font-semibold leading-[1.12] tracking-tight text-slate-950 sm:text-5xl lg:text-[3.6rem]">Home services,<br className="hidden sm:block" /> handled with care.</h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">From quick fixes to a fresh start, find dependable help for the place you call home.</p>

          <form onSubmit={submitSearch} className="mt-8 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[0.75fr_1.25fr_auto]">
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3"><MapPin size={18} className="shrink-0 text-slate-500" /><span className="sr-only">City</span><input aria-label="City" value={city} onChange={(event) => setCity(event.target.value)} placeholder="Your city" className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-500" /></label>
            <label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3"><Search size={18} className="shrink-0 text-slate-500" /><span className="sr-only">Search services</span><input aria-label="Search services" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="What do you need help with?" className="min-w-0 w-full bg-transparent py-3 text-sm outline-none placeholder:text-slate-500" /></label>
            <button type="submit" className="btn-primary flex items-center justify-center gap-2 rounded-xl px-5">Find a service <ArrowRight size={16} /></button>
          </form>

          <details className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <summary className="cursor-pointer font-medium text-slate-700">Filter services by price and availability</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-slate-600">Minimum price<input type="number" min="0" value={minPrice} onChange={(event) => setMinPrice(event.target.value)} className="input-field mt-1" placeholder="₹0" /></label>
              <label className="text-xs font-medium text-slate-600">Maximum price<input type="number" min="0" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="input-field mt-1" placeholder="Any price" /></label>
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} className="accent-green-700" />Available for booking only</label>
              <label className="text-xs font-medium text-slate-600 sm:col-span-2">Category<select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)} className="input-field mt-1"><option value="">All categories</option>{[...new Set(services.map((service) => service.category))].sort().map((name) => <option key={name}>{name}</option>)}</select></label>
            </div>
          </details>

          <div id="categories" className="scroll-mt-24 mt-8 rounded-2xl border border-slate-200 p-4 sm:p-6">
            <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Browse by need</p><h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">Popular categories</h2></div><button type="button" onClick={() => { setSelectedCategory(''); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-sm font-semibold text-brand-700 hover:text-brand-900">View all</button></div>
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {categories.map(({ name, icon: Icon }) => <button key={name} type="button" onClick={() => chooseCategory(name)} className={`group flex min-h-[104px] flex-col items-center justify-center gap-2 rounded-xl border p-3 text-center transition hover:-translate-y-0.5 hover:border-brand-300 hover:bg-brand-50 ${selectedCategory === name ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-transparent bg-slate-50 text-slate-800'}`}><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-700 shadow-sm group-hover:text-brand-700"><Icon size={21} strokeWidth={1.8} /></span><span className="text-xs font-medium sm:text-sm">{name}</span></button>)}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-1.5"><BadgeCheck size={15} className="text-brand-700" /> Clear prices</span><span className="inline-flex items-center gap-1.5"><ShieldCheck size={15} className="text-brand-700" /> Easy booking</span><span className="inline-flex items-center gap-1.5"><Clock3 size={15} className="text-brand-700" /> At your convenience</span></div>
        </div>

        <div className="relative">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {photos.map((photo) => <div key={photo.src} className={`overflow-hidden rounded-2xl bg-slate-100 ${photo.className}`}><img src={photo.src} alt={photo.alt} className="h-full w-full object-cover" loading="lazy" /></div>)}
          </div>
          <div className="absolute bottom-5 left-5 flex items-center gap-3 rounded-xl border border-white/70 bg-white/95 p-3 shadow-lg backdrop-blur sm:bottom-7 sm:left-7 sm:p-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700"><ShieldCheck size={21} /></span><span><span className="block text-sm font-semibold text-slate-900">A better day starts at home</span><span className="mt-0.5 block text-xs text-slate-600">Find the help you need, all in one place</span></span></div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-[#f7f8f6] py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">A home that feels like yours</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Make room for the good stuff</h2></div><button type="button" onClick={() => { setSelectedCategory(''); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-800 hover:text-brand-700">Explore services <ArrowRight size={16} /></button></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: 'A cleaner, calmer home', caption: 'Cleaning services for everyday living', image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85', category: 'Cleaning' },
              { title: 'Small fixes, sorted', caption: 'Repairs and maintenance made simple', image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=900&q=85', category: 'Electrician' },
              { title: 'Comfort in every season', caption: 'Keep your home feeling just right', image: 'https://images.unsplash.com/photo-1631545806609-6e7f2d8f6f4e?auto=format&fit=crop&w=900&q=85', category: 'AC Repair' },
            ].map((item) => <button key={item.title} type="button" onClick={() => { setSelectedCategory(item.category); document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' }); }} className="group relative min-h-[250px] overflow-hidden rounded-2xl bg-slate-300 text-left"><img src={item.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" /><span className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6"><span className="block text-xl font-semibold">{item.title}</span><span className="mt-1 block text-sm text-white/85">{item.caption}</span><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">Explore <ArrowRight size={15} /></span></span></button>)}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-14 sm:px-5 sm:py-16 lg:px-8">
        <div className="mx-auto mb-8 max-w-2xl text-center"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Simple from start to finish</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">How Fixnest works</h2><p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">Find the right service, review the details, and book when you’re ready.</p></div>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { number: '01', title: 'Find what you need', text: 'Browse categories or search for a service in your city.', icon: Search },
            { number: '02', title: 'Review the details', text: 'Check the service description, duration, and starting price.', icon: BadgeCheck },
            { number: '03', title: 'Choose a time to book', text: 'Open a service to continue with the booking details.', icon: CalendarDays },
          ].map(({ number, title, text, icon: Icon }) => <article key={number} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700"><Icon size={22} strokeWidth={1.8} /></span><div><p className="text-xs font-semibold tracking-[0.12em] text-brand-700">STEP {number}</p><h3 className="mt-1 text-base font-semibold text-slate-900 sm:text-lg">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div></article>)}
        </div>
      </section>

      <section id="services" className="scroll-mt-24 mx-auto max-w-7xl px-4 py-14 sm:px-5 sm:py-16 lg:px-8">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-700">Find your fix</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Services for your home</h2><p className="mt-2 text-sm text-slate-600">Browse the services available in your area.</p></div>{(selectedCategory || search || city || minPrice || maxPrice || availableOnly) && <button type="button" onClick={() => { setSelectedCategory(''); setSearch(''); setCity(''); setMinPrice(''); setMaxPrice(''); setAvailableOnly(false); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Clear filters</button>}</div>
        {selectedCategory && <p className="mb-5 inline-flex rounded-full bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-800">Showing: {selectedCategory}</p>}
        {serviceError && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{serviceError}</div>}
        {!serviceError && visibleServices.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center"><Wrench className="mx-auto text-slate-400" size={28} /><p className="mt-3 font-semibold text-slate-900">No services found</p><p className="mt-1 text-sm text-slate-600">Try another category or search.</p></div> : <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleServices.map((service) => <article key={service._id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg"><Link to={`/services/${service._id}`} className="block"><div className="relative h-52 overflow-hidden bg-slate-100">{service.image ? <img src={service.image} alt={service.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 text-brand-700"><Wrench size={42} strokeWidth={1.4} /></div>}<span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">{service.category}</span>{service.isAvailable === false && <span className="absolute right-3 top-3 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white">Currently unavailable</span>}</div><div className="p-5"><div className="flex items-start justify-between gap-3"><h3 className="text-lg font-semibold text-slate-900">{service.name}</h3><span className="shrink-0 text-sm font-semibold text-slate-900">₹{service.basePrice}</span></div><p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-slate-600">{service.description}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500"><span>{service.city || 'Local service'} · {service.duration} min</span><span className="inline-flex items-center gap-1 font-semibold text-brand-700">View & book <ArrowRight size={14} /></span></div></div></Link></article>)}
        </div>}
      </section>
    </div>
  );
}

export default Home;
