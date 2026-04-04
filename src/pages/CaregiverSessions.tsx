import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, CheckCircle, XCircle, Clock, Loader2, RefreshCw, User } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../components/AuthContext';
import { Booking } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  accepted: 'bg-secondary-container text-secondary',
  rejected: 'bg-error-container text-error',
  completed: 'bg-secondary-container/60 text-secondary',
};

const RequestCard = ({ booking, onAccept, onReject, actionLoading }: {
  booking: Booking;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
}) => {
  const isLoading = actionLoading === booking.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
      className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 shadow-sm p-6 space-y-4"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary flex items-center justify-center font-bold text-lg shrink-0">
            {(booking.seeker_name || 'S')[0]}
          </div>
          <div>
            <p className="font-bold text-on-surface">{booking.seeker_name}</p>
            <p className="text-xs text-on-surface-variant">
              Care Seeker · {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0', STATUS_STYLES[booking.status])}>
          {booking.status}
        </span>
      </div>

      {booking.description && (
        <p className="text-sm text-on-surface-variant bg-surface-container-low p-4 rounded-xl leading-relaxed">
          "{booking.description}"
        </p>
      )}

      <div className="flex items-center gap-6 text-sm">
        {booking.hours_needed && (
          <span className="flex items-center gap-2 text-on-surface-variant">
            <Clock size={14} /> {booking.hours_needed} hour{booking.hours_needed !== 1 ? 's' : ''}
          </span>
        )}
        {booking.amount && (
          <span className="font-bold text-primary text-base">{booking.amount} SC</span>
        )}
      </div>

      {booking.status === 'pending' && (
        <div className="flex gap-3 pt-2 border-t border-outline-variant/10">
          <button
            onClick={() => onAccept(booking.id)}
            disabled={isLoading}
            className="flex-1 py-3 bg-secondary text-on-secondary rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:shadow-lg transition-all"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
            Accept
          </button>
          <button
            onClick={() => onReject(booking.id)}
            disabled={isLoading}
            className="flex-1 py-3 bg-error-container/40 text-error rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-error-container/60 transition-all"
          >
            <XCircle size={16} /> Decline
          </button>
        </div>
      )}

      {booking.status === 'accepted' && (
        <div className="pt-2 border-t border-outline-variant/10">
          <div className="flex items-center gap-2 text-sm text-secondary font-bold">
            <CheckCircle size={16} /> Request accepted — awaiting care seeker to mark complete
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const CaregiverSessions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | Booking['status']>('all');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user && user.role !== 'caregiver') {
      navigate('/bookings');
    }
  }, [user, navigate]);

  const load = useCallback(async () => {
    if (!user || user.role !== 'caregiver') return;
    try {
      const res = await api.get<{ data: Booking[] }>('/bookings/incoming');
      setBookings(res.data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [load]);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/bookings/${id}/accept`);
      toast.success('Request accepted! The seeker has been notified.');
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'accepted' } : b));
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Failed to accept request');
    } finally { setActionLoading(null); }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.post(`/bookings/${id}/reject`);
      toast.success('Request declined.');
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Failed to decline request');
    } finally { setActionLoading(null); }
  };

  if (!user || user.role !== 'caregiver') return null;

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const counts = bookings.reduce<Record<string, number>>((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-primary flex items-center gap-3">
            <Inbox size={28} /> Booking Requests
            {pendingCount > 0 && (
              <span className="px-3 py-1 bg-error text-on-error rounded-full text-sm font-bold">{pendingCount} new</span>
            )}
          </h1>
          <p className="text-on-surface-variant mt-1">Review and respond to care requests from seekers.</p>
        </div>
        <button onClick={load} className="p-2 bg-surface-container-low border border-outline-variant/15 rounded-xl text-on-surface-variant hover:text-primary">
          <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
        </button>
      </div>

      {/* Stats strip */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {(['pending', 'accepted', 'rejected', 'completed'] as const).map(s => (
            <div key={s} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-4 text-center">
              <div className="text-2xl font-extrabold font-headline text-on-surface">{counts[s] || 0}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant capitalize mt-1">{s}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'accepted', 'rejected', 'completed'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn('px-4 py-2 rounded-full text-xs font-bold capitalize transition-all',
              filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest border border-outline-variant/15 text-on-surface-variant hover:border-primary'
            )}>
            {f === 'all' ? `All (${bookings.length})` : `${f} (${counts[f] || 0})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-surface-container-low rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-surface-container-low/50 border-2 border-dashed border-outline-variant/20 rounded-2xl space-y-4">
          <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mx-auto">
            <User size={28} className="text-outline" />
          </div>
          <h3 className="text-lg font-bold text-on-surface">
            {filter === 'all' ? 'No requests yet' : `No ${filter} requests`}
          </h3>
          <p className="text-sm text-on-surface-variant max-w-sm mx-auto">
            {filter === 'all'
              ? 'Once care seekers find your profile and send a request, it will appear here.'
              : `You have no ${filter} requests at this time.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map(b => (
              <RequestCard
                key={b.id}
                booking={b}
                onAccept={handleAccept}
                onReject={handleReject}
                actionLoading={actionLoading}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
