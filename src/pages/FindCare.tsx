import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, ShieldCheck, Languages, Clock, ArrowRight, Zap, Loader2, X, AlertTriangle } from 'lucide-react';
import { collection, onSnapshot, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CaregiverProfile, MatchResult } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthContext';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { rankCaregivers, parseSearchQuery } from '../services/matching';
import { SAMPLE_CAREGIVERS } from '../services/seed';

const DotBar = ({ value, max = 5 }: { value: number; max?: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: max }).map((_, i) => (
      <div key={i} className={cn('w-2.5 h-1.5 rounded-full', i < value ? 'bg-secondary' : 'bg-outline-variant/30')} />
    ))}
  </div>
);

const CaregiverCard = ({ result, onBook, isBooking }: { result: MatchResult; onBook: (c: CaregiverProfile) => void; isBooking: boolean }) => {
  const { caregiver: c, score, breakdown, explanation } = result;
  const reliabilityPct = Math.round(breakdown.reliabilityScore * 100);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden card-elevated card-hover transition-all duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div className="relative">
            <img src={c.photoURL || `https://picsum.photos/seed/${c.user_id}/200/200`} className="w-20 h-20 rounded-2xl object-cover shadow-md" alt={c.name} referrerPolicy="no-referrer" />
            {c.isVerified && (
              <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-0.5 shadow-lg">
                <ShieldCheck size={10} /> VETTED
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-secondary font-bold text-lg justify-end">
              <Star size={16} fill="currentColor" className="text-amber-500" /> {c.rating.toFixed(1)}
            </div>
            <span className="text-xs text-on-surface-variant">{c.reviewCount} Reviews</span>
            <div className="text-lg font-bold text-primary mt-1">&#8377;{c.hourlyRate}<span className="text-xs text-on-surface-variant font-normal">/hr</span></div>
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-extrabold text-primary font-headline">{c.name}</h3>
          <p className="text-on-surface-variant text-sm flex items-center gap-1 mt-1"><MapPin size={14} /> {c.location?.address}</p>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {c.skills.slice(0, 3).map(s => (
            <span key={s} className="bg-secondary-container/40 text-on-secondary-container text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-tight">{s}</span>
          ))}
          {c.skills.length > 3 && <span className="text-[10px] text-outline px-2 py-1">+{c.skills.length - 3}</span>}
        </div>

        <div className="space-y-1.5 mb-5">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            <span>Reliability</span><span className="text-secondary">{reliabilityPct}%</span>
          </div>
          <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-secondary to-emerald-400 rounded-full transition-all" style={{ width: `${reliabilityPct}%` }} />
          </div>
        </div>

        <div className="bg-surface-container rounded-xl p-4 space-y-2.5 mb-5 border border-outline-variant/10">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Why this match — {score}%</p>
          {[
            { label: 'Skill Overlap', val: breakdown.skillMatch },
            { label: 'Proximity', val: breakdown.distanceScore },
            { label: 'Rating', val: breakdown.ratingScore },
            { label: 'Reliability', val: breakdown.reliabilityScore },
          ].map(({ label, val }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs text-on-surface-variant">{label}</span>
              <DotBar value={Math.round(val * 5)} />
            </div>
          ))}
          <p className="text-[11px] text-on-surface-variant leading-relaxed pt-1 border-t border-outline-variant/10">{explanation}</p>
        </div>

        <button
          onClick={() => onBook(c)}
          disabled={isBooking}
          className="w-full primary-gradient text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isBooking ? <Loader2 size={16} className="animate-spin" /> : <>Book Now <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  );
};

export const FindCare = () => {
  const { user, login } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [caregivers, setCaregivers] = useState<CaregiverProfile[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [firestoreEmpty, setFirestoreEmpty] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState<CaregiverProfile | null>(null);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [hoursInput, setHoursInput] = useState(4);
  const [notesInput, setNotesInput] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'caregivers'), where('isVerified', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => d.data() as CaregiverProfile);
      if (data.length > 0) {
        setCaregivers(data);
        setFirestoreEmpty(false);
      } else {
        // Fallback to sample data
        setCaregivers(SAMPLE_CAREGIVERS.filter(c => c.isVerified));
        setFirestoreEmpty(true);
      }
    }, () => {
      // On error (e.g. permissions), use sample data
      setCaregivers(SAMPLE_CAREGIVERS.filter(c => c.isVerified));
      setFirestoreEmpty(true);
    });
    return () => unsub();
  }, []);

  const matchResults = useMemo(() => {
    const request = parseSearchQuery(searchQuery);
    if (activeFilter) request.skills = [...new Set([...request.skills, activeFilter])];
    return rankCaregivers(caregivers, request);
  }, [caregivers, activeFilter, searchQuery]);

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setIsSearching(true); setTimeout(() => setIsSearching(false), 500); };

  const openBookingModal = (c: CaregiverProfile) => {
    if (!user) { toast.error('Please sign in to book'); login(); return; }
    setSelectedCaregiver(c); setHoursInput(4); setNotesInput('');
  };

  const handleBook = async () => {
    if (!user || !selectedCaregiver) return;
    setIsSubmittingBooking(true);
    const id = uuidv4();
    const amount = selectedCaregiver.hourlyRate * hoursInput;
    try {
      // Only send fields allowed by deployed Firestore rules
      await setDoc(doc(db, 'bookings', id), {
        id,
        seeker_id: user.uid,
        caregiver_id: selectedCaregiver.user_id,
        status: 'pending',
        timestamp: Date.now(),
        totalAmount: amount,
        notes: `${notesInput || 'Care booking'} | ${selectedCaregiver.name} | ${hoursInput}hrs | Seeker: ${user.displayName}`,
      });

      // Escrow — try to create, but don't block booking if it fails
      try {
        await setDoc(doc(db, 'escrows', uuidv4()), {
          booking_id: id,
          amount,
          status: 'locked',
          timestamp: Date.now(),
        });
      } catch (escrowErr) {
        console.warn('Escrow creation skipped (rules may need deployment):', escrowErr);
      }

      toast.success(`Booking confirmed! \u20B9${amount} for ${selectedCaregiver.name}.`);
      setSelectedCaregiver(null);
    } catch (err) {
      console.error('Booking error:', err);
      toast.error('Failed to create booking. Check console for details.');
    } finally { setIsSubmittingBooking(false); }
  };

  const filters = ['Elder Care', 'Patient Care', 'Childcare', 'Dementia Care', 'Post-surgery Care', 'Companionship', 'First Aid'];

  return (
    <div className="space-y-10">
      {/* Header */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-primary mb-3 tracking-tight">Find the perfect guardian for your family.</h1>
            <p className="text-on-surface-variant text-lg max-w-2xl mb-8">AI-matched caregivers vetted for expertise, empathy, and reliability.</p>
            <div className="flex flex-wrap gap-2">
              {filters.map(f => (
                <button key={f} onClick={() => setActiveFilter(activeFilter === f ? null : f)}
                  className={cn('px-4 py-2.5 rounded-full text-sm font-semibold transition-all border',
                    activeFilter === f ? 'primary-gradient text-on-primary border-transparent shadow-md' : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface hover:border-primary hover:text-primary'
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="e.g. Elderly care in Patna"
                className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant/20 rounded-xl shadow-sm focus:border-primary focus:ring-2 focus:ring-primary-fixed outline-none text-sm transition-all" />
            </form>
          </div>
        </div>
      </section>

      {/* Sample data banner */}
      {firestoreEmpty && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm font-medium">
          <AlertTriangle size={18} className="shrink-0" />
          <span>Showing sample caregivers. Go to <strong>Admin → Seed Data</strong> to populate your Firestore database with real data.</span>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-on-surface">{isSearching ? 'Matching...' : `${matchResults.length} Ranked Matches`}</h2>
        <span className="text-xs text-on-surface-variant">Sorted by <span className="font-bold text-primary">AI Score</span></span>
      </div>

      {/* Grid */}
      {isSearching ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-[500px] bg-surface-container-low rounded-2xl animate-pulse" />)}
        </div>
      ) : matchResults.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matchResults.map(r => <CaregiverCard key={r.caregiver.user_id} result={r} onBook={openBookingModal} isBooking={isSubmittingBooking} />)}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 bg-surface-container-low border-2 border-dashed border-outline-variant/20 rounded-2xl text-center">
          <Search size={32} className="text-outline mb-4" />
          <h4 className="font-bold text-on-surface text-lg mb-2">No caregivers found</h4>
          <p className="text-sm text-on-surface-variant">Try widening your search or removing filters.</p>
        </div>
      )}

      {/* Booking Modal */}
      <AnimatePresence>
        {selectedCaregiver && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => !isSubmittingBooking && setSelectedCaregiver(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-container-lowest rounded-2xl p-8 max-w-md w-full space-y-5 shadow-2xl border border-outline-variant/15">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-headline text-primary">Book {selectedCaregiver.name}</h3>
                <button onClick={() => setSelectedCaregiver(null)} className="p-2 hover:bg-surface-container-low rounded-xl"><X size={20} className="text-outline" /></button>
              </div>
              <div className="flex items-center gap-4 p-4 bg-surface-container rounded-xl">
                <img src={selectedCaregiver.photoURL || ''} className="w-14 h-14 rounded-xl object-cover" alt="" referrerPolicy="no-referrer" />
                <div>
                  <div className="font-bold text-on-surface">{selectedCaregiver.name}</div>
                  <div className="text-sm text-on-surface-variant">&#8377;{selectedCaregiver.hourlyRate}/hr &middot; {selectedCaregiver.location?.address}</div>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface">Hours Needed</label>
                <input type="number" min={1} max={24} value={hoursInput} onChange={e => setHoursInput(Math.max(1, parseInt(e.target.value) || 1))} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary" />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface">Notes</label>
                <textarea value={notesInput} onChange={e => setNotesInput(e.target.value)} placeholder="Describe care needed..." rows={2} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary resize-none" />
              </div>
              <div className="p-4 accent-gradient rounded-xl flex items-center justify-between text-white">
                <span className="text-sm font-bold">Total (Escrow)</span>
                <span className="text-2xl font-extrabold">&#8377;{selectedCaregiver.hourlyRate * hoursInput}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSelectedCaregiver(null)} className="py-3 bg-surface-container text-on-surface-variant rounded-xl font-bold">Cancel</button>
                <button onClick={handleBook} disabled={isSubmittingBooking} className="py-3 primary-gradient text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSubmittingBooking ? <Loader2 size={18} className="animate-spin" /> : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
