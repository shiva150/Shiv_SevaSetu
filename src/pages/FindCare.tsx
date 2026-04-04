import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Star, ShieldCheck, ArrowRight, Loader2, X } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { Caregiver } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../components/AuthContext';
import { toast } from 'sonner';

// ─── Helpers ──────────────────────────────────────────────────

function skillMatchPct(caregiverSkills: string[], required: string[]): number {
  if (!required.length) return 0;
  const norm = (s: string) => s.toLowerCase().trim();
  const matched = required.filter(r =>
    caregiverSkills.some(cs => norm(cs).includes(norm(r)) || norm(r).includes(norm(cs)))
  );
  return Math.round((matched.length / required.length) * 100);
}

function parseSkillsFromQuery(q: string): string[] {
  const keywords = ['elder', 'elderly', 'child', 'baby', 'infant', 'patient', 'dementia',
    'physiotherapy', 'post-surgery', 'surgery', 'first aid', 'medication', 'mobility',
    'companionship', 'cooking', 'cleaning'];
  const lower = q.toLowerCase();
  return keywords.filter(k => lower.includes(k));
}

// ─── CaregiverCard ────────────────────────────────────────────

const CaregiverCard = ({
  caregiver,
  onBook,
  isBooking,
  requiredSkills,
}: {
  caregiver: Caregiver;
  onBook: (c: Caregiver) => void;
  isBooking: boolean;
  requiredSkills: string[];
}) => {
  const skillPct = skillMatchPct(caregiver.skills, requiredSkills);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden card-elevated card-hover transition-all duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start mb-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-primary-fixed flex items-center justify-center text-primary text-2xl font-bold shadow-md">
              {(caregiver.user_name || 'C')[0]}
            </div>
            {caregiver.verified && (
              <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary text-[9px] font-bold px-2 py-1 rounded-full flex items-center gap-0.5 shadow-lg">
                <ShieldCheck size={10} /> VETTED
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-secondary font-bold text-lg justify-end">
              <Star size={16} fill="currentColor" className="text-amber-500" />
              {Number(caregiver.rating).toFixed(1)}
            </div>
            <span className="text-xs text-on-surface-variant">{caregiver.rating_count} Reviews</span>
            {caregiver.hourly_rate && (
              <div className="text-lg font-bold text-primary mt-1">
                {caregiver.hourly_rate} SC<span className="text-xs text-on-surface-variant font-normal">/hr</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-xl font-extrabold text-primary font-headline">{caregiver.user_name}</h3>
          {caregiver.location_address && (
            <p className="text-on-surface-variant text-sm flex items-center gap-1 mt-1">
              <MapPin size={14} /> {caregiver.location_address}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {caregiver.skills.slice(0, 3).map(s => (
            <span key={s} className="bg-secondary-container/40 text-on-secondary-container text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-tight">{s}</span>
          ))}
          {caregiver.skills.length > 3 && (
            <span className="text-[10px] text-outline px-2 py-1">+{caregiver.skills.length - 3}</span>
          )}
        </div>

        {requiredSkills.length > 0 && (
          <div className="space-y-1.5 mb-5">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              <span>Skill Match</span><span className="text-secondary">{skillPct}%</span>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-linear-to-r from-secondary to-emerald-400 rounded-full transition-all" style={{ width: `${skillPct}%` }} />
            </div>
          </div>
        )}

        <button
          onClick={() => onBook(caregiver)}
          disabled={isBooking}
          className="w-full primary-gradient text-white py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isBooking ? <Loader2 size={16} className="animate-spin" /> : <>Request Care <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────

export const FindCare = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoursInput, setHoursInput] = useState(4);
  const [descInput, setDescInput] = useState('');

  // Fetch verified, available caregivers
  useEffect(() => {
    setIsLoading(true);
    api.get<{ data: Caregiver[]; total: number }>('/caregivers?verified=true&available=true&limit=50')
      .then(res => setCaregivers(res.data))
      .catch(() => toast.error('Failed to load caregivers'))
      .finally(() => setIsLoading(false));
  }, []);

  const requiredSkills = useMemo(() => {
    const fromQuery = parseSkillsFromQuery(searchQuery);
    const fromFilter = activeFilter ? [activeFilter.toLowerCase()] : [];
    return [...new Set([...fromQuery, ...fromFilter])];
  }, [searchQuery, activeFilter]);

  // Client-side filter by search/filter (server already returns verified+available)
  const displayed = useMemo(() => {
    if (!requiredSkills.length && !searchQuery) return caregivers;
    return caregivers
      .filter(c => {
        if (!requiredSkills.length) return true;
        return c.skills.some(s =>
          requiredSkills.some(r => s.toLowerCase().includes(r) || r.includes(s.toLowerCase()))
        );
      })
      .sort((a, b) => Number(b.rating) - Number(a.rating));
  }, [caregivers, requiredSkills, searchQuery]);

  const openBookingModal = (c: Caregiver) => {
    if (!user) { toast.error('Please sign in to request care'); return; }
    if (user.role !== 'careseeker') { toast.error('Only care seekers can request care'); return; }
    setSelectedCaregiver(c);
    setHoursInput(4);
    setDescInput('');
  };

  const handleRequest = async () => {
    if (!user || !selectedCaregiver) return;
    setIsSubmitting(true);
    try {
      await api.post('/bookings', {
        caregiver_id: selectedCaregiver.id,
        description: descInput || undefined,
        hours_needed: hoursInput,
        amount: selectedCaregiver.hourly_rate ? selectedCaregiver.hourly_rate * hoursInput : undefined,
      });
      toast.success('Booking request sent! The caregiver will respond shortly.');
      setSelectedCaregiver(null);
    } catch (err) {
      if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Failed to submit request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filters = ['Elder Care', 'Patient Care', 'Childcare', 'Dementia Care', 'Post-surgery Care', 'Companionship', 'First Aid'];

  return (
    <div className="space-y-10">
      {/* Header */}
      <section>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-8">
            <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-primary mb-3 tracking-tight">
              Find the perfect guardian for your family.
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl mb-8">
              Verified caregivers matched by skill, proximity, rating, and language.
            </p>
            <div className="flex flex-wrap gap-2">
              {filters.map(f => (
                <button key={f} onClick={() => setActiveFilter(activeFilter === f ? null : f)}
                  className={cn('px-4 py-2.5 rounded-full text-sm font-semibold transition-all border',
                    activeFilter === f
                      ? 'primary-gradient text-on-primary border-transparent shadow-md'
                      : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface hover:border-primary hover:text-primary'
                  )}>
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="lg:col-span-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="e.g. Elderly care in Patna"
                className="w-full pl-12 pr-4 py-4 bg-surface-container-lowest border-2 border-outline-variant/20 rounded-xl shadow-sm focus:border-primary outline-none text-sm transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-on-surface">
          {isLoading ? 'Loading caregivers...' : `${displayed.length} Verified Caregivers`}
        </h2>
        <span className="text-xs text-on-surface-variant">Sorted by <span className="font-bold text-primary">Rating</span></span>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-115 bg-surface-container-low rounded-2xl animate-pulse" />)}
        </div>
      ) : displayed.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayed.map(c => (
            <CaregiverCard
              key={c.id}
              caregiver={c}
              onBook={openBookingModal}
              isBooking={isSubmitting}
              requiredSkills={requiredSkills}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-16 bg-surface-container-low border-2 border-dashed border-outline-variant/20 rounded-2xl text-center">
          <Search size={32} className="text-outline mb-4" />
          <h4 className="font-bold text-on-surface text-lg mb-2">No caregivers found</h4>
          <p className="text-sm text-on-surface-variant">Try widening your search or removing filters.</p>
        </div>
      )}

      {/* Request Modal */}
      <AnimatePresence>
        {selectedCaregiver && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-on-surface/30 backdrop-blur-sm z-100 flex items-center justify-center p-4"
            onClick={() => !isSubmitting && setSelectedCaregiver(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-surface-container-lowest rounded-2xl p-8 max-w-md w-full space-y-5 shadow-2xl border border-outline-variant/15"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold font-headline text-primary">Request Care</h3>
                <button onClick={() => setSelectedCaregiver(null)} className="p-2 hover:bg-surface-container-low rounded-xl">
                  <X size={20} className="text-outline" />
                </button>
              </div>

              <div className="flex items-center gap-4 p-4 bg-surface-container rounded-xl">
                <div className="w-14 h-14 rounded-xl bg-primary-fixed flex items-center justify-center text-primary text-xl font-bold">
                  {(selectedCaregiver.user_name || 'C')[0]}
                </div>
                <div>
                  <div className="font-bold text-on-surface">{selectedCaregiver.user_name}</div>
                  <div className="text-sm text-on-surface-variant">
                    {selectedCaregiver.hourly_rate ? `${selectedCaregiver.hourly_rate} SC/hr` : 'Rate TBD'}
                    {selectedCaregiver.location_address ? ` · ${selectedCaregiver.location_address}` : ''}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface">Hours Needed</label>
                <input
                  type="number" min={1} max={24} value={hoursInput}
                  onChange={e => setHoursInput(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-on-surface">Description (optional)</label>
                <textarea
                  value={descInput} onChange={e => setDescInput(e.target.value)}
                  placeholder="Describe the care needed..."
                  rows={2}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary resize-none"
                />
              </div>

              {selectedCaregiver.hourly_rate && (
                <div className="p-4 accent-gradient rounded-xl flex items-center justify-between text-white">
                  <span className="text-sm font-bold">Estimated Total</span>
                  <span className="text-2xl font-extrabold">{selectedCaregiver.hourly_rate * hoursInput} SC</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setSelectedCaregiver(null)} className="py-3 bg-surface-container text-on-surface-variant rounded-xl font-bold">Cancel</button>
                <button
                  onClick={handleRequest}
                  disabled={isSubmitting}
                  className="py-3 primary-gradient text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Submit Request'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
