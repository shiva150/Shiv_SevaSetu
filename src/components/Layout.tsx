import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, UserPlus, Menu, X, User, LogOut, PhoneCall,
  Loader2, Calendar, LayoutDashboard, Home, Search, GraduationCap, Inbox,
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { api, ApiError } from '../lib/api';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSosLoading, setIsSosLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleSos = async () => {
    if (!user) { toast.error('Please sign in to use SOS'); return; }
    setIsSosLoading(true);
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation not supported on this device');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await api.post('/sos', {
              location_lat: pos.coords.latitude,
              location_lng: pos.coords.longitude,
            });
            toast.error('EMERGENCY ALERT SENT! Help is on the way.', {
              duration: 10000,
              description: 'Our emergency response team has been notified.',
            });
          } catch (err) {
            if (err instanceof ApiError) toast.error(err.message);
            else toast.error('Failed to send SOS. Call 112 directly.');
          } finally {
            setIsSosLoading(false);
          }
        },
        () => {
          toast.error('Could not get location. Call 112 directly.');
          setIsSosLoading(false);
        }
      );
    } catch {
      toast.error('Failed to send SOS. Call 112 directly.');
      setIsSosLoading(false);
    }
  };

  const navItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/find-care', icon: Search, label: 'Find Care' },
    { to: '/learning', icon: GraduationCap, label: 'Learning' },
    { to: '/become-caregiver', icon: UserPlus, label: 'Become Giver' },
  ];
  if (user) navItems.push({ to: '/bookings', icon: Calendar, label: 'Sessions' });
  if (user?.role === 'caregiver') navItems.push({ to: '/caregiver/sessions', icon: Inbox, label: 'Requests' });
  if (user?.role === 'admin') navItems.push({ to: '/admin', icon: LayoutDashboard, label: 'Admin' });

  const mobileNavItems = [
    { to: '/', icon: Home, label: 'Home' },
    { to: '/find-care', icon: Search, label: 'Find Care' },
    { to: '/learning', icon: GraduationCap, label: 'Learning' },
    { to: '/bookings', icon: Calendar, label: 'Sessions' },
  ];

  return (
    <div className="min-h-screen bg-background font-body text-on-surface">
      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-outline-variant/15 shadow-sm">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden text-primary hover:bg-surface-container-low p-2 rounded-full transition-colors"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link to="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-primary font-headline">SevaSetu</span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map(item => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'font-medium transition-colors text-sm',
                  location.pathname === item.to
                    ? 'text-primary font-bold border-b-2 border-primary pb-1'
                    : 'text-on-surface-variant hover:text-primary'
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Profile / Auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-bold text-primary font-headline">{user.name}</p>
                  <p className="text-xs text-on-surface-variant capitalize">{user.role}</p>
                </div>
                <div className="relative group">
                  <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-primary cursor-pointer ring-2 ring-primary-container">
                    {user.name[0]}
                  </div>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/15 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50">
                    <button onClick={() => navigate('/profile')} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low rounded-lg transition-all">
                      <User size={16} /> My Profile
                    </button>
                    <button onClick={() => navigate('/bookings')} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low rounded-lg transition-all">
                      <Calendar size={16} /> My Sessions
                    </button>
                    {user.role === 'caregiver' && (
                      <button onClick={() => navigate('/caregiver/sessions')} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-on-surface hover:bg-surface-container-low rounded-lg transition-all">
                        <Inbox size={16} /> Booking Requests
                      </button>
                    )}
                    <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-error hover:bg-error-container/30 rounded-lg transition-all">
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="primary-gradient text-on-primary px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2"
              >
                <User size={16} /> Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Slide Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-outline-variant/15 bg-surface-container-lowest overflow-hidden"
            >
              <div className="p-4 space-y-1">
                {navItems.map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl font-semibold transition-all text-sm',
                      location.pathname === item.to ? 'bg-primary-fixed text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'
                    )}
                  >
                    <item.icon size={20} /> {item.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-outline-variant/15">
                  {user ? (
                    <button
                      onClick={() => { logout(); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl font-semibold text-error hover:bg-error-container/30 text-sm"
                    >
                      <LogOut size={20} /> Sign Out
                    </button>
                  ) : (
                    <button
                      onClick={() => { navigate('/login'); setIsMenuOpen(false); }}
                      className="w-full flex items-center gap-3 p-3 rounded-xl font-semibold text-primary hover:bg-primary-fixed text-sm"
                    >
                      <User size={20} /> Sign In
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 pt-8 pb-32 md:pb-16">{children}</main>

      {/* SOS FAB */}
      <div className="fixed bottom-24 right-6 z-60 md:bottom-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleSos}
          disabled={isSosLoading}
          className="w-16 h-16 bg-error text-on-error rounded-full shadow-[0px_12px_32px_rgba(186,26,26,0.3)] flex flex-col items-center justify-center transition-transform"
        >
          {isSosLoading ? <Loader2 size={28} className="animate-spin" /> : <PhoneCall size={28} />}
          <span className="text-[8px] font-bold uppercase tracking-widest mt-0.5">SOS</span>
        </motion.button>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl border-t border-outline-variant/15 shadow-[0px_-12px_32px_rgba(0,35,111,0.06)] flex justify-around items-center px-4 pb-4 pt-2 rounded-t-3xl">
        {mobileNavItems.map(item => {
          const active = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center px-4 py-1.5 rounded-2xl transition-all active:scale-95',
                active ? 'bg-primary-container text-on-primary' : 'text-on-surface-variant hover:text-primary'
              )}
            >
              <item.icon size={20} />
              <span className="text-[10px] font-semibold tracking-wide mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <footer className="bg-surface-container-highest/30 border-t border-outline-variant/10 py-16 px-6 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-4">
            <span className="text-3xl font-bold tracking-tight text-primary font-headline">SevaSetu</span>
            <p className="text-on-surface-variant max-w-xs text-sm leading-relaxed">
              Building India's most trusted platform for elder care and caregiver empowerment.
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 md:gap-24">
            <div className="space-y-4">
              <h6 className="font-bold uppercase text-xs tracking-widest text-primary">Platform</h6>
              <ul className="space-y-2 text-on-surface-variant text-sm">
                <li><Link to="/find-care" className="hover:text-primary transition-colors">Find a Caregiver</Link></li>
                <li><Link to="/become-caregiver" className="hover:text-primary transition-colors">Become a Partner</Link></li>
                <li><Link to="/learning" className="hover:text-primary transition-colors">Learning Hub</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h6 className="font-bold uppercase text-xs tracking-widest text-primary">Support</h6>
              <ul className="space-y-2 text-on-surface-variant text-sm">
                <li><Link to="/" className="hover:text-primary transition-colors">Help Center</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Safety Protocols</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Contact Us</Link></li>
              </ul>
            </div>
            <div className="space-y-4">
              <h6 className="font-bold uppercase text-xs tracking-widest text-primary">Legal</h6>
              <ul className="space-y-2 text-on-surface-variant text-sm">
                <li><Link to="/" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-12 mt-12 border-t border-outline-variant/10 text-center text-xs text-outline">
          &copy; 2026 SevaSetu Technologies. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
};
