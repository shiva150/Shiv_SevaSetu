import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, DollarSign, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../components/AuthContext';
import { Booking } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-surface-container-high text-on-surface-variant',
  confirmed: 'bg-primary-fixed text-primary',
  completed: 'bg-secondary-container text-on-secondary-container',
  cancelled: 'bg-error-container text-on-error-container',
};

export const Bookings = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const all: Record<string, Booking> = {};
    const unsub1 = onSnapshot(query(collection(db, 'bookings'), where('seeker_id', '==', user.uid)), snap => {
      snap.docs.forEach(d => { all[d.id] = d.data() as Booking; });
      setBookings(Object.values(all).sort((a, b) => b.timestamp - a.timestamp));
      setLoading(false);
    });
    const unsub2 = onSnapshot(query(collection(db, 'bookings'), where('caregiver_id', '==', user.uid)), snap => {
      snap.docs.forEach(d => { all[d.id] = d.data() as Booking; });
      setBookings(Object.values(all).sort((a, b) => b.timestamp - a.timestamp));
      setLoading(false);
    });
    return () => { unsub1(); unsub2(); };
  }, [user]);

  const updateStatus = async (id: string, status: Booking['status']) => {
    setActionLoading(id);
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
      if (status === 'completed' || status === 'cancelled') {
        const escrowSnap = await getDocs(query(collection(db, 'escrows'), where('booking_id', '==', id)));
        for (const d of escrowSnap.docs) {
          await updateDoc(doc(db, 'escrows', d.id), { status: status === 'completed' ? 'released' : 'refunded' });
        }
      }
      toast.success(status === 'confirmed' ? 'Booking confirmed!' : status === 'completed' ? 'Completed! Payment released.' : 'Booking cancelled.');
    } catch { toast.error('Failed to update'); }
    finally { setActionLoading(null); }
  };

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);

  if (!user) return (
    <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
      <Calendar size={40} className="mx-auto text-outline" />
      <h1 className="text-3xl font-extrabold font-headline text-primary">Sign in to view bookings</h1>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-headline text-primary">My Bookings</h1>
          <p className="text-on-surface-variant mt-1">Track care requests and payment status.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={cn(
              'px-4 py-2 rounded-full text-xs font-bold capitalize transition-all',
              filter === f ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest border border-outline-variant/15 text-on-surface-variant hover:border-primary'
            )}>
              {f === 'all' ? `All (${bookings.length})` : `${f} (${bookings.filter(b => b.status === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-28 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low/50 border-2 border-dashed border-outline-variant/20 rounded-xl">
          <Calendar size={40} className="mx-auto text-outline mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">No bookings found</h3>
          <p className="text-sm text-on-surface-variant">{filter === 'all' ? 'Your booking history will appear here.' : `No ${filter} bookings.`}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map(b => {
              const isSeeker = b.seeker_id === user.uid;
              const name = isSeeker ? (b.caregiver_name || 'Caregiver') : (b.seeker_name || 'Seeker');
              return (
                <motion.div key={b.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary-fixed text-primary rounded-xl flex items-center justify-center"><User size={20} /></div>
                      <div>
                        <h3 className="font-bold text-on-surface text-sm">{name}</h3>
                        <p className="text-xs text-on-surface-variant">{isSeeker ? 'Caregiver' : 'Seeker'} &middot; {new Date(b.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                    <span className={cn('px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider', STATUS_STYLES[b.status])}>{b.status}</span>
                  </div>
                  {b.notes && <p className="text-sm text-on-surface-variant bg-surface-container-low p-3 rounded-lg">{b.notes}</p>}
                  <div className="flex items-center gap-6 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1"><Clock size={14} /> {b.hours || 4}h</span>
                    <span className="flex items-center gap-1 font-bold text-primary">&#8377;{b.totalAmount}</span>
                  </div>
                  {(b.status === 'pending' || b.status === 'confirmed') && (
                    <div className="flex items-center gap-3 pt-2 border-t border-outline-variant/10">
                      {b.status === 'pending' && !isSeeker && (
                        <button onClick={() => updateStatus(b.id, 'confirmed')} disabled={actionLoading === b.id} className="px-4 py-2 primary-gradient text-white rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                          {actionLoading === b.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Accept
                        </button>
                      )}
                      {b.status === 'confirmed' && (
                        <button onClick={() => updateStatus(b.id, 'completed')} disabled={actionLoading === b.id} className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                          {actionLoading === b.id ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Complete
                        </button>
                      )}
                      <button onClick={() => updateStatus(b.id, 'cancelled')} disabled={actionLoading === b.id} className="px-4 py-2 bg-error-container/30 text-error rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50">
                        <XCircle size={14} /> Cancel
                      </button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
