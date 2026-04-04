import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Shield, Star, MapPin, Clock, BookOpen, Calendar, Edit3, Save, LogOut } from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { api, ApiError } from '../lib/api';
import { Caregiver } from '../types';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';

export const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [caregiverProfile, setCaregiverProfile] = useState<Caregiver | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editBio, setEditBio] = useState('');
  const [editRate, setEditRate] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    if (user.role === 'caregiver') {
      api.get<Caregiver>('/caregivers/me/profile')
        .then(profile => {
          setCaregiverProfile(profile);
          setEditBio(profile.bio || '');
          setEditRate(profile.hourly_rate || 0);
        })
        .catch(() => {}) // Profile may not exist yet
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleSave = async () => {
    if (!caregiverProfile) return;
    setIsSaving(true);
    try {
      const updated = await api.put<Caregiver>('/caregivers', {
        bio: editBio,
        hourly_rate: editRate,
      });
      setCaregiverProfile(updated);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return (
    <div className="max-w-2xl mx-auto text-center py-20 space-y-6">
      <div className="w-20 h-20 bg-surface-container-highest text-outline rounded-full flex items-center justify-center mx-auto">
        <User size={40} />
      </div>
      <h1 className="text-3xl font-extrabold font-headline text-primary">Sign in to view your profile</h1>
    </div>
  );

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-8 animate-pulse">
      <div className="h-48 bg-surface-container-low rounded-xl" />
      <div className="h-32 bg-surface-container-low rounded-xl" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="primary-gradient p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-xl border-4 border-white/20 bg-white/20 flex items-center justify-center text-3xl font-bold">
              {user.name[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-headline">{user.name}</h1>
              <div className="flex items-center gap-3 mt-1 text-primary-fixed text-sm">
                <span>{user.phone}</span>
                {user.email && <span>{user.email}</span>}
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
              { icon: Calendar, label: 'Joined', value: new Date(user.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }), color: 'text-primary' },
              ...(caregiverProfile ? [
                { icon: Star, label: 'Rating', value: `${Number(caregiverProfile.rating).toFixed(1)}/5`, color: 'text-secondary' },
                { icon: BookOpen, label: 'Reviews', value: String(caregiverProfile.rating_count), color: 'text-secondary' },
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
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-secondary text-on-secondary rounded-lg text-sm font-bold flex items-center gap-2 disabled:opacity-50"
                  >
                    <Save size={14} /> {isSaving ? 'Saving…' : 'Save'}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-surface-container-low text-on-surface-variant rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-surface-container-high"
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs font-bold text-outline uppercase">Location</span>
                  <div className="flex items-center gap-1 text-on-surface mt-1">
                    <MapPin size={14} className="text-primary" />
                    {caregiverProfile.location_address || 'Not set'}
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold text-outline uppercase">Availability</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock size={14} className="text-primary" />
                    <span className={caregiverProfile.availability ? 'text-secondary' : 'text-on-surface-variant'}>
                      {caregiverProfile.availability ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-outline uppercase">Skills</span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {(caregiverProfile.skills as string[]).map(s => (
                    <span key={s} className="px-3 py-1 bg-secondary-container text-on-secondary-container rounded-full text-xs font-bold">{s}</span>
                  ))}
                </div>
              </div>

              {isEditing ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase">Rate (&#8377;/hr)</label>
                    <input
                      type="number" value={editRate}
                      onChange={e => setEditRate(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-outline uppercase">Bio</label>
                    <textarea
                      value={editBio}
                      onChange={e => setEditBio(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-xl outline-none focus:border-primary resize-none mt-1"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span className="text-xs font-bold text-outline uppercase">Rate</span>
                    <div className="text-xl font-bold text-primary mt-1">
                      {caregiverProfile.hourly_rate ? `${caregiverProfile.hourly_rate} SC/hr` : 'Not set'}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-outline uppercase">Bio</span>
                    <p className="text-on-surface-variant mt-1 text-sm leading-relaxed">{caregiverProfile.bio || 'No bio set.'}</p>
                  </div>
                </>
              )}

              <div className={`flex items-center gap-2 p-4 rounded-xl text-sm font-bold ${caregiverProfile.verified ? 'bg-secondary-container/30 text-secondary' : 'bg-surface-container-low text-on-surface-variant'}`}>
                {caregiverProfile.verified
                  ? <><Shield size={16} /> Verified Caregiver</>
                  : <><Clock size={16} /> Verification Pending</>}
              </div>
            </div>
          )}

          {/* Links */}
          <div className="border-t border-outline-variant/10 pt-6 space-y-2">
            <Link to="/bookings" className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-primary-fixed hover:text-primary transition-all font-bold text-sm text-on-surface-variant">
              My Sessions <span>&rarr;</span>
            </Link>
            <Link to="/learning" className="w-full flex items-center justify-between p-4 bg-surface-container-low rounded-xl hover:bg-primary-fixed hover:text-primary transition-all font-bold text-sm text-on-surface-variant">
              Learning Center <span>&rarr;</span>
            </Link>
            <button
              onClick={async () => { await logout(); navigate('/'); }}
              className="w-full flex items-center gap-2 p-4 bg-error-container/30 rounded-xl text-error hover:bg-error-container/50 transition-all font-bold text-sm"
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
