import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, BookOpen, Banknote, CheckCircle, ArrowRight, Upload, ShieldCheck, Loader2, Camera, FileCheck } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { db } from '../lib/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'Patna, Bihar': { lat: 25.5941, lng: 85.1376 },
  'Darbhanga, Bihar': { lat: 26.1209, lng: 85.8962 },
  'Nalanda, Bihar': { lat: 25.0961, lng: 85.3131 },
  'Gaya, Bihar': { lat: 24.7914, lng: 85.0002 },
  'Ranchi, Jharkhand': { lat: 23.3441, lng: 85.3096 },
  'Mumbai, Maharashtra': { lat: 19.0760, lng: 72.8777 },
  'Delhi': { lat: 28.7041, lng: 77.1025 },
  'Kolkata, West Bengal': { lat: 22.5726, lng: 88.3639 },
  'Chennai, Tamil Nadu': { lat: 13.0827, lng: 80.2707 },
  'Hyderabad, Telangana': { lat: 17.3850, lng: 78.4867 },
  'Indore, Madhya Pradesh': { lat: 22.7196, lng: 75.8577 },
  'Lucknow, Uttar Pradesh': { lat: 26.8467, lng: 80.9462 },
  'Bangalore, Karnataka': { lat: 12.9716, lng: 77.5946 },
};

function getLocationCoords(address: string) {
  if (CITY_COORDS[address]) return { ...CITY_COORDS[address], address };
  const lower = address.toLowerCase();
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (city.toLowerCase().includes(lower) || lower.includes(city.toLowerCase().split(',')[0])) return { ...coords, address };
  }
  return { lat: 22.9734, lng: 78.6569, address };
}

const StepIndicator = ({ number, title, active, completed }: { number: number; title: string; active: boolean; completed: boolean }) => (
  <div className="flex items-center gap-3 shrink-0">
    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all',
      completed ? 'bg-secondary text-on-secondary' : active ? 'bg-primary text-on-primary shadow-lg' : 'bg-surface-container-highest text-outline'
    )}>
      {completed ? <CheckCircle size={16} /> : number}
    </div>
    <span className={cn('font-bold text-sm', active ? 'text-primary' : 'text-outline')}>{title}</span>
  </div>
);

export const BecomeCaregiver = () => {
  const { user, login, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', location: '', skills: [] as string[], experience: '1-3 years', languages: [] as string[], hourlyRate: 250, bio: '' });
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const aadhaarRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, name: prev.name || user.displayName || '', email: prev.email || user.email || '' }));
      if (user.role === 'giver') setStep(4);
    }
  }, [user]);

  const toggle = (field: 'skills' | 'languages', val: string) => {
    setFormData(prev => ({ ...prev, [field]: prev[field].includes(val) ? prev[field].filter(v => v !== val) : [...prev[field], val] }));
  };

  const handleSubmit = async () => {
    if (!user) { toast.error('Please sign in first'); login(); return; }
    setIsSubmitting(true);
    try {
      await setDoc(doc(db, 'caregivers', user.uid), {
        user_id: user.uid, name: formData.name, skills: formData.skills, languages: formData.languages,
        rating: 4.5, reviewCount: 0, location: getLocationCoords(formData.location), availability: 'available',
        hourlyRate: formData.hourlyRate, isVerified: false,
        photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
        bio: formData.bio || `Professional caregiver with ${formData.experience} experience.`,
        completionRate: 1.0, cancellationRate: 0, responseTimeMinutes: 15, totalBookings: 0,
      });
      await updateDoc(doc(db, 'users', user.uid), { role: 'giver' });
      await refreshUser();
      setStep(4);
      toast.success('Application submitted! Pending admin verification.');
    } catch (e) { console.error(e); toast.error('Failed to submit. Please try again.'); }
    finally { setIsSubmitting(false); }
  };

  const skillOptions = ['Elderly Care', 'Childcare', 'Patient Care', 'Cooking', 'Cleaning', 'First Aid', 'Physiotherapy Assist', 'Dementia Care', 'Post-surgery Care', 'Companionship', 'Medication Management', 'Mobility Support'];
  const langOptions = ['Hindi', 'English', 'Bhojpuri', 'Maithili', 'Bengali', 'Marathi', 'Telugu', 'Tamil', 'Kannada', 'Malayalam'];

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-extrabold font-headline text-primary">Join the SevaSetu Network</h1>
        <p className="text-on-surface-variant text-lg">Empower yourself with skills, trust, and a stable income.</p>
      </div>

      {/* Steps */}
      <div className="bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 flex justify-between items-center overflow-x-auto gap-6">
        <StepIndicator number={1} title="Personal Info" active={step === 1} completed={step > 1} />
        <div className="h-px bg-outline-variant/20 flex-1 min-w-[16px]" />
        <StepIndicator number={2} title="Skills" active={step === 2} completed={step > 2} />
        <div className="h-px bg-outline-variant/20 flex-1 min-w-[16px]" />
        <StepIndicator number={3} title="Verification" active={step === 3} completed={step > 3} />
        <div className="h-px bg-outline-variant/20 flex-1 min-w-[16px]" />
        <StepIndicator number={4} title="Done" active={step === 4} completed={step > 4} />
      </div>

      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-5">
          {/* Sidebar */}
          <div className="lg:col-span-2 bg-primary p-10 text-white space-y-8">
            <div><h3 className="text-2xl font-bold font-headline mb-2">Why join us?</h3><p className="text-primary-fixed leading-relaxed">We provide more than just jobs. A career path with dignity and growth.</p></div>
            {[
              { icon: Banknote, title: 'Stable Income', desc: 'Weekly payouts directly to your bank.' },
              { icon: BookOpen, title: 'Free Training', desc: 'Access professional caregiving modules.' },
              { icon: ShieldCheck, title: 'Safety & Insurance', desc: 'We prioritize your safety and well-being.' },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center shrink-0"><item.icon size={20} /></div>
                <div><div className="font-bold">{item.title}</div><div className="text-sm text-primary-fixed">{item.desc}</div></div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="lg:col-span-3 p-10">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div><h2 className="text-xl font-bold font-headline text-on-surface">Personal Information</h2><p className="text-on-surface-variant text-sm">Let's start with the basics.</p></div>
                  {[
                    { label: 'Full Name', icon: User, value: formData.name, onChange: (v: string) => setFormData({ ...formData, name: v }), type: 'text', placeholder: 'Enter your full name' },
                    { label: 'Phone Number', icon: Phone, value: formData.phone, onChange: (v: string) => setFormData({ ...formData, phone: v }), type: 'tel', placeholder: '+91 XXXXX XXXXX' },
                  ].map((f, i) => (
                    <div key={i} className="space-y-1">
                      <label className="text-sm font-bold text-on-surface">{f.label}</label>
                      <div className="relative">
                        <f.icon className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={16} />
                        <input type={f.type} value={f.value} onChange={e => f.onChange(e.target.value)} placeholder={f.placeholder} className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary text-sm" />
                      </div>
                    </div>
                  ))}
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-on-surface">Location</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={16} />
                      <select value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="w-full pl-11 pr-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary text-sm appearance-none">
                        <option value="">Select your city</option>
                        {Object.keys(CITY_COORDS).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-on-surface">Short Bio</label>
                    <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Tell families about your experience..." rows={2} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary text-sm resize-none" />
                  </div>
                  <button onClick={() => { if (!formData.name || !formData.phone || !formData.location) { toast.error('Please fill all fields'); return; } setStep(2); }} className="w-full py-3 primary-gradient text-white rounded-xl font-bold flex items-center justify-center gap-2 mt-4">
                    Continue <ArrowRight size={18} />
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div><h2 className="text-xl font-bold font-headline text-on-surface">Skills & Experience</h2></div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-on-surface">Primary Skills</label>
                    <div className="flex flex-wrap gap-2">
                      {skillOptions.map(s => (
                        <button key={s} onClick={() => toggle('skills', s)} className={cn('px-3 py-2 border rounded-lg text-xs font-semibold transition-all', formData.skills.includes(s) ? 'bg-primary border-primary text-on-primary' : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-primary')}>{s}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-on-surface">Experience</label>
                    <select value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary text-sm appearance-none">
                      <option>Less than 1 year</option><option>1-3 years</option><option>3-5 years</option><option>5+ years</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-on-surface">Languages</label>
                    <div className="flex flex-wrap gap-2">
                      {langOptions.map(l => (
                        <button key={l} onClick={() => toggle('languages', l)} className={cn('px-3 py-2 border rounded-lg text-xs font-semibold transition-all', formData.languages.includes(l) ? 'bg-primary border-primary text-on-primary' : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-primary')}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-bold text-on-surface">Hourly Rate (&#8377;)</label>
                    <input type="number" value={formData.hourlyRate} onChange={e => setFormData({ ...formData, hourlyRate: parseInt(e.target.value) || 0 })} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button onClick={() => setStep(1)} className="py-3 bg-surface-container-low text-on-surface-variant rounded-xl font-bold">Back</button>
                    <button onClick={() => { if (!formData.skills.length || !formData.languages.length) { toast.error('Select at least one skill and language'); return; } setStep(3); }} className="py-3 primary-gradient text-white rounded-xl font-bold flex items-center justify-center gap-2">
                      Next <ArrowRight size={18} />
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                  <div><h2 className="text-xl font-bold font-headline text-on-surface">Identity Verification</h2><p className="text-on-surface-variant text-sm">We verify your identity for trust and safety.</p></div>

                  {/* Aadhaar Upload */}
                  <input ref={aadhaarRef} type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) { setAadhaarFile(e.target.files[0]); toast.success(`Aadhaar uploaded: ${e.target.files[0].name}`); } }} />
                  <div onClick={() => aadhaarRef.current?.click()} className={cn("p-6 border-2 border-dashed rounded-xl text-center space-y-3 cursor-pointer group transition-all", aadhaarFile ? "border-secondary bg-secondary-container/10" : "border-outline-variant/20 hover:border-primary/40")}>
                    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform", aadhaarFile ? "bg-secondary-container/30 text-secondary" : "bg-primary-fixed text-primary")}>
                      {aadhaarFile ? <FileCheck size={28} /> : <Upload size={28} />}
                    </div>
                    <div className="font-bold text-on-surface text-sm">{aadhaarFile ? aadhaarFile.name : 'Upload Aadhaar Card'}</div>
                    <div className="text-xs text-on-surface-variant">{aadhaarFile ? `${(aadhaarFile.size / 1024).toFixed(1)} KB — Click to change` : 'Front and back in JPG or PDF'}</div>
                  </div>

                  {/* Selfie Capture */}
                  <input ref={selfieRef} type="file" accept="image/*" capture="user" className="hidden" onChange={e => { if (e.target.files?.[0]) { setSelfieFile(e.target.files[0]); toast.success(`Selfie captured: ${e.target.files[0].name}`); } }} />
                  <div onClick={() => selfieRef.current?.click()} className={cn("p-6 border-2 border-dashed rounded-xl text-center space-y-3 cursor-pointer group transition-all", selfieFile ? "border-secondary bg-secondary-container/10" : "border-outline-variant/20 hover:border-primary/40")}>
                    <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform", selfieFile ? "bg-secondary-container/30 text-secondary" : "bg-primary-fixed text-primary")}>
                      {selfieFile ? <FileCheck size={28} /> : <Camera size={28} />}
                    </div>
                    <div className="font-bold text-on-surface text-sm">{selfieFile ? selfieFile.name : 'Take a Selfie'}</div>
                    <div className="text-xs text-on-surface-variant">{selfieFile ? `${(selfieFile.size / 1024).toFixed(1)} KB — Click to retake` : 'Opens camera for face verification'}</div>
                  </div>

                  <p className="text-xs text-outline text-center">Documents are reviewed within 24-48 hours. Your data is encrypted.</p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button onClick={() => setStep(2)} className="py-3 bg-surface-container-low text-on-surface-variant rounded-xl font-bold">Back</button>
                    <button disabled={isSubmitting} onClick={handleSubmit} className="py-3 bg-secondary text-on-secondary rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                      {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle size={18} /> Submit</>}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
                  <div className="w-20 h-20 bg-secondary-container text-secondary rounded-full flex items-center justify-center mx-auto"><CheckCircle size={40} /></div>
                  <h2 className="text-2xl font-bold font-headline text-on-surface">Application Submitted!</h2>
                  <p className="text-on-surface-variant max-w-xs mx-auto">Our team will verify your documents within 24-48 hours.</p>
                  <div className="space-y-3 pt-4">
                    <button onClick={() => navigate('/learning')} className="w-full py-3 primary-gradient text-white rounded-xl font-bold">Start Learning Modules</button>
                    <button onClick={() => navigate('/profile')} className="w-full py-3 bg-surface-container-low text-on-surface-variant rounded-xl font-bold border border-outline-variant/15">View Profile</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
