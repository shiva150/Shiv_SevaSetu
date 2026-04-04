import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Award, Play, CheckCircle, Clock, TrendingUp, Banknote, Users, CheckCircle2, X, ChevronRight, Lightbulb } from 'lucide-react';
import { api, ApiError } from '../lib/api';
import { useAuth } from '../components/AuthContext';
import { LearningModule, ModuleProgress, QuizQuestion } from '../types';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

// ─── Module Card ─────────────────────────────────────────────

const ModuleCard = ({ module, isCompleted, onOpen }: {
  module: LearningModule; isCompleted: boolean; onOpen: () => void;
}) => (
  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 overflow-hidden card-elevated card-hover transition-all duration-300 group">
    <div className="relative h-44 overflow-hidden cursor-pointer" onClick={onOpen}>
      <img
        src={`https://picsum.photos/seed/${module.id}/400/300`}
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        alt={module.title}
        referrerPolicy="no-referrer"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
      {module.category && (
        <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold uppercase tracking-wider text-primary">
          {module.category}
        </div>
      )}
      {isCompleted && (
        <div className="absolute top-3 right-3 bg-secondary text-on-secondary p-1.5 rounded-full shadow-lg">
          <CheckCircle2 size={14} />
        </div>
      )}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
        <span className="flex items-center gap-1"><Clock size={12} /> {module.duration_minutes ? `${module.duration_minutes} min` : '—'}</span>
        <span className="flex items-center gap-1"><Users size={12} /> {Math.floor(Math.random() * 200 + 100)}</span>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="w-14 h-14 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-xl">
          <Play size={24} className="text-primary ml-1" fill="currentColor" />
        </div>
      </div>
    </div>
    <div className="p-5 space-y-3">
      <h3 className="font-bold text-on-surface leading-snug h-10 line-clamp-2 font-headline text-sm">{module.title}</h3>
      <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{module.description}</p>
      <button
        onClick={onOpen}
        className={cn('w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2',
          isCompleted
            ? 'accent-gradient text-white shadow-md'
            : 'bg-surface-container text-on-surface-variant hover:primary-gradient hover:text-white hover:shadow-lg'
        )}
      >
        {isCompleted ? <><CheckCircle size={14} /> Review Module</> : <><Play size={14} /> Start Learning</>}
      </button>
    </div>
  </div>
);

// ─── Quiz ────────────────────────────────────────────────────

const QuizView = ({ questions, onComplete }: { questions: QuizQuestion[]; onComplete: (score: number) => void }) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  if (!questions || questions.length === 0) {
    return (
      <div className="text-center py-12 text-on-surface-variant">
        <BookOpen size={32} className="mx-auto mb-3 text-outline" />
        <p className="font-medium">No quiz available for this module yet.</p>
      </div>
    );
  }

  const q = questions[currentQ];

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correctIndex) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  };

  if (finished) {
    const passed = score >= Math.ceil(questions.length * 0.6);
    const finalScore = Math.round((score / questions.length) * 100);
    return (
      <div className="text-center space-y-6 py-8">
        <div className={cn('w-20 h-20 rounded-full flex items-center justify-center mx-auto',
          passed ? 'bg-secondary-container text-secondary' : 'bg-error-container text-error'
        )}>
          {passed ? <Award size={40} /> : <X size={40} />}
        </div>
        <h3 className="text-2xl font-extrabold font-headline">{passed ? 'Quiz Passed!' : 'Try Again'}</h3>
        <p className="text-on-surface-variant">You scored <strong>{score}/{questions.length}</strong> ({finalScore}%)</p>
        {passed ? (
          <button onClick={() => onComplete(finalScore)} className="primary-gradient text-white px-8 py-3 rounded-xl font-bold shadow-lg">
            <CheckCircle size={16} className="inline mr-2" /> Mark Module Complete
          </button>
        ) : (
          <button
            onClick={() => { setCurrentQ(0); setSelected(null); setAnswered(false); setScore(0); setFinished(false); }}
            className="bg-surface-container text-on-surface-variant px-8 py-3 rounded-xl font-bold"
          >
            Retake Quiz
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Question {currentQ + 1} of {questions.length}</span>
        <div className="flex gap-1">
          {questions.map((_, i) => (
            <div key={i} className={cn('w-2 h-2 rounded-full',
              i < currentQ ? 'bg-secondary' : i === currentQ ? 'bg-primary' : 'bg-outline-variant/30'
            )} />
          ))}
        </div>
      </div>
      <h4 className="text-lg font-bold text-on-surface font-headline">{q.question}</h4>
      <div className="space-y-3">
        {q.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)}
            className={cn('w-full text-left p-4 rounded-xl border-2 font-medium text-sm transition-all',
              !answered ? 'border-outline-variant/20 hover:border-primary bg-surface-container-lowest' :
              i === q.correctIndex ? 'border-secondary bg-secondary-container/20 text-secondary' :
              i === selected ? 'border-error bg-error-container/20 text-error' :
              'border-outline-variant/10 bg-surface-container-low text-on-surface-variant opacity-60'
            )}>
            <span className="flex items-center gap-3">
              <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                !answered ? 'bg-surface-container text-on-surface-variant' :
                i === q.correctIndex ? 'bg-secondary text-white' :
                i === selected ? 'bg-error text-white' : 'bg-surface-container-high text-outline'
              )}>{String.fromCharCode(65 + i)}</span>
              {opt}
            </span>
          </button>
        ))}
      </div>
      {answered && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className={cn('p-4 rounded-xl text-sm flex items-start gap-3',
            selected === q.correctIndex ? 'bg-secondary-container/20 text-on-secondary-container' : 'bg-error-container/30 text-on-error-container'
          )}>
          <Lightbulb size={18} className="shrink-0 mt-0.5" />
          <span>{q.explanation}</span>
        </motion.div>
      )}
      {answered && (
        <button onClick={handleNext} className="primary-gradient text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 ml-auto">
          {currentQ < questions.length - 1 ? <>Next <ChevronRight size={16} /></> : <>See Results <Award size={16} /></>}
        </button>
      )}
    </div>
  );
};

// ─── Module Viewer ────────────────────────────────────────────

const ModuleViewer = ({ module, isCompleted, onClose, onComplete }: {
  module: LearningModule; isCompleted: boolean; onClose: () => void; onComplete: (score: number) => void;
}) => {
  const [tab, setTab] = useState<'video' | 'content' | 'quiz'>('video');

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-100 flex items-start justify-center p-4 pt-8 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-surface-container-lowest rounded-2xl w-full max-w-3xl shadow-2xl border border-outline-variant/15 overflow-hidden mb-8"
      >
        <div className="primary-gradient p-6 text-white relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"><X size={20} /></button>
          <div className="flex items-center gap-2 mb-2">
            {module.category && (
              <span className="px-3 py-1 bg-white/15 rounded-full text-[10px] font-bold uppercase tracking-wider">{module.category}</span>
            )}
            {module.duration_minutes && <span className="text-white/60 text-xs">{module.duration_minutes} min</span>}
            {isCompleted && (
              <span className="px-3 py-1 bg-secondary rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle size={10} /> Completed
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold font-headline">{module.title}</h2>
          {module.description && <p className="text-white/70 mt-1 text-sm">{module.description}</p>}
        </div>

        <div className="flex border-b border-outline-variant/15">
          {[
            { id: 'video' as const, label: 'Video', icon: Play },
            { id: 'content' as const, label: 'Content', icon: BookOpen },
            { id: 'quiz' as const, label: 'Quiz', icon: Award },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all border-b-2',
                tab === t.id ? 'border-primary text-primary bg-primary-fixed/30' : 'border-transparent text-on-surface-variant hover:text-primary'
              )}>
              <t.icon size={16} /> {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === 'video' && (
            <div className="space-y-6">
              {module.video_url ? (
                <div className="aspect-video bg-on-surface rounded-xl overflow-hidden">
                  <iframe src={module.video_url} className="w-full h-full" allowFullScreen title={module.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              ) : (
                <div className="aspect-video bg-surface-container-low rounded-xl flex items-center justify-center text-outline">
                  No video available
                </div>
              )}
              {module.key_takeaways?.length > 0 && (
                <div className="bg-surface-container rounded-xl p-5 space-y-3">
                  <h4 className="font-bold text-on-surface font-headline flex items-center gap-2"><Lightbulb size={18} className="text-secondary" /> Key Takeaways</h4>
                  <ul className="space-y-2">
                    {module.key_takeaways.map((t, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-on-surface-variant">
                        <CheckCircle size={14} className="text-secondary shrink-0 mt-0.5" /> {t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button onClick={() => setTab('content')} className="primary-gradient text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
                Read Full Content <ChevronRight size={16} />
              </button>
            </div>
          )}

          {tab === 'content' && (
            <div className="space-y-8">
              {(module.content_sections ?? []).map((sec, i) => (
                <div key={i} className="space-y-3">
                  <h4 className="text-lg font-bold font-headline text-primary flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary-fixed text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    {sec.heading}
                  </h4>
                  <p className="text-on-surface-variant leading-relaxed pl-9">{sec.body}</p>
                </div>
              ))}
              <div className="bg-primary-fixed/30 rounded-xl p-5 border border-primary/10">
                <p className="text-sm font-bold text-primary mb-2">Ready to test your knowledge?</p>
                <p className="text-xs text-on-surface-variant mb-4">You need to pass the quiz (60%+) to mark this module as complete.</p>
                <button onClick={() => setTab('quiz')} className="primary-gradient text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2">
                  Take Quiz <Award size={16} />
                </button>
              </div>
            </div>
          )}

          {tab === 'quiz' && (
            <QuizView questions={module.quiz ?? []} onComplete={onComplete} />
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Main Learning Page ──────────────────────────────────────

export const Learning = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [viewingModule, setViewingModule] = useState<LearningModule | null>(null);

  useEffect(() => {
    api.get<{ modules: LearningModule[] }>('/learning/modules')
      .then(res => setModules(res.modules))
      .catch(() => toast.error('Failed to load modules'))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!user) return;
    api.get<{ progress: ModuleProgress[] }>('/learning/progress')
      .then(res => {
        const map: Record<string, boolean> = {};
        res.progress.forEach(p => { map[p.module_id] = p.completed; });
        setProgress(map);
      })
      .catch(() => {});
  }, [user]);

  const markComplete = async (moduleId: string, quizScore: number) => {
    if (!user) { toast.error('Sign in to track progress'); return; }
    try {
      await api.post('/learning/progress', {
        module_id: moduleId,
        completed: true,
        quiz_score: quizScore,
      });
      setProgress(p => ({ ...p, [moduleId]: true }));
      toast.success('Module completed! Badge earned.');
      setViewingModule(null);
    } catch (err) {
      if (err instanceof ApiError) toast.error(err.message);
      else toast.error('Failed to save progress');
    }
  };

  const completedCount = Object.values(progress).filter(Boolean).length;
  const pct = modules.length > 0 ? Math.round((completedCount / modules.length) * 100) : 0;
  const categories = [...new Set(modules.map(m => m.category).filter(Boolean))] as string[];
  const filtered = activeCategory ? modules.filter(m => m.category === activeCategory) : modules;

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold font-headline text-primary">Learning Center</h1>
          <p className="text-on-surface-variant mt-2 text-lg">Watch, learn, pass the quiz, earn your badge.</p>
        </div>
        <div className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 card-elevated">
          <div className="text-right">
            <div className="text-xs text-on-surface-variant">Progress</div>
            <div className="text-lg font-extrabold text-on-surface font-headline">{completedCount}/{modules.length}</div>
          </div>
          <div className="w-14 h-14 rounded-full border-[3px] border-primary flex items-center justify-center font-extrabold text-primary text-sm">
            {pct}%
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="primary-gradient text-white p-8 rounded-3xl space-y-3 shadow-lg shadow-primary/20">
          <TrendingUp size={28} />
          <div className="text-4xl font-extrabold font-headline">25%</div>
          <div className="text-primary-fixed text-sm">Avg earnings increase after certification</div>
        </div>
        <div className="accent-gradient text-white p-8 rounded-3xl space-y-3 shadow-lg shadow-secondary/20">
          <Award size={28} />
          <div className="text-4xl font-extrabold font-headline">{completedCount}</div>
          <div className="text-sm opacity-80">Badges earned</div>
        </div>
        <div className="bg-surface-container-lowest border-2 border-outline-variant/15 p-8 rounded-3xl space-y-3 card-elevated">
          <Banknote size={28} className="text-primary" />
          <div className="text-4xl font-extrabold font-headline text-on-surface">{completedCount * 500} SC</div>
          <div className="text-on-surface-variant text-sm">Bonus from learning</div>
        </div>
      </div>

      {/* Category Filters */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCategory(null)}
            className={cn('px-4 py-2 rounded-full text-sm font-bold transition-all border',
              !activeCategory ? 'primary-gradient text-on-primary border-transparent shadow-md' : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant hover:border-primary'
            )}>All ({modules.length})</button>
          {categories.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn('px-4 py-2 rounded-full text-sm font-bold transition-all border',
                activeCategory === cat ? 'primary-gradient text-on-primary border-transparent shadow-md' : 'bg-surface-container-lowest border-outline-variant/20 text-on-surface-variant hover:border-primary'
              )}>{cat}</button>
          ))}
        </div>
      )}

      {/* Modules Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-80 bg-surface-container-low rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-surface-container-low border-2 border-dashed border-outline-variant/20 rounded-2xl">
          <BookOpen size={40} className="mx-auto text-outline mb-4" />
          <h3 className="text-lg font-bold text-on-surface mb-2">No modules yet</h3>
          <p className="text-sm text-on-surface-variant">An admin needs to add learning modules.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(m => (
            <ModuleCard key={m.id} module={m} isCompleted={progress[m.id] || false} onOpen={() => setViewingModule(m)} />
          ))}
        </div>
      )}

      {/* Certification */}
      <div className="primary-gradient rounded-3xl p-12 text-white overflow-hidden relative shadow-xl">
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 rounded-full text-xs font-bold uppercase tracking-widest">
              Professional Path
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold font-headline leading-tight">
              Become a Certified SevaSetu Care Specialist
            </h2>
            <p className="text-white/70 text-lg">Complete all {modules.length} modules and pass every quiz to unlock premium bookings.</p>
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
            <p className="text-sm text-white/60">{completedCount} of {modules.length} ({pct}%)</p>
          </div>
          <div className="relative shrink-0">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}>
              <Award size={160} className="text-white/20" />
            </motion.div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-5xl font-black">PRO</div>
              <div className="text-xs font-bold uppercase tracking-widest opacity-60">Certified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Module Viewer Modal */}
      <AnimatePresence>
        {viewingModule && (
          <ModuleViewer
            module={viewingModule}
            isCompleted={progress[viewingModule.id] || false}
            onClose={() => setViewingModule(null)}
            onComplete={(score) => markComplete(viewingModule.id, score)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
