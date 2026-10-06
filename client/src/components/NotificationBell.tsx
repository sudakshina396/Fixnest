import { useCallback, useEffect, useState } from 'react';
import { Bell, Check } from 'lucide-react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
type Notice = { _id: string; title: string; message: string; readAt?: string; createdAt: string };

export default function NotificationBell() {
  const token = useSelector((state: RootState) => state.auth.token);
  const [items, setItems] = useState<Notice[]>([]);
  const [open, setOpen] = useState(false);
  const load = useCallback(async () => {
    if (!token) return;
    try { const response = await fetch(`${API_URL}/account/notifications`, { headers: { Authorization: `Bearer ${token}` } }); const data = await response.json(); if (response.ok) setItems(data.data || []); } catch { /* Notifications remain available from the account screen. */ }
  }, [token]);
  useEffect(() => { void load(); const timer = window.setInterval(() => void load(), 60000); return () => window.clearInterval(timer); }, [load]);
  if (!token) return null;
  const unread = items.filter((item) => !item.readAt).length;
  const markRead = async (item: Notice) => {
    if (item.readAt) return;
    const response = await fetch(`${API_URL}/account/notifications/${item._id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setItems((current) => current.map((notice) => notice._id === item._id ? { ...notice, readAt: new Date().toISOString() } : notice));
  };
  return <div className="relative"><button type="button" aria-label={`Notifications, ${unread} unread`} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"><Bell size={19} />{unread > 0 && <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[9px] font-bold text-white">{unread}</span>}</button>{open && <div className="absolute right-0 top-12 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3"><h2 className="font-semibold text-slate-900">Notifications</h2><button type="button" onClick={() => void load()} className="text-xs text-brand-700">Refresh</button></div><div className="max-h-96 overflow-y-auto">{items.length ? items.map((item) => <button type="button" key={item._id} onClick={() => void markRead(item)} className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 ${item.readAt ? '' : 'bg-brand-50/60'}`}><span className="flex justify-between gap-2 text-sm font-semibold text-slate-900">{item.title}{item.readAt && <Check size={14} className="text-green-700" />}</span><span className="mt-1 block text-xs leading-5 text-slate-600">{item.message}</span><span className="mt-1 block text-[10px] text-slate-400">{new Date(item.createdAt).toLocaleString()}</span></button>) : <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>}</div></div>}</div>;
}
