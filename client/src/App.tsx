import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, House, Menu, X, ShoppingCart, UserRound } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useDispatch } from 'react-redux';
import type { RootState } from './store';
import { logout } from './store/slices/authSlice';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminServices from './pages/AdminServices';
import ServiceDetails from './pages/ServiceDetails';
import Cart from './pages/Cart';
import MyAccount from './pages/MyAccount';
import AdminBookings from './pages/AdminBookings';
import NotificationBell from './components/NotificationBell';

type HomeSectionLinkProps = {
  id: string;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
};

function HomeSectionLink({ id, className, children, onClick }: HomeSectionLinkProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    onClick?.();
    if (location.pathname === '/') {
      window.history.replaceState({}, '', `/#${id}`);
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(`/#${id}`);
    }
  };

  return <a href={`/#${id}`} onClick={handleClick} className={className}>{children}</a>;
}

function SiteHeader() {
  const user = useSelector((state: RootState) => state.auth.user);
  const cartCount = useSelector((state: RootState) => state.cart.items.length);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-2 px-4 py-2 sm:gap-4 sm:px-5 lg:px-8">
        <Link to="/" onClick={() => setMobileMenuOpen(false)} aria-label="Fixnest home" className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-slate-950 sm:gap-2.5 sm:text-xl">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
            <House aria-hidden="true" size={21} strokeWidth={2.2} />
          </span>
          <span>fixnest<span className="text-brand-700">.</span></span>
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-5 text-sm font-medium text-slate-600 lg:flex xl:gap-7">
          <HomeSectionLink id="services" className="transition hover:text-slate-950">Services</HomeSectionLink>
          <HomeSectionLink id="categories" className="transition hover:text-slate-950">Categories</HomeSectionLink>
          <HomeSectionLink id="how-it-works" className="transition hover:text-slate-950">How it works</HomeSectionLink>
        </nav>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
        <Link to="/cart" aria-label={`Cart, ${cartCount} services`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 transition hover:bg-slate-100"><ShoppingCart size={20} />{cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white">{cartCount}</span>}</Link>
        {user && <NotificationBell />}
        <nav aria-label="Account navigation" className="flex shrink-0 items-center gap-1 sm:gap-3">
          {user ? (
            <>
              {user.role !== 'admin' && <Link to="/account" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:px-3 sm:text-sm"><UserRound size={16} /><span className="hidden sm:inline">My account</span></Link>}
              {user.role === 'admin' && <Link to="/admin/services" className="hidden rounded-lg border border-slate-300 px-2.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:inline-flex">Manage services</Link>}
              {user.role === 'admin' && <Link to="/admin/bookings" className="hidden rounded-lg border border-slate-300 px-2.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 lg:inline-flex">Bookings</Link>}
              <button type="button" onClick={handleLogout} className="rounded-lg border border-slate-300 px-2.5 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 sm:px-3 sm:text-sm">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="hidden px-2 py-2 text-sm font-medium text-slate-700 transition hover:text-slate-950 sm:inline-flex">Log in</Link>
              <Link to="/signup" className="btn-primary rounded-lg px-3 py-2.5 text-xs sm:px-4 sm:text-sm">Get started</Link>
            </>
          )}
        </nav>
        <button type="button" onClick={() => setMobileMenuOpen((open) => !open)} aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 lg:hidden">
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        </div>
      </div>
      {mobileMenuOpen && <nav id="mobile-navigation" aria-label="Mobile navigation" className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:px-1">
          <HomeSectionLink id="services" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Services</HomeSectionLink>
          <HomeSectionLink id="categories" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Categories</HomeSectionLink>
          <HomeSectionLink id="how-it-works" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">How it works</HomeSectionLink>
          <Link to="/cart" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Cart{cartCount ? ` (${cartCount})` : ''}</Link>
          {user && user.role !== 'admin' && <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">My account · Orders</Link>}
          {user?.role === 'admin' && <Link to="/admin/services" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Manage services</Link>}
          {user?.role === 'admin' && <Link to="/admin/bookings" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50">Bookings</Link>}
          {!user && <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:hidden">Log in</Link>}
        </div>
      </nav>}
    </header>
  );
}

function App() {
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/services/:id" element={<ServiceDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/account" element={user && user.role !== 'admin' ? <MyAccount /> : <Navigate to="/login" replace state={{ from: '/account' }} />} />
            <Route path="/admin/services" element={user?.role === 'admin' ? <AdminServices /> : <Navigate to="/" replace />} />
            <Route path="/admin/bookings" element={user?.role === 'admin' ? <AdminBookings /> : <Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className="bg-slate-950 text-slate-300">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-8 lg:py-16">
            <div>
              <Link to="/" aria-label="Fixnest home" className="inline-flex items-center gap-2.5 text-xl font-bold tracking-tight text-white"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600"><House size={19} /></span>fixnest<span className="-ml-2 text-brand-400">.</span></Link>
              <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">Thoughtful help for the place you call home.</p>
            </div>
            <div><h2 className="text-sm font-semibold text-white">Explore</h2><div className="mt-4 flex flex-col gap-3 text-sm text-slate-400"><HomeSectionLink className="hover:text-white" id="services">All services</HomeSectionLink><HomeSectionLink className="hover:text-white" id="categories">Categories</HomeSectionLink><HomeSectionLink className="hover:text-white" id="how-it-works">How it works</HomeSectionLink><Link className="hover:text-white" to="/signup">Create an account</Link></div></div>
            <div><h2 className="text-sm font-semibold text-white">Your account</h2><div className="mt-4 flex flex-col gap-3 text-sm text-slate-400"><Link className="hover:text-white" to="/login">Log in</Link><Link className="hover:text-white" to="/signup">Sign up</Link></div></div>
            <div><h2 className="text-sm font-semibold text-white">Need a hand?</h2><p className="mt-4 text-sm leading-6 text-slate-400">Browse local services and choose the help that works for your home.</p><HomeSectionLink id="services" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-brand-300">Find a service <ArrowRight size={15} /></HomeSectionLink></div>
          </div>
          <div className="border-t border-white/10"><div className="mx-auto max-w-7xl px-5 py-5 text-xs text-slate-500 lg:px-8">© 2026 Fixnest. Made for a home that feels like yours.</div></div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
