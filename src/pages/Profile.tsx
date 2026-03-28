import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Shield, Star, MapPin, Clock, BookOpen, Calendar, Edit3, Save, LogOut } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CaregiverProfile } from '../types';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [caregiverProfile, setCaregiverProfile] = useState<CaregiverProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editRate, setEditRate] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (user.role === 'giver') {
      getDoc(doc(db, 'caregivers', user.uid)).then(snap => {
        if (snap.exists()) { const d = snap.data() as CaregiverProfile; setCaregiverProfile(d); setEditBio(d.bio || ''); setEditRate(d.hourlyRate); }
      }).finally(() => setLoading(false));
    } else setLoading(false);
  }, [user]);

  const handleSave = async () => {
    if (!user || !caregiverProfile) return;
    try {
      await updateDoc(doc(db, 'caregivers', user.uid), { bio: editBio, hourlyRate: editRate });
      setCaregiverProfile({ ...caregiverProfile, bio: editBio, hourlyRate: editRate });
      setIsEditing(false);
      toast.success('Profile updated');
    } catch { toast.error('Failed to update'); }
  };

  if (!user) return (
    <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
      <div className="w-20 h-20 bg-surface-container-highest text-outline rounded-full flex items-center justify-center mx-auto"><User size={40} /></div>
      <h1 className="text-3xl font-extrabold font-headline text-primary">Sign in to view your profile</h1>
    </div>
  );

  if (loading) return <div className="max-w-3xl mx-auto space-y-8 animate-pulse"><div className="h-48 bg-surface-container-low rounded-xl" /><div className="h-32 bg-surface-container-low rounded-xl" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="primary-gradient p-8 text-white">
          <div className="flex items-center gap-6">
            <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`} className="w-20 h-20 rounded-xl border-4 border-white/20" alt="" referrerPolicy="no-referrer" />
            <div>
              <h1 className="text-2xl font-bold font-headline">{user.displayName}</h1>
              <div className="flex items-center gap-3 mt-1 text-primary-fixed text-sm">
                <span className="flex items-center gap-1"><Mail size={14} /> {user.email}</span>
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-bold uppercase">{user.role}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Shield, label: 'Role', value: user.role, color: 'text-primary' },
              { icon: Calendar, label: 'Joined', value: new Date(user.createdAt).toLocaleDateString(), color: 'text-primary' },
              ...(caregiverProfile ? [
                { icon: Star, label: 'Rating', value: `${caregiverProfile.rating.toFixed(1)}/5`, color: 'text-secondary' },
                { icon: BookOpen, label: 'Bookings', value: String(caregiverProfile.totalBookings || caregiverProfile.reviewCount), color: 'text-secondary' },
              ] : []),
            ].map((s, i) => (
              <div key={i} className="p-4 bg-surface-container-low rounded-xl text-center">
                <s.icon size={18} className={`mx-auto ${s.color} mb-2`} />
                <div className="text-xs text-on-surface-variant">{s.label}</div>
                <div className="font-bold text-on-surface capitalize text-sm">{s.value}</div>
              </div>
            ))}
          </div>

          {/* Caregiver Details */}
          {caregiverProfile && (
            <div className="space-y-4 border-t border-outline-variant/10 pt-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold font-headline text-on-surface">Caregiver Profile</h2>
                {isEditing ? (
                  <button onClick={handleSave} className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-bold flex items-center gap-2"><Save size={14} /> Save</button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-surface-container-high"><Edit3 size={14} /> Edit</button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-xs font-bold text-outline uppercase">Location</span><div className="flex items-center gap-1 text-on-surface mt-1"><MapPin size={14} className="text-primary" />{caregiverProfile.location?.address || 'Not set'}</div></div>
                <div><span className="text-xs font-bold text-outline uppercase">Availability</span><div className="flex items-center gap-1 mt-1"><Clock size={14} className="text-primary" /><span className={`capitalize ${caregiverProfile.availability === 'available' ? 'text-secondary' : 'text-on-surface-variant'}`}>{caregiverProfile.availability}</span></div></div>
              </div>
              <div><span className="text-xs font-bold text-outline uppercase">Skills</span><div className="flex flex-wrap gap-2 mt-1">{caregiverProfile.skills.map(s => <span key={s} className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold">{s}</span>)}</div></div>
              {isEditing ? (
                <>
                  <div><label className="text-xs font-bold text-outline uppercase">Rate (&#8377;)</label><input type="number" value={editRate} onChange={e => setEditRate(parseInt(e.target.value) || 0)} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary mt-1" /></div>
                  <div><label className="text-xs font-bold text-outline uppercase">Bio</label><textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={3} className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary resize-none mt-1" /></div>
                </>
              ) : (
                <>
                  <div><span className="text-xs font-bold text-outline uppercase">Rate</span><div className="text-xl font-bold text-primary mt-1">&#8377;{caregiverProfile.hourlyRate}/hr</div></div>
                  <div><span className="text-xs font-bold text-outline uppercase">Bio</span><p className="text-on-surface-variant mt-1 text-sm leading-relaxed">{caregiverProfile.bio || 'No bio set.'}</p></div>
                </>
              )}
              <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-bold ${caregiverProfile.isVerified ? 'bg-secondary-container/30 text-secondary' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {caregiverProfile.isVerified ? <><Shield size={16} /> Verified Caregiver</> : <><Clock size={16} /> Verification Pending</>}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="border-t border-outline-variant/10 pt-6 space-y-2">
            <Link to="/bookings" className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-primary-fixed hover:text-primary transition-all font-bold text-sm text-on-surface-variant">My Bookings <span>&rarr;</span></Link>
            <Link to="/learning" className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-primary-fixed hover:text-primary transition-all font-bold text-sm text-on-surface-variant">Learning Center <span>&rarr;</span></Link>
            <button onClick={async () => { await logout(); navigate('/'); }} className="w-full flex items-center gap-2 p-4 bg-error-container/30 rounded-xl text-error hover:bg-error-container/50 transition-all font-bold text-sm"><LogOut size={16} /> Sign Out</button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
