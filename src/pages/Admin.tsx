import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, ShieldCheck, TrendingUp, Search, CheckCircle, XCircle, Activity, Loader2, AlertTriangle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api, ApiError } from '../lib/api';
import { AnalyticsSummary, Caregiver } from '../types';
import { toast } from 'sonner';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Admin = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pendingCaregivers, setPendingCaregivers] = useState<Caregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role !== 'admin') {
      toast.error('Admin access only');
      navigate('/');
    }
  }, [user, navigate]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, pendingRes] = await Promise.all([
        api.get<AnalyticsSummary>('/admin/analytics'),
        api.get<{ data: Caregiver[] }>('/caregivers/admin/pending'),
      ]);
      setAnalytics(analyticsRes);
      setPendingCaregivers(pendingRes.data);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (caregiverId: string) => {
    setActionLoading(caregiverId);
    try {
      await api.post(`/caregivers/${caregiverId}/verify`);
      toast.success('Caregiver approved');
      setPendingCaregivers(p => p.filter(c => c.id !== caregiverId));
      setAnalytics(a => a ? { ...a, pendingVerification: a.pendingVerification - 1, verifiedCaregivers: a.verifiedCaregivers + 1 } : a);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Failed to approve');
    } finally { setActionLoading(null); }
  };

  const handleReject = async (caregiverId: string) => {
    setActionLoading(caregiverId);
    try {
      await api.post(`/caregivers/${caregiverId}/reject`);
      toast.success('Caregiver rejected');
      setPendingCaregivers(p => p.filter(c => c.id !== caregiverId));
      setAnalytics(a => a ? { ...a, pendingVerification: a.pendingVerification - 1 } : a);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Failed to reject');
    } finally { setActionLoading(null); }
  };

  const filtered = pendingCaregivers.filter(c =>
    !searchTerm || (c.user_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Build a simple chart from session status counts
  const sessionChartData = analytics
    ? Object.entries(analytics.sessionsByStatus).map(([name, count]) => ({ name, sessions: count }))
    : [];

  const regionColors = ['bg-primary', 'bg-secondary', 'bg-on-surface-variant', 'bg-error', 'bg-outline'];

  if (user && user.role !== 'admin') return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-primary">Admin Command Center</h1>
          <p className="text-on-surface-variant">Real-time oversight of the SevaSetu network.</p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-4 py-2 bg-surface-container-low text-on-surface-variant border border-outline-variant/15 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Activity size={14} />}
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-surface-container-low rounded-xl animate-pulse" />)
        ) : analytics ? [
          { title: 'Caregivers', value: analytics.totalCaregivers, sub: `${analytics.verifiedCaregivers} verified`, icon: Users, color: 'bg-primary-fixed text-primary' },
          { title: 'Sessions', value: Object.values(analytics.sessionsByStatus).reduce((a, b) => a + b, 0), sub: `${analytics.sessionsByStatus.completed || 0} completed`, icon: Activity, color: 'bg-secondary-container/30 text-secondary' },
          { title: 'Pending Review', value: analytics.pendingVerification, sub: 'Needs verification', icon: ShieldCheck, color: 'bg-surface-container-high text-on-surface-variant' },
          { title: 'Revenue', value: `${analytics.totalRevenue.toLocaleString('en-IN')} SC`, sub: `${analytics.totalSeekers} seekers`, icon: TrendingUp, color: 'bg-primary-fixed text-primary' },
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
          <h3 className="text-lg font-bold font-headline text-on-surface">Session Status Breakdown</h3>
          {sessionChartData.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sessionChartData}>
                  <defs>
                    <linearGradient id="cB" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00236f" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#00236f" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e1e3e4" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#757682', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#757682', fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }} />
                  <Area type="monotone" dataKey="sessions" stroke="#00236f" strokeWidth={2} fill="url(#cB)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-outline text-sm">No session data yet.</div>
          )}
        </div>

        <div className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 space-y-6">
          <h3 className="text-lg font-bold font-headline text-on-surface">Active Alerts</h3>
          {analytics && analytics.activeAlerts > 0 ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <AlertTriangle size={40} className="text-error" />
              <div className="text-3xl font-extrabold text-error">{analytics.activeAlerts}</div>
              <p className="text-sm text-on-surface-variant text-center">Active SOS alerts requiring attention</p>
            </div>
          ) : (
            <div className="h-40 flex flex-col items-center justify-center gap-3">
              {analytics ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-secondary-container/30 flex items-center justify-center">
                    <ShieldCheck size={24} className="text-secondary" />
                  </div>
                  <p className="text-sm text-on-surface-variant text-center">No active SOS alerts</p>
                </>
              ) : (
                <div className="h-10 w-full bg-surface-container-low rounded-xl animate-pulse" />
              )}
            </div>
          )}
          {analytics && (
            <div className="space-y-4 border-t border-outline-variant/10 pt-4">
              {Object.entries(analytics.sessionsByStatus).map(([status, count], i) => (
                <div key={status} className="space-y-1.5">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="text-on-surface-variant capitalize">{status}</span>
                    <span className="text-on-surface">{count}</span>
                  </div>
                  <div className="h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / Math.max(...Object.values(analytics.sessionsByStatus))) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={`h-full ${regionColors[i % regionColors.length]} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Verification Queue */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 overflow-hidden">
        <div className="p-6 border-b border-outline-variant/10 flex items-center justify-between">
          <h3 className="text-lg font-bold font-headline text-on-surface">
            Verification Queue ({pendingCaregivers.length})
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline" size={14} />
            <input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-surface-container-low border border-outline-variant/15 rounded-lg text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low/50 text-outline text-[10px] font-bold uppercase tracking-widest">
              <th className="px-6 py-3">User</th>
              <th className="px-6 py-3">Location</th>
              <th className="px-6 py-3">Skills</th>
              <th className="px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {isLoading ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-outline">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-10 text-center text-outline">No pending verifications</td></tr>
            ) : filtered.map(cg => (
              <tr key={cg.id} className="hover:bg-surface-container-low/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-fixed flex items-center justify-center text-primary font-bold">
                      {(cg.user_name || 'C')[0]}
                    </div>
                    <div>
                      <div className="font-bold text-on-surface text-sm">{cg.user_name}</div>
                      <div className="text-xs text-outline">{cg.user_phone}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{cg.location_address || 'N/A'}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-1 flex-wrap">
                    {(cg.skills as string[]).map(s => (
                      <span key={s} className="px-2 py-0.5 bg-primary-fixed text-primary rounded text-[10px] font-bold">{s}</span>
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(cg.id)}
                      disabled={actionLoading === cg.id}
                      className="p-2 text-secondary hover:bg-secondary-container/30 rounded-lg disabled:opacity-50"
                    >
                      {actionLoading === cg.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    </button>
                    <button
                      onClick={() => handleReject(cg.id)}
                      disabled={actionLoading === cg.id}
                      className="p-2 text-error hover:bg-error-container/30 rounded-lg disabled:opacity-50"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
