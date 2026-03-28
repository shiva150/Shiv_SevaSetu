import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Zap, CheckCircle, ArrowRight, Star, Search, UserPlus, MessageCircle, Heart, BookOpen, Banknote, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const testimonials = [
  { text: 'Finding a reliable caregiver for my elderly parents was impossible until SevaSetu. The AI matching was spot on!', name: 'Rahul Gupta', role: 'Care Seeker, Bihar' },
  { text: 'SevaSetu gave me a career I never thought possible. The training helped me become a certified caregiver with steady income.', name: 'Anjali Sharma', role: 'Caregiver, Patna' },
  { text: 'The escrow system gives us complete peace of mind. Payments are secure and every caregiver is verified.', name: 'Geeta Singh', role: 'Care Seeker, Ranchi' },
];

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-24">
      {/* Hero */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center overflow-hidden -mx-6 -mt-8 px-6 pt-16 pb-20">
        <div className="absolute inset-0 z-0">
          <img src="https://picsum.photos/seed/sevasetu-hero/1600/900" className="w-full h-full object-cover hero-mask opacity-30" alt="" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>
        <div className="relative z-10 max-w-4xl text-center space-y-8">
          <div className="inline-flex items-center px-4 py-2 bg-secondary-container/30 text-on-secondary-container rounded-full text-sm font-semibold tracking-wide border border-secondary/10">
            <ShieldCheck size={16} className="mr-2" />
            Empowering Rural Bharat with AI-Enhanced Care
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold font-headline text-primary tracking-tight leading-[1.1]">
            Connecting Hearts. <br />
            <span className="text-on-surface-variant">Empowering Care.</span>
          </h1>
          <p className="text-xl md:text-2xl text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            Bridging the gap between specialized care and rural accessibility. SevaSetu combines human empathy with AI precision to protect your loved ones.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link to="/find-care" className="primary-gradient text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2">
              Find Caregiver <Search size={20} />
            </Link>
            <Link to="/become-caregiver" className="bg-surface-container-lowest border-2 border-secondary text-secondary px-8 py-4 rounded-xl font-bold text-lg hover:bg-secondary/5 transition-all active:scale-95 flex items-center gap-2">
              Become Caregiver <UserPlus size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Impact Stats */}
        <div className="md:col-span-2 bg-primary text-white p-10 rounded-3xl flex flex-col justify-between overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 rotate-12 group-hover:rotate-0 transition-transform duration-700">
            <Users size={200} />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold font-headline mb-4">Making an Impact</h2>
            <p className="text-primary-fixed/80 max-w-md text-lg">Delivering dignity and health services across 250+ villages through our verified caregiver network.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-12 relative z-10">
            <div><p className="text-3xl font-extrabold font-headline">12k+</p><p className="text-xs uppercase tracking-widest text-primary-fixed">Active Givers</p></div>
            <div><p className="text-3xl font-extrabold font-headline">4.9/5</p><p className="text-xs uppercase tracking-widest text-primary-fixed">Trust Rating</p></div>
            <div><p className="text-3xl font-extrabold font-headline">50k+</p><p className="text-xs uppercase tracking-widest text-primary-fixed">Lives Touched</p></div>
            <div><p className="text-3xl font-extrabold font-headline">0.4s</p><p className="text-xs uppercase tracking-widest text-primary-fixed">SOS Response</p></div>
          </div>
        </div>

        {/* AI Card */}
        <div className="glass-card border border-outline-variant/15 p-8 rounded-3xl flex flex-col space-y-6">
          <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
            <Zap size={24} />
          </div>
          <h3 className="text-2xl font-bold font-headline">AI-Driven Matching</h3>
          <p className="text-on-surface-variant leading-relaxed">Our AI scores caregivers by skill match (35%), proximity (20%), ratings (20%), and reliability (25%).</p>
          <div className="pt-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span className="text-xs font-bold text-secondary uppercase tracking-tighter">Live Analysis</span>
            </div>
            <div className="h-12 w-full bg-surface-container rounded-lg overflow-hidden flex items-end gap-1 px-2">
              {[40, 60, 85, 55, 70, 90, 65].map((h, i) => (
                <div key={i} className="w-full bg-secondary-container rounded-t-sm" style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Flow */}
      <section className="bg-surface-container-low -mx-6 px-6 py-24 rounded-3xl">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl font-extrabold font-headline text-primary">How SevaSetu Works</h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">Seamless, secure, and supportive. Here is how we ensure your peace of mind.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-10 left-0 w-full h-px border-t-2 border-dashed border-outline-variant/30 -z-0" />
            {[
              { icon: Search, title: '1. Find Your Match', desc: 'Browse AI-recommended caregivers based on medical needs, language, and location.', color: 'text-primary' },
              { icon: Shield, title: '2. Verified Protection', desc: 'Every caregiver undergoes rigorous background checks and clinical skill validation.', color: 'text-secondary' },
              { icon: MessageCircle, title: '3. Stay Connected', desc: 'Real-time updates, escrow payments, and live monitoring for complete peace of mind.', color: 'text-tertiary' },
            ].map((step, i) => (
              <div key={i} className="relative z-10 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-surface-container-lowest shadow-xl flex items-center justify-center border-4 border-surface-container-low">
                  <step.icon size={36} className={step.color} />
                </div>
                <h4 className="text-xl font-bold font-headline">{step.title}</h4>
                <p className="text-on-surface-variant">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Empowerment */}
      <section className="flex flex-col md:flex-row items-center gap-16">
        <div className="w-full md:w-1/2 rounded-3xl overflow-hidden shadow-2xl">
          <img src="https://picsum.photos/seed/empower/800/600" className="w-full h-[500px] object-cover" alt="Empowerment" referrerPolicy="no-referrer" />
        </div>
        <div className="w-full md:w-1/2 space-y-8">
          <h2 className="text-4xl font-extrabold font-headline text-primary leading-tight">
            Empowering Caregivers, <br /> Uplifting Communities.
          </h2>
          {[
            { icon: GraduationCap, title: 'Advanced Learning Hub', desc: 'Upskill with micro-courses designed by top geriatric experts and medical professionals.' },
            { icon: Banknote, title: 'Financial Independence', desc: 'Transparent earnings and direct-to-bank settlements for our rural caregiving partners.' },
            { icon: ShieldCheck, title: 'Health Coverage', desc: 'Insurance and wellness programs for all active members of the SevaSetu network.' },
          ].map((item, i) => (
            <div key={i} className="flex gap-4">
              <div className="shrink-0 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <item.icon size={20} />
              </div>
              <div>
                <h5 className="font-bold text-lg font-headline">{item.title}</h5>
                <p className="text-on-surface-variant">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="space-y-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-extrabold font-headline text-primary">Voices of Trust</h2>
          <p className="text-on-surface-variant">Hear from families and caregivers who found their bridge with SevaSetu.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/10 shadow-sm hover:shadow-[0px_12px_32px_rgba(0,35,111,0.06)] transition-all space-y-6">
              <div className="flex gap-1 text-amber-400">
                {[1,2,3,4,5].map(j => <Star key={j} size={16} fill="currentColor" />)}
              </div>
              <p className="text-on-surface-variant italic leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-4">
                <img src={`https://picsum.photos/seed/testi${i}/100/100`} className="w-10 h-10 rounded-full object-cover" alt="" referrerPolicy="no-referrer" />
                <div>
                  <div className="font-bold text-on-surface text-sm">{t.name}</div>
                  <div className="text-xs text-on-surface-variant">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 space-y-8">
        <h2 className="text-4xl md:text-5xl font-extrabold font-headline text-primary">Ready to find the perfect care?</h2>
        <p className="text-xl text-on-surface-variant max-w-2xl mx-auto">Join thousands of families who trust SevaSetu for their caregiving needs.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/find-care" className="primary-gradient text-white px-10 py-5 rounded-xl font-bold text-xl shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
            Find Caregiver Now
          </Link>
          <Link to="/become-caregiver" className="bg-surface-container-lowest border-2 border-outline-variant/30 text-on-surface px-10 py-5 rounded-xl font-bold text-xl hover:border-primary hover:text-primary transition-all">
            Become a Giver
          </Link>
        </div>
      </section>
    </div>
  );
};

const GraduationCap = BookOpen;
