import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, User, CheckCircle, XCircle, Loader2, Star, Inbox, RefreshCw } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../components/AuthContext';
import { Session, Booking } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// ─── Status badge colours ─────────────────────────────────────

const SESSION_STATUS: Record<string, string> = {
  scheduled: 'bg-primary-fixed text-primary',
  active: 'bg-secondary-container text-on-secondary-container',
  completed: 'bg-secondary-container/60 text-secondary',
  cancelled: 'bg-error-container text-on-error-container',
};

const BOOKING_STATUS: Record<string, string> = {
  pending: 'bg-surface-container-high text-on-surface-variant',
  accepted: 'bg-secondary-container text-secondary',
  rejected: 'bg-error-container text-error',
  completed: 'bg-secondary-container/60 text-secondary',
};

// ─── Booking card ─────────────────────────────────────────────

const BookingCard = ({ booking, userId, onAction }: {
  booking: Booking;
  userId: string;
  onAction: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const isSeeker = booking.seeker_id === userId;
  const counterpart = isSeeker ? booking.caregiver_name : booking.seeker_name;

  const doAction = async (endpoint: string, msg: string) => {
    setLoading(true);
    try {
      await api.post(endpoint);
      toast.success(msg);
      onAction();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-fixed text-primary rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
            {(counterpart || 'U')[0]}
          </div>
          <div>
            <p className="font-bold text-on-surface text-sm">{counterpart}</p>
            <p className="text-xs text-on-surface-variant">
              {isSeeker ? 'Caregiver' : 'Care Seeker'} ·{' '}
              {new Date(booking.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0', BOOKING_STATUS[booking.status])}>
          {booking.status}
        </span>
      </div>

      {booking.description && (
        <p className="text-sm text-on-surface-variant bg-surface-container-low p-3 rounded-lg">{booking.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-on-surface-variant">
        {booking.hours_needed && (
          <span className="flex items-center gap-1"><Clock size={12} /> {booking.hours_needed}h</span>
        )}
        {booking.amount && (
          <span className="flex items-center gap-1 font-bold text-primary">{booking.amount} SC</span>
        )}
      </div>

      {/* Seeker: mark complete on accepted booking */}
      {isSeeker && booking.status === 'accepted' && (
        <div className="pt-2 border-t border-outline-variant/10">
          <button
            onClick={() => doAction(`/bookings/${booking.id}/complete`, 'Booking marked complete!')}
            disabled={loading}
            className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
            Mark Complete
          </button>
        </div>
      )}
    </motion.div>
  );
};

// ─── Session card (existing flow) ────────────────────────────

const SessionCard = ({ s, userId, onAction }: {
  s: Session; userId: string; onAction: () => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [score, setScore] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const isSeeker = s.payment_status !== undefined; // always true for sessions

  const doAction = async (endpoint: string, msg: string) => {
    setLoading(true);
    try {
      await api.post(endpoint);
      toast.success(msg);
      onAction();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Action failed');
    } finally { setLoading(false); }
  };

  const submitRating = async () => {
    setSubmittingRating(true);
    try {
      await api.post('/ratings', { session_id: s.id, score, feedback: feedback || undefined });
      toast.success('Rating submitted!');
      setRatingOpen(false);
      onAction();
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
    } finally { setSubmittingRating(false); }
  };

  const isSeekerRole = userId !== s.caregiver_id;
  const name = isSeekerRole ? s.caregiver_name : s.seeker_name;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-5 space-y-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-fixed text-primary rounded-xl flex items-center justify-center">
            <User size={18} />
          </div>
          <div>
            <p className="font-bold text-on-surface text-sm">{name || 'Unknown'}</p>
            <p className="text-xs text-on-surface-variant">
              {isSeekerRole ? 'Caregiver' : 'Seeker'} · {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
        <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0', SESSION_STATUS[s.status])}>
          {s.status}
        </span>
      </div>

      {s.request_description && (
        <p className="text-sm text-on-surface-variant bg-surface-container-low p-3 rounded-lg">{s.request_description}</p>
      )}

      <div className="flex flex-wrap gap-3 pt-2 border-t border-outline-variant/10">
        {isSeekerRole && s.status === 'active' && (
          <button onClick={() => doAction(`/sessions/${s.id}/complete`, 'Session completed!')} disabled={loading}
            className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Complete
          </button>
        )}
        {isSeekerRole && s.status === 'completed' && s.payment_status === 'completed' && (
          <button onClick={() => doAction(`/payments/session/${s.id}/release`, 'Payment released!')} disabled={loading}
            className="px-4 py-2 primary-gradient text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Release Payment
          </button>
        )}
        {isSeekerRole && s.status === 'completed' && (
          <button onClick={() => setRatingOpen(true)}
            className="px-4 py-2 bg-surface-container text-on-surface-variant rounded-lg text-sm font-bold flex items-center gap-2">
            <Star size={14} /> Rate
          </button>
        )}
        {(s.status === 'scheduled' || s.status === 'active') && (
          <button onClick={() => doAction(`/sessions/${s.id}/cancel`, 'Session cancelled.')} disabled={loading}
            className="px-4 py-2 bg-error-container/30 text-error rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
            <XCircle size={14} /> Cancel
          </button>
        )}
      </div>

      <AnimatePresence>
        {ratingOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-100 flex items-center justify-center p-4"
            onClick={() => !submittingRating && setRatingOpen(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-container-lowest rounded-2xl p-8 max-w-sm w-full space-y-5 shadow-2xl border border-outline-variant/15">
              <h3 className="text-xl font-bold font-headline text-primary">Rate this session</h3>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(n => (
                  <button key={n} onClick={() => setScore(n)}
                    className={cn('w-10 h-10 rounded-full font-bold text-sm transition-all', score >= n ? 'bg-amber-400 text-white' : 'bg-surface-container text-on-surface-variant')}>
                    <Star size={16} fill={score >= n ? 'white' : 'none'} className="mx-auto" />
                  </button>
                ))}
              </div>
              <textarea value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Share your experience..."
                rows={3} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary resize-none text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setRatingOpen(false)} className="py-3 bg-surface-container text-on-surface-variant rounded-xl font-bold">Cancel</button>
                <button onClick={submitRating} disabled={submittingRating}
                  className="py-3 primary-gradient text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                  {submittingRating ? <Loader2 size={16} className="animate-spin" /> : 'Submit'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main page ────────────────────────────────────────────────

export const Bookings = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<'requests' | 'sessions'>('requests');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadBookings = useCallback(async () => {
    if (!user) return;
    try {
      const endpoint = user.role === 'caregiver' ? '/bookings/incoming' : '/bookings/my';
      const res = await api.get<{ data: Booking[] }>(endpoint);
      setBookings(res.data);
    } catch { /* silent */ }
  }, [user]);

  const loadSessions = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get<{ data: Session[] }>('/sessions?limit=50');
      setSessions(res.data);
    } catch { /* silent */ }
  }, [user]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadBookings(), loadSessions()]);
    setLoading(false);
  }, [loadBookings, loadSessions]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadAll();
    // Poll every 5 seconds for real-time-like updates
    pollRef.current = setInterval(() => {
      loadBookings();
    }, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [user, loadAll, loadBookings]);

  if (!user) return (
    <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
      <Calendar size={40} className="mx-auto text-outline" />
      <h1 className="text-3xl font-extrabold font-headline text-primary">Sign in to view bookings</h1>
    </div>
  );

  const filteredBookings = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const filteredSessions = filter === 'all' ? sessions : sessions.filter(s => s.status === filter);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-primary">
            {user.role === 'caregiver' ? 'Incoming Requests' : 'My Bookings'}
          </h1>
          <p className="text-on-surface-variant mt-1">
            {user.role === 'caregiver' ? 'Accept or reject care requests from seekers.' : 'Track your booking requests and session history.'}
          </p>
        </div>
        <button onClick={loadAll} disabled={loading}
          className="p-2 bg-surface-container-low border border-outline-variant/15 rounded-xl text-on-surface-variant hover:text-primary disabled:opacity-50">
          <RefreshCw size={16} className={cn(loading && 'animate-spin')} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-surface-container-low rounded-xl w-fit">
        <button
          onClick={() => setTab('requests')}
          className={cn('px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2',
            tab === 'requests' ? 'bg-surface-container-lowest shadow text-primary' : 'text-on-surface-variant hover:text-primary'
          )}
        >
          <Inbox size={16} />
          {user.role === 'caregiver' ? 'Requests' : 'Booking Requests'}
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-error text-on-error rounded-full text-[10px] font-bold">{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab('sessions')}
          className={cn('px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2',
            tab === 'sessions' ? 'bg-surface-container-lowest shadow text-primary' : 'text-on-surface-variant hover:text-primary'
          )}
        >
          <Calendar size={16} /> Sessions
        </button>
      </div>

      {/* Status filters */}
      {tab === 'requests' && (
        <div className="flex flex-wrap gap-2">
          {(['all', 'pending', 'accepted', 'rejected', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all',
                filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest border border-outline-variant/15 text-on-surface-variant hover:border-primary'
              )}>
              {f === 'all' ? `All (${bookings.length})` : `${f} (${bookings.filter(b => b.status === f).length})`}
            </button>
          ))}
        </div>
      )}

      {tab === 'sessions' && (
        <div className="flex flex-wrap gap-2">
          {(['all', 'scheduled', 'active', 'completed', 'cancelled'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all',
                filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest border border-outline-variant/15 text-on-surface-variant hover:border-primary'
              )}>
              {f === 'all' ? `All (${sessions.length})` : `${f} (${sessions.filter(s => s.status === f).length})`}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-surface-container-low rounded-xl animate-pulse" />)}
        </div>
      ) : tab === 'requests' ? (
        filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low/50 border-2 border-dashed border-outline-variant/20 rounded-xl">
            <Inbox size={40} className="mx-auto text-outline mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">
              {user.role === 'caregiver' ? 'No requests yet' : 'No booking requests'}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {user.role === 'caregiver' ? 'Incoming requests from care seekers will appear here.' : 'Submit a care request from the Find Care page.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredBookings.map(b => (
                <BookingCard key={b.id} booking={b} userId={user.id} onAction={loadBookings} />
              ))}
            </AnimatePresence>
          </div>
        )
      ) : (
        filteredSessions.length === 0 ? (
          <div className="text-center py-16 bg-surface-container-low/50 border-2 border-dashed border-outline-variant/20 rounded-xl">
            <Calendar size={40} className="mx-auto text-outline mb-4" />
            <h3 className="text-lg font-bold text-on-surface mb-2">No sessions found</h3>
            <p className="text-sm text-on-surface-variant">Sessions created through the matching system will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {filteredSessions.map(s => (
                <SessionCard key={s.id} s={s} userId={user.id} onAction={loadSessions} />
              ))}
            </AnimatePresence>
          </div>
        )
      )}
    </div>
  );
};
