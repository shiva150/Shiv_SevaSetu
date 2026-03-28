import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, TrendingUp, Search, CheckCircle, XCircle, Activity, Database, Trash2, Loader2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { doc, collection, getDocs, deleteDoc, query, where, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CaregiverProfile, AnalyticsSummary } from '../types';
import { toast } from 'sonner';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getAnalyticsSummary, getMonthlyStats, getRegionalDistribution, MonthlyData, RegionData } from '../services/analytics';
import { seedDatabase, clearDatabase } from '../services/seed';

export const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [pendingCaregivers, setPendingCaregivers] = useState<CaregiverProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [regionData, setRegionData] = useState<RegionData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { if (user && user.role !== 'admin') { toast.error('Admin only'); navigate('/'); } }, [user, navigate]);
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [a, m, r] = await Promise.all([getAnalyticsSummary(), getMonthlyStats(), getRegionalDistribution()]);
      setAnalytics(a); setMonthlyData(m); setRegionData(r);
      const q = query(collection(db, 'caregivers'), where('isVerified', '==', false));
      setPendingCaregivers((await getDocs(q)).docs.map(d => d.data() as CaregiverProfile));
    } catch { toast.error('Failed to load admin data'); }
    finally { setIsLoading(false); }
  };

  const handleApprove = async (id: string) => {
    try { await updateDoc(doc(db, 'caregivers', id), { isVerified: true }); toast.success('Approved'); setPendingCaregivers(p => p.filter(c => c.user_id !== id)); } catch { toast.error('Failed'); }
  };
  const handleReject = async (id: string) => {
    try { await deleteDoc(doc(db, 'caregivers', id)); toast.success('Rejected'); setPendingCaregivers(p => p.filter(c => c.user_id !== id)); } catch { toast.error('Failed'); }
  };

  const regionColors = ['bg-primary', 'bg-secondary', 'bg-on-surface-variant', 'bg-error', 'bg-outline'];
  const maxR = regionData.length > 0 ? Math.max(...regionData.map(r => r.count)) : 1;
  const filtered = pendingCaregivers.filter(c => !searchTerm || c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (user && user.role !== 'admin') return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-primary">Admin Command Center</h1>
          <p className="text-on-surface-variant">Real-time oversight of the SevaSetu network.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={async () => { setIsSeeding(true); try { await seedDatabase(); toast.success('Data seeded!'); await loadData(); } catch { toast.error('Failed'); } finally { setIsSeeding(false); } }} disabled={isSeeding} className="px-4 py-2 bg-secondary-container/30 text-secondary border border-secondary/20 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            {isSeeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />} {isSeeding ? 'Seeding...' : 'Seed Data'}
          </button>
          <button onClick={async () => { if (!confirm('Clear ALL data?')) return; setIsClearing(true); try { await clearDatabase(); toast.success('Cleared'); await loadData(); } catch { toast.error('Failed'); } finally { setIsClearing(false); } }} disabled={isClearing} className="px-4 py-2 bg-error-container/30 text-error border border-error/20 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            {isClearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} {isClearing ? 'Clearing...' : 'Clear Data'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? [1,2,3,4].map(i => <div key={i} className="h-28 bg-surface-container-low rounded-xl animate-pulse" />) : analytics ? [
          { title: 'Caregivers', value: analytics.totalCaregivers, sub: `${analytics.verifiedCaregivers} verified`, icon: Users, color: 'bg-primary-fixed text-primary' },
          { title: 'Bookings', value: analytics.totalBookings, sub: `${analytics.completedBookings} completed`, icon: Activity, color: 'bg-secondary-container/30 text-secondary' },
          { title: 'Pending', value: analytics.pendingVerification, sub: 'Needs review', icon: ShieldCheck, color: 'bg-surface-container-high text-on-surface-variant' },
          { title: 'Revenue', value: `\u20B9${analytics.totalRevenue.toLocaleString()}`, sub: `${analytics.totalSeekers} seekers`, icon: TrendingUp, color: 'bg-primary-fixed text-primary' },
        ].map((s, i) => (
          <div key={i} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 space-y-3">
            <div className="flex justify-between items-start">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}><s.icon size={20} /></div>
              <span className="text-xs font-bold text-secondary bg-secondary-container/20 px-2 py-1 rounded-full">{s.sub}</span>
            </div>
            <div className="text-xs text-on-surface-variant">{s.title}</div>
            <div className="text-2xl font-bold font-headline text-on-surface">{s.value}</div>
          </div>
        )) : null}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 space-y-6">
          <h3 className="text-lg font-bold font-headline text-on-surface">Booking Trends</h3>
          {monthlyData.length > 0 ? (
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs><linearGradient id="cB" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#00236f" stopOpacity={0.1} /><stop offset="95%" stopColor="#00236f" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e3e4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#757682', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#757682', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="bookings" stroke="#00236f" strokeWidth={2} fill="url(#cB)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <div className="h-[280px] flex items-center justify-center text-outline text-sm">No data yet. Seed to see trends.</div>}
        </div>
        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 space-y-6">
          <h3 className="text-lg font-bold font-headline text-on-surface">Regions</h3>
          {regionData.length > 0 ? <div className="space-y-5">
            {regionData.map((r, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-sm font-bold"><span className="text-on-surface-variant">{r.city}</span><span className="text-on-surface">{r.count}</span></div>
                <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(r.count / maxR) * 100}%` }} transition={{ duration: 1, delay: i * 0.1 }} className={`h-full ${regionColors[i % regionColors.length]} rounded-full`} />
                </div>
              </div>
            ))}
          </div> : <div className="h-40 flex items-center justify-center text-outline text-sm">No data yet.</div>}
        </div>
      </div>

      {/* Queue */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
          <h3 className="text-lg font-bold font-headline text-on-surface">Verification Queue ({pendingCaregivers.length})</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={14} />
            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className="pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/15 rounded-lg text-sm outline-none focus:border-primary" />
          </div>
        </div>
        <table className="w-full text-left">
          <thead><tr className="bg-surface-container-low/50 text-outline text-[10px] font-bold uppercase tracking-widest">
            <th className="px-6 py-3">User</th><th className="px-6 py-3">Location</th><th className="px-6 py-3">Skills</th><th className="px-6 py-3">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-outline-variant/10">
            {isLoading ? <tr><td colSpan={4} className="px-6 py-10 text-center text-outline">Loading...</td></tr>
            : filtered.length === 0 ? <tr><td colSpan={4} className="px-6 py-10 text-center text-outline">No pending verifications</td></tr>
            : filtered.map(g => (
              <tr key={g.user_id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-6 py-4"><div className="flex items-center gap-3">
                  <img src={g.photoURL || ''} className="w-9 h-9 rounded-lg object-cover" alt="" referrerPolicy="no-referrer" />
                  <div><div className="font-bold text-on-surface text-sm">{g.name}</div><div className="text-xs text-outline">{g.user_id}</div></div>
                </div></td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{g.location?.address || 'N/A'}</td>
                <td className="px-6 py-4"><div className="flex gap-1 flex-wrap">{g.skills.map(s => <span key={s} className="px-2 py-0.5 bg-primary-fixed text-primary rounded text-[10px] font-bold">{s}</span>)}</div></td>
                <td className="px-6 py-4"><div className="flex gap-2">
                  <button onClick={() => handleApprove(g.user_id)} className="p-2 text-secondary hover:bg-secondary-container/30 rounded-lg"><CheckCircle size={16} /></button>
                  <button onClick={() => handleReject(g.user_id)} className="p-2 text-error hover:bg-error-container/30 rounded-lg"><XCircle size={16} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
