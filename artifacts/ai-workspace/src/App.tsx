import React, { useRef, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  getGetAssistantActivityQueryKey,
  useGetAssistantActivity,
  useGetAssistantProvider,
  useRespondToAssistant,
} from '@workspace/api-client-react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Check, Menu, MessageSquare, MoreHorizontal, Plus, Send,
  Sparkles, SquarePen, X, Zap, Lock, LogOut, Settings, ChevronRight,
  User, CreditCard, Shield, AlertCircle,
} from 'lucide-react';
import { type ReactNode } from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const GOOGLE_CLIENT_ID = '770226334577-61g8e7kfd9ebobi196ma3sstd6cl6kov.apps.googleusercontent.com';

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string };
type Category = { id: string; icon?: React.ReactNode; gradient?: string; glow?: string; title: string; desc: string; placeholder: string; creditCost: number };
type UserProfile = { name: string; email: string; picture: string };
type Screen = 'login' | 'onboarding' | 'chat' | 'out-of-credits';

const CAT_ICONS: Record<string, React.ReactNode> = {
  coding: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M8 6L3 12l5 6" stroke="url(#cg1)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M16 6l5 6-5 6" stroke="url(#cg2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 4l-4 16" stroke="url(#cg3)" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <linearGradient id="cg1" x1="3" y1="6" x2="8" y2="18"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#6366f1"/></linearGradient>
        <linearGradient id="cg2" x1="16" y1="6" x2="21" y2="18"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#6366f1"/></linearGradient>
        <linearGradient id="cg3" x1="10" y1="4" x2="14" y2="20"><stop stopColor="#a5b4fc"/><stop offset="1" stopColor="#818cf8"/></linearGradient>
      </defs>
    </svg>
  ),
  automation: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="url(#ag1)"/>
      <path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12" stroke="url(#ag2)" strokeWidth="2" strokeLinecap="round"/>
      <defs>
        <radialGradient id="ag1" cx="50%" cy="50%" r="50%"><stop stopColor="#34d399"/><stop offset="1" stopColor="#10b981"/></radialGradient>
        <linearGradient id="ag2" x1="2" y1="2" x2="22" y2="22"><stop stopColor="#6ee7b7"/><stop offset="1" stopColor="#34d399"/></linearGradient>
      </defs>
    </svg>
  ),
  design: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="7" cy="7" r="3" fill="url(#dg1)"/>
      <circle cx="17" cy="7" r="3" fill="url(#dg2)"/>
      <circle cx="7" cy="17" r="3" fill="url(#dg3)"/>
      <circle cx="17" cy="17" r="3" fill="url(#dg4)"/>
      <defs>
        <radialGradient id="dg1"><stop stopColor="#f87171"/><stop offset="1" stopColor="#ef4444"/></radialGradient>
        <radialGradient id="dg2"><stop stopColor="#fbbf24"/><stop offset="1" stopColor="#f59e0b"/></radialGradient>
        <radialGradient id="dg3"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#3b82f6"/></radialGradient>
        <radialGradient id="dg4"><stop stopColor="#a78bfa"/><stop offset="1" stopColor="#8b5cf6"/></radialGradient>
      </defs>
    </svg>
  ),
  content: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="url(#wg1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <defs>
        <linearGradient id="wg1" x1="2" y1="3" x2="21" y2="22"><stop stopColor="#f9a8d4"/><stop offset="1" stopColor="#ec4899"/></linearGradient>
      </defs>
    </svg>
  ),
  analytics: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="12" width="4" height="9" rx="1" fill="url(#ang1)"/>
      <rect x="10" y="7" width="4" height="14" rx="1" fill="url(#ang2)"/>
      <rect x="17" y="3" width="4" height="18" rx="1" fill="url(#ang3)"/>
      <defs>
        <linearGradient id="ang1" x1="5" y1="12" x2="5" y2="21"><stop stopColor="#38bdf8"/><stop offset="1" stopColor="#0ea5e9"/></linearGradient>
        <linearGradient id="ang2" x1="12" y1="7" x2="12" y2="21"><stop stopColor="#7dd3fc"/><stop offset="1" stopColor="#38bdf8"/></linearGradient>
        <linearGradient id="ang3" x1="19" y1="3" x2="19" y2="21"><stop stopColor="#bae6fd"/><stop offset="1" stopColor="#7dd3fc"/></linearGradient>
      </defs>
    </svg>
  ),
  ideas: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M9 18h6M10 21h4M12 2a7 7 0 0 1 7 7c0 2.5-1.3 4.7-3.3 6-.5.4-.7.8-.7 1.3V17H9v-.7c0-.5-.2-.9-.7-1.3A7 7 0 0 1 12 2z" stroke="url(#ig1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <defs>
        <linearGradient id="ig1" x1="5" y1="2" x2="19" y2="22"><stop stopColor="#fde68a"/><stop offset="1" stopColor="#f59e0b"/></linearGradient>
      </defs>
    </svg>
  ),
};

const CATEGORIES: Category[] = [
  { id: 'coding',     icon: CAT_ICONS.coding,     gradient: 'from-indigo-500/20 to-purple-500/10',  glow: 'rgba(99,102,241,0.3)',  title: 'Кодинг',        desc: 'Программирование, дебаг, код-ревью',    placeholder: 'Спроси про код или ошибку...',    creditCost: 2 },
  { id: 'automation', icon: CAT_ICONS.automation, gradient: 'from-emerald-500/20 to-teal-500/10',   glow: 'rgba(16,185,129,0.3)',  title: 'Автоматизация', desc: 'Скрипты, воркфлоу, боты, сайты',        placeholder: 'Что хочешь автоматизировать?',    creditCost: 2 },
  { id: 'design',     icon: CAT_ICONS.design,     gradient: 'from-pink-500/20 to-orange-500/10',    glow: 'rgba(236,72,153,0.3)',  title: 'Дизайн',        desc: 'UI/UX, идеи, описание компонентов',      placeholder: 'Опиши что хочешь задизайнить...', creditCost: 1 },
  { id: 'content',    icon: CAT_ICONS.content,    gradient: 'from-rose-500/20 to-pink-500/10',      glow: 'rgba(244,63,94,0.3)',   title: 'Контент',       desc: 'Тексты, посты, копирайтинг',             placeholder: 'Что нужно написать?',             creditCost: 1 },
  { id: 'analytics',  icon: CAT_ICONS.analytics,  gradient: 'from-sky-500/20 to-blue-500/10',       glow: 'rgba(14,165,233,0.3)',  title: 'Аналитика',     desc: 'Данные, отчёты, таблицы',                placeholder: 'Задай вопрос по данным...',        creditCost: 1 },
  { id: 'ideas',      icon: CAT_ICONS.ideas,      gradient: 'from-amber-500/20 to-yellow-500/10',   glow: 'rgba(245,158,11,0.3)', title: 'Идеи',          desc: 'Брейншторм, планирование, исследование', placeholder: 'Что обсудим?',                     creditCost: 1 },
];

const TOTAL_CREDITS = 20;
const S_CREDITS = 'nekit_credits';
const S_CREDITS_RESET = 'nekit_credits_reset';
const S_USER = 'nekit_user';
const S_CATEGORY = 'nekit_category';
const RESET_HOURS = 5;

function getCredits(): number {
  const lastReset = localStorage.getItem(S_CREDITS_RESET);
  const now = Date.now();
  // Если прошло 48 часов — сбрасываем кредиты
  if (!lastReset || now - parseInt(lastReset) > RESET_HOURS * 60 * 60 * 1000) {
    localStorage.setItem(S_CREDITS, String(TOTAL_CREDITS));
    localStorage.setItem(S_CREDITS_RESET, String(now));
    return TOTAL_CREDITS;
  }
  const v = localStorage.getItem(S_CREDITS);
  return v === null ? TOTAL_CREDITS : parseInt(v, 10);
}

function saveCredits(n: number) { localStorage.setItem(S_CREDITS, String(Math.max(0, n))); }

function getTimeUntilReset(): string {
  const lastReset = localStorage.getItem(S_CREDITS_RESET);
  if (!lastReset) return '48ч';
  const msLeft = RESET_HOURS * 60 * 60 * 1000 - (Date.now() - parseInt(lastReset));
  if (msLeft <= 0) return 'скоро';
  const h = Math.floor(msLeft / 3600000);
  const m = Math.floor((msLeft % 3600000) / 60000);
  return `${h}ч ${m}м`;
}

const ease = [0.22, 1, 0.36, 1] as [number, number, number, number];

const pageV = {
  initial: { opacity: 0, y: 32, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease } },
  exit: { opacity: 0, y: -20, scale: 0.97, transition: { duration: 0.25 } },
};

const cardV = {
  initial: { opacity: 0, y: 24, scale: 0.94 },
  animate: (i: number) => ({ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.06, duration: 0.4, ease } }),
  hover: { scale: 1.04, transition: { duration: 0.12, ease: 'easeOut' } },
  tap:   { scale: 0.96, transition: { duration: 0.08 } },
};

const btnV = {
  hover: { scale: 1.04, transition: { duration: 0, ease: 'easeOut' } },
  tap: { scale: 0.94, transition: { duration: 0.07 } },
};

const msgV = {
  initial: { opacity: 0, y: 14, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease } },
};

// ── Login ──────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (u: UserProfile) => void }) {
  const [loading, setLoading] = useState(false);
  const login = useGoogleLogin({
    onSuccess: async (t) => {
      setLoading(true);
      try {
        const r = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', { headers: { Authorization: `Bearer ${t.access_token}` } });
        const d = await r.json() as { name: string; email: string; picture: string };
        onLogin({ name: d.name, email: d.email, picture: d.picture });
      } catch { setLoading(false); }
    },
    onError: () => setLoading(false),
  });

  return (
    <motion.div key="login" variants={pageV} initial="initial" animate="animate" exit="exit"
      className="flex h-[100dvh] items-center justify-center" style={{ perspective: 1200 }}>
      {/* No bg — canvas shows through */}
      <div className="relative w-full max-w-sm px-6 text-center">
        <motion.div initial={{ scale: 0.4, opacity: 0, rotateY: -40 }} animate={{ scale: 1, opacity: 1, rotateY: 0 }}
          transition={{ duration: 0.75, ease }} style={{ width: 72, height: 72, transformStyle: 'preserve-3d' }}
          className="mb-7 mx-auto grid place-items-center rounded-2xl bg-blue-600 shadow-[0_4px_24px_rgba(37,99,235,0.35)]">
          <span className="text-4xl font-black text-white">N</span>
        </motion.div>
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-2 text-[30px] font-bold text-[#111827] tracking-tight">nekit AI</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.28 }}
          className="mb-10 text-[14px] text-[#444]">Войди чтобы начать</motion.p>
        <motion.button
          whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
          transition={{ duration: 0 }}
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.35 } }}
          type="button" onClick={() => login()} disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 px-5 py-4 text-[15px] font-semibold text-white disabled:opacity-50 hover:bg-blue-700"
          >
          {loading
            ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
            : <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>}
          {loading ? 'Входим...' : 'Войти через Google'}
        </motion.button>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-5 text-[12px] text-[#9ca3af]">{TOTAL_CREDITS} бесплатных кредитов после входа</motion.p>
      </div>
    </motion.div>
  );
}

// ── Particle Canvas ────────────────────────────────────────────────────────────

function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    let animId: number;

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    const COUNT = 70;
    const CONNECT_DIST = 110;
    const REPEL_DIST = 50;
    const SPEED = 0.35;

    // Равномерное начальное распределение по всему экрану
    const particles = Array.from({ length: COUNT }, (_, i) => {
      const cols = Math.ceil(Math.sqrt(COUNT * (W / H)));
      const rows = Math.ceil(COUNT / cols);
      const col = i % cols;
      const row = Math.floor(i / cols);
      return {
        x: (col + 0.5 + (Math.random() - 0.5) * 0.8) * (W / cols),
        y: (row + 0.5 + (Math.random() - 0.5) * 0.8) * (H / rows),
        vx: (Math.random() - 0.5) * SPEED * 2,
        vy: (Math.random() - 0.5) * SPEED * 2,
        r: Math.random() * 1.2 + 0.8,
      };
    });

    const draw = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // update + отталкивание от соседей
      for (let i = 0; i < COUNT; i++) {
        const p = particles[i];

        // отталкивание
        for (let j = 0; j < COUNT; j++) {
          if (i === j) continue;
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < REPEL_DIST && dist > 0) {
            const force = (REPEL_DIST - dist) / REPEL_DIST * 0.015;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // ограничение скорости
        const spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > SPEED) { p.vx = (p.vx / spd) * SPEED; p.vy = (p.vy / spd) * SPEED; }

        p.x += p.vx;
        p.y += p.vy;

        // отражение от стен
        if (p.x < 5)  { p.x = 5;  p.vx = Math.abs(p.vx); }
        if (p.x > W - 5) { p.x = W - 5; p.vx = -Math.abs(p.vx); }
        if (p.y < 5)  { p.y = 5;  p.vy = Math.abs(p.vy); }
        if (p.y > H - 5) { p.y = H - 5; p.vy = -Math.abs(p.vy); }
      }

      // линии
      for (let i = 0; i < COUNT; i++) {
        for (let j = i + 1; j < COUNT; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT_DIST) {
            const alpha = (1 - dist / CONNECT_DIST) * 0.3;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(37,99,235,${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.stroke();
          }
        }
      }

      // точки
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(37,99,235,0.7)';
        ctx.fill();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, display: 'block', pointerEvents: 'none' }}
    />
  );
}

function LightOrbs() {
  const orbs = [
    { size: 600, x: '10%',  y: '-5%',  color: 'rgba(199,210,254,0.55)', dur: 8,  delay: 0   },
    { size: 500, x: '80%',  y: '15%',  color: 'rgba(167,243,208,0.45)', dur: 10, delay: 1.5 },
    { size: 450, x: '50%',  y: '75%',  color: 'rgba(251,207,232,0.45)', dur: 7,  delay: 2.5 },
    { size: 350, x: '-5%',  y: '60%',  color: 'rgba(186,230,253,0.5)',  dur: 9,  delay: 0.8 },
    { size: 300, x: '65%',  y: '85%',  color: 'rgba(253,230,138,0.4)',  dur: 11, delay: 3   },
  ];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* subtle grid */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#000 1px,transparent 1px),linear-gradient(90deg,#000 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
      {orbs.map((orb, i) => (
        <motion.div key={i}
          style={{ position: 'absolute', left: orb.x, top: orb.y, width: orb.size, height: orb.size,
            borderRadius: '50%', background: orb.color, filter: 'blur(90px)', translateX: '-50%', translateY: '-50%' }}
          animate={{ scale: [1, 1.3, 0.85, 1.2, 1], opacity: [0.6, 1, 0.5, 0.9, 0.6] }}
          transition={{ duration: orb.dur, delay: orb.delay, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// ── Onboarding ─────────────────────────────────────────────────────────────────

function OnboardingScreen({ user, onSelect }: { user: UserProfile; onSelect: (c: Category) => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  const selectedCat = CATEGORIES.find(c => c.id === selected);

  const cardHover = {
    hover: { y: -5, scale: 1.03, boxShadow: '0 16px 48px rgba(0,0,0,0.1)', transition: { duration: 0.18 } },
    tap:   { scale: 0.97, transition: { duration: 0.1 } },
  };

  return (
    <motion.div key="onboarding" variants={pageV} initial="initial" animate="animate" exit="exit"
      className="relative flex h-[100dvh] flex-col items-center justify-center px-4 py-10 overflow-y-auto"
      style={{ perspective: 1200 }}>

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
        </div>

      <div className="relative w-full max-w-lg z-10">
        {/* Avatar */}
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5, ease }}
          className="mb-5 flex justify-center">
          <div className="relative">
            <img src={user.picture} alt={user.name}
              className="h-14 w-14 rounded-full border-2 border-black/8 shadow-[0_4px_24px_rgba(0,0,0,0.1)]" />
            <motion.div animate={{ scale: [1, 1.35, 1], opacity: [0.3, 0, 0.3] }}
              transition={{ duration: 2.8, repeat: Infinity }}
              className="absolute rounded-full border border-black/10" style={{ inset: -5 }} />
          </div>
        </motion.div>

        <motion.h2 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-1 text-center text-[26px] font-bold text-[#0f0f0f] tracking-tight">
          Привет, {user.name.split(' ')[0]} 👋
        </motion.h2>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="mb-8 text-center text-[14px] text-[#999]">Выбери с чем будем работать</motion.p>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" style={{ perspective: 900 }}>
          {CATEGORIES.map((cat, i) => {
            const isSelected = selected === cat.id;
            return (
              <motion.button key={cat.id}
                custom={i}
                variants={{ ...cardHover,
                  initial: { opacity: 0, y: 20, scale: 0.95 },
                  animate: { opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.06, duration: 0.45, ease } },
                }}
                initial="initial" animate="animate" whileHover="hover" whileTap="tap"
                type="button" onClick={() => setSelected(cat.id)}
                className={`relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-[#111] shadow-[0_4px_16px_rgba(37,99,235,0.15)]'
                    : 'border-[#e5e7eb] bg-white hover:border-blue-300 hover:bg-blue-50'
                }`}
                style={{ transformStyle: 'preserve-3d' }}>

                {/* color accent on selected */}
                {isSelected && (
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient ?? ''} opacity-20`} />
                )}

                <div className="relative z-10">
                  <motion.div
                    animate={isSelected ? { rotate: [0, -6, 6, 0] } : {}}
                    transition={{ duration: 0.5 }}
                    className={`mb-3 grid h-10 w-10 place-items-center rounded-xl transition-colors ${
                      isSelected ? 'bg-white/10' : 'bg-[#f5f5f5]'
                    }`}>
                    {cat.icon}
                  </motion.div>
                  <div className={`text-[13px] font-semibold ${isSelected ? 'text-white' : 'text-[#111]'}`}>{cat.title}</div>
                  <div className={`mt-0.5 text-[11px] leading-4 ${isSelected ? 'text-white/50' : 'text-[#aaa]'}`}>{cat.desc}</div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Continue button */}
        <motion.button
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: selected ? 1 : 0.25, y: 0, transition: { delay: 0.4 } }}
          whileHover={selected ? { scale: 1.02, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' } : undefined}
          whileTap={selected ? { scale: 0.97 } : undefined}
          type="button" disabled={!selected}
          onClick={() => { const c = CATEGORIES.find(x => x.id === selected); if (c) onSelect(c); }}
          className="mt-5 w-full rounded-xl bg-blue-600 py-3.5 text-[14px] font-semibold text-white disabled:cursor-not-allowed transition-all hover:bg-blue-700"
          style={{ transformStyle: 'preserve-3d',
            boxShadow: selectedCat ? `0 4px 24px ${selectedCat.glow ?? 'rgba(0,0,0,0.15)'}` : undefined }}>
          Продолжить →
        </motion.button>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          className="mt-3 text-center text-[11px] text-[#ccc]">
          Режим можно сменить в настройках
        </motion.p>
      </div>
    </motion.div>
  );
}

// ── Payment Modal ──────────────────────────────────────────────────────────────

function PaymentModal({ onClose }: { onClose: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);

  const methods = [
    { id: 'card', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="5" width="20" height="14" rx="2" stroke="url(#pg1)" strokeWidth="1.8"/>
        <path d="M2 10h20" stroke="url(#pg1)" strokeWidth="1.8"/>
        <defs><linearGradient id="pg1" x1="2" y1="5" x2="22" y2="19"><stop stopColor="#818cf8"/><stop offset="1" stopColor="#6366f1"/></linearGradient></defs>
      </svg>
    ), label: 'Банковская карта', sub: 'Visa, Mastercard, Мир' },
    { id: 'crypto', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="url(#pg2)" strokeWidth="1.8"/>
        <path d="M9 8h4.5a2 2 0 0 1 0 4H9m0 0h5a2 2 0 0 1 0 4H9M9 8v8m2-9v10" stroke="url(#pg2)" strokeWidth="1.5" strokeLinecap="round"/>
        <defs><linearGradient id="pg2" x1="3" y1="3" x2="21" y2="21"><stop stopColor="#fbbf24"/><stop offset="1" stopColor="#f59e0b"/></linearGradient></defs>
      </svg>
    ), label: 'Криптовалюта', sub: 'USDT, BTC, ETH' },
    { id: 'paypal', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M7 20h2l1-4h2.5c3 0 5-1.5 5.5-4.5C18.5 8 16.5 6 13 6H8L5 20" stroke="url(#pg3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <defs><linearGradient id="pg3" x1="5" y1="6" x2="18" y2="20"><stop stopColor="#60a5fa"/><stop offset="1" stopColor="#3b82f6"/></linearGradient></defs>
      </svg>
    ), label: 'PayPal', sub: 'Международные платежи' },
    { id: 'sbp', icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path d="M3 11l19-9-9 19-2-8-8-2z" stroke="url(#pg4)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
        <defs><linearGradient id="pg4" x1="3" y1="2" x2="22" y2="20"><stop stopColor="#34d399"/><stop offset="1" stopColor="#10b981"/></linearGradient></defs>
      </svg>
    ), label: 'СБП', sub: 'Система быстрых платежей' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 28 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 16 }}
        transition={{ duration: 0.28, ease }}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-[0_32px_80px_rgba(0,0,0,0.25)]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[#f0f0f0]">
          <div>
            <div className="text-[16px] font-bold text-[#111]">Pro план</div>
            <div className="text-[12px] text-[#999]">Выбери способ оплаты</div>
          </div>
          <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.85 }} transition={{ duration: 0 }}
            type="button" onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full bg-[#f4f4f4] text-[#999] hover:text-[#111]">
            <X size={14} />
          </motion.button>
        </div>

        {/* Price badge */}
        <div className="mx-5 mt-4 mb-4 rounded-2xl p-4 text-center bg-[#f8f8f8] border border-[#ebebeb]">
          <div className="text-[36px] font-black text-[#111]">$5</div>
          <div className="text-[12px] text-[#999]">в месяц · отмена в любой момент</div>
          <div className="mt-2 flex justify-center gap-4 text-[11px] text-[#555]">
            <span>✓ Безлимит</span>
            <span>✓ Приоритет</span>
            <span>✓ Все режимы</span>
          </div>
        </div>

        {/* Payment methods */}
        <div className="px-5 pb-3 space-y-2">
          {methods.map((m) => (
            <motion.button key={m.id}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              transition={{ duration: 0 }}
              type="button" onClick={() => setSelected(m.id)}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left border transition-colors"
              style={{
                background: selected === m.id ? '#eff6ff' : '#fafafa',
                borderColor: selected === m.id ? '#3b82f6' : '#ebebeb',
              }}>
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white border border-[#ebebeb]">
                {m.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[#111]">{m.label}</div>
                <div className="text-[11px] text-[#999]">{m.sub}</div>
              </div>
              {selected === m.id ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15 }}
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-blue-500">
                  <Check size={11} className="text-white" />
                </motion.div>
              ) : (
                <div className="h-5 w-5 shrink-0 rounded-full border-2 border-[#ddd]" />
              )}
            </motion.button>
          ))}
        </div>

        {/* CTA */}
        <div className="px-5 pb-5 pt-2">
          <motion.button
            whileHover={selected ? { scale: 1.02 } : undefined}
            whileTap={selected ? { scale: 0.97 } : undefined}
            transition={{ duration: 0 }}
            type="button" disabled={!selected}
            className="w-full rounded-2xl py-3.5 text-[14px] font-bold text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            style={{ background: selected ? '#111' : '#ccc' }}>
            {selected ? 'Перейти к оплате' : 'Выбери способ оплаты'}
          </motion.button>
          <p className="mt-2 text-center text-[10px] text-[#ccc]">
            Оплата защищена · SSL шифрование
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Settings Modal ─────────────────────────────────────────────────────────────

function SettingsModal({ user, credits, onClose, onLogout, onChangeCategory }:
  { user: UserProfile; credits: number; onClose: () => void; onLogout: () => void; onChangeCategory: () => void }) {
  const pct = Math.round((credits / TOTAL_CREDITS) * 100);
  const barColor = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';
  const [paymentOpen, setPaymentOpen] = useState(false);
  const rows = [
    { icon: <User size={15} />,       label: 'Аккаунт',           sub: user.email,                                  action: null,             badge: null     },
    { icon: <CreditCard size={15} />, label: 'Кредиты',           sub: `${credits} из ${TOTAL_CREDITS} (${pct}%)`,  action: null,             badge: null     },
    { icon: <Sparkles size={15} />,   label: 'Сменить режим',      sub: 'Выбрать другую категорию',                  action: onChangeCategory, badge: null     },
    { icon: <Zap size={15} />,        label: 'Сменить тариф',      sub: 'Pro — $5 / месяц',                          action: () => setPaymentOpen(true), badge: null     },
    { icon: <Shield size={15} />,     label: 'Конфиденциальность', sub: 'Политика и данные',                         action: null,             badge: null     },
  ];

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="settings-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        {/* Modal — glass morphism */}
        <motion.div
          key="settings-modal"
          initial={{ opacity: 0, scale: 0.88, y: 32, rotateX: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.35, ease }}
          className="relative w-full max-w-md overflow-hidden rounded-3xl shadow-[0_40px_100px_rgba(0,0,0,0.5)]"
          style={{
            background: 'rgba(12,12,16,0.75)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            border: '1px solid rgba(255,255,255,0.07)',
            transformStyle: 'preserve-3d',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Inner glow */}
          <div className="pointer-events-none absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 60%)' }} />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[15px] font-semibold text-white">Настройки</span>
            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.85 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              type="button" onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded-full text-[#666] hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.06)' }}>
              <X size={14} />
            </motion.button>
          </div>

          <div className="p-4 space-y-2.5 max-h-[80vh] overflow-y-auto">
            {/* Profile */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="flex items-center gap-3 rounded-2xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="relative shrink-0">
                <img src={user.picture} alt={user.name} className="h-11 w-11 rounded-full" />
                <motion.div animate={{ scale: [1,1.4,1], opacity: [0.4,0,0.4] }} transition={{ duration: 2.5, repeat: Infinity }}
                  className="absolute rounded-full border border-white/20" style={{ inset: -3 }} />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-white truncate">{user.name}</div>
                <div className="text-[12px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{user.email}</div>
              </div>
            </motion.div>

            {/* Credits bar */}
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="rounded-2xl p-3.5"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-medium text-white">Кредиты</span>
                <span className="text-[12px] font-bold" style={{ color: barColor }}>{credits} / {TOTAL_CREDITS}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
                <motion.div className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`, boxShadow: `0 0 8px ${barColor}` }}
                  initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} />
              </div>
              <p className="mt-1.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Кодинг и Автоматизация: -2 · Остальные: -1</p>
            </motion.div>

            {/* Menu rows */}
            <div className="space-y-1.5">
              {rows.map((row, i) => (
                <motion.button key={row.label}
                  initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 + i * 0.05 }}
                  whileHover={row.action ? { scale: 1.02 } : undefined}
                  whileTap={row.action ? { scale: 0.97 } : undefined}
                  type="button" onClick={row.action ?? undefined}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all ${row.action ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <motion.div
                    whileHover={row.action ? { rotate: 15, scale: 1.1 } : undefined}
                    transition={{ duration: 0, ease: 'easeOut' }}
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>
                    {row.icon}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium text-white">{row.label}</div>
                    <div className="text-[11px] truncate" style={{ color: 'rgba(255,255,255,0.25)' }}>{row.sub}</div>
                  </div>
                  {row.badge && (
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium text-amber-400" style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.25)' }}>
                      {row.badge}
                    </span>
                  )}
                  {row.action && !row.badge && (
                    <motion.div whileHover={{ x: 3 }} transition={{ duration: 0.15 }}>
                      <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>

            {/* Logout */}
            <motion.button
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              type="button" onClick={onLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-medium text-red-400"
              style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <motion.div whileHover={{ rotate: -15 }} transition={{ duration: 0.15 }}>
                <LogOut size={14} />
              </motion.div>
              Выйти из аккаунта
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
      {paymentOpen && <PaymentModal onClose={() => setPaymentOpen(false)} />}
    </AnimatePresence>
  );
}

// ── Out of Credits Modal ───────────────────────────────────────────────────────

function OutOfCreditsScreen({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      key="ooc"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)' }}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 10 }}
        transition={{ duration: 0.28, ease }}
        className="w-full max-w-xs overflow-hidden rounded-3xl text-center"
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        }}
      >
        <div className="px-6 pt-6 pb-5">
          <motion.div
            initial={{ scale: 0, rotate: -15 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.4, ease }}
            className="mb-4 mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 border border-blue-100">
            <Lock size={22} className="text-blue-500" />
          </motion.div>

          <h2 className="mb-1 text-[17px] font-bold text-[#111]">Кредиты закончились</h2>
          <p className="mb-5 text-[13px] text-[#999]">Купи план или сбрось демо</p>

          <div className="space-y-2">
            {/* Купить */}
            <motion.a
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              transition={{ duration: 0 }}
              href="https://t.me/itachi_panell"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-blue-600 py-3 text-[14px] font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.68 7.92c-.12.56-.46.7-.92.44l-2.56-1.88-1.24 1.18c-.14.14-.26.26-.52.26l.18-2.62 4.72-4.26c.2-.18-.04-.28-.32-.1L7.44 13.5 4.92 12.74c-.56-.18-.58-.56.12-.82l9.14-3.52c.46-.18.88.1.46 1.4z"/>
              </svg>
              Купить — @itachi_panell
            </motion.a>

            {/* Хорошо */}
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
              transition={{ duration: 0 }}
              type="button" onClick={onClose}
              className="w-full rounded-2xl border border-[#e5e7eb] bg-white py-3 text-[13px] text-[#888] hover:text-[#111] hover:border-[#ccc] transition-colors"
            >
              Хорошо, подожду 2 дня
            </motion.button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Credits Badge ──────────────────────────────────────────────────────────────

function CreditsBadge({ credits, max }: { credits: number; max: number }) {
  const pct = (credits / max) * 100;
  const color = pct > 50 ? '#22c55e' : pct > 20 ? '#f59e0b' : '#ef4444';
  const label = pct > 50 ? 'Хорошо' : pct > 20 ? 'Мало' : 'Заканчиваются';
  return (
    <div className="rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-[#6b7280]">Кредиты</span>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-blue-600">{credits}</span>
          <span className="text-[10px] text-[#9ca3af]">/ {max}</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
        <motion.div className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${color}99, ${color})`, boxShadow: `0 0 6px ${color}66` }}
          animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }} />
      </div>
      <div className="mt-1 text-[10px] text-[#9ca3af]">Обновление через {getTimeUntilReset()}</div>
    </div>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────

function Sidebar({ open, onClose, onNewChat, activeTitle, user, credits, onSettings }:
  { open: boolean; onClose: () => void; onNewChat: () => void; activeTitle: string; user: UserProfile; credits: number; onSettings: () => void }) {
  const { data: activity = [] } = useGetAssistantActivity();
  return (
    <>
      {open && <button aria-label="Закрыть" className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-[260px] flex-col border-r border-[#e5e7eb] bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`} data-testid="sidebar-navigation">
        <div className="flex items-center justify-between px-3 py-3">
          <div className="flex items-center gap-2.5">
            <div className="grid h-7 w-7 place-items-center rounded-lg bg-blue-600 text-[14px] font-black text-white">N</div>
            <span className="text-[15px] font-semibold text-[#111827]">nekit AI</span>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-2 text-[#6b7280] hover:bg-blue-50 hover:text-blue-600 lg:hidden"><X size={17} /></button>
          <button type="button" onClick={onNewChat} className="hidden rounded-md p-2 text-[#6b7280] hover:bg-blue-50 hover:text-blue-600 lg:block" data-testid="button-new-chat"><SquarePen size={17} /></button>
        </div>
        <div className="px-2">
          <button type="button" onClick={onNewChat} className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-[13px] text-[#6b7280] hover:bg-blue-50 hover:text-blue-600" data-testid="button-new-chat-mobile">
            <Plus size={17} /> Новый чат
          </button>
        </div>
        <div className="mt-5 flex-1 overflow-y-auto px-2">
          <div className="px-3 pb-2 text-[11px] text-[#9ca3af]">История</div>
          {activity.map((item) => (
            <button key={item.id} type="button"
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] ${item.title === activeTitle ? 'bg-blue-50 text-blue-600' : 'text-[#6b7280] hover:bg-blue-50 hover:text-blue-600'}`}
              data-testid={`activity-item-${item.id}`}>
              <MessageSquare size={15} className="shrink-0 text-[#9ca3af]" />
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              <MoreHorizontal size={15} className="hidden shrink-0 text-[#9ca3af] group-hover:block" />
            </button>
          ))}
        </div>
        <div className="border-t border-[#e5e7eb] p-3 space-y-2">
          <CreditsBadge credits={credits} max={TOTAL_CREDITS} />
          <motion.button variants={btnV} whileHover="hover" whileTap="tap" type="button" onClick={onSettings}
            className="flex w-full items-center gap-3 rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 hover:border-blue-200 hover:bg-blue-50 transition-colors">
            <img src={user.picture} alt={user.name} className="h-7 w-7 rounded-full shrink-0" />
            <div className="min-w-0 flex-1 text-left">
              <div className="truncate text-[12px] font-medium text-[#111827]">{user.name}</div>
              <div className="truncate text-[10px] text-[#6b7280]">{user.email}</div>
            </div>
            <Settings size={14} className="shrink-0 text-[#9ca3af]" />
          </motion.button>
        </div>
      </aside>
    </>
  );
}

// ── Provider Badge ─────────────────────────────────────────────────────────────

const PC: Record<string, { bg: string; dot: string; text: string }> = {
  ollama:    { bg: 'bg-violet-50 border-violet-200',    dot: 'bg-violet-400',  text: 'text-violet-700'  },
  groq:      { bg: 'bg-yellow-50 border-yellow-200',    dot: 'bg-yellow-400',  text: 'text-yellow-700'  },
  openai:    { bg: 'bg-emerald-50 border-emerald-200',  dot: 'bg-emerald-400', text: 'text-emerald-700' },
  anthropic: { bg: 'bg-orange-50 border-orange-200',    dot: 'bg-orange-400',  text: 'text-orange-700'  },
  gemini:    { bg: 'bg-blue-50 border-blue-200',        dot: 'bg-blue-400',    text: 'text-blue-700'    },
  local:     { bg: 'bg-neutral-100 border-neutral-200', dot: 'bg-neutral-400', text: 'text-neutral-500' },
};

function ProviderBadge() {
  const { data } = useGetAssistantProvider({ query: { refetchInterval: 30_000, staleTime: 15_000 } });
  if (!data) return null;
  const c = PC[data.provider] ?? PC.local;
  return (
    <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${c.bg} ${c.text}`} data-testid="badge-provider">
      {data.isAI ? <Zap size={10} className="shrink-0" /> : <Bot size={10} className="shrink-0" />}
      <span>{data.label}</span>
      <span className={`inline-block h-1.5 w-1.5 rounded-full ${c.dot}`} />
    </div>
  );
}

// ── Code Block ─────────────────────────────────────────────────────────────────

function CodeBlock({ code, lang }: { code: string; lang: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const download = () => {
    const ext: Record<string, string> = {
      javascript: 'js', typescript: 'ts', python: 'py', html: 'html',
      css: 'css', json: 'json', bash: 'sh', shell: 'sh', sql: 'sql',
    };
    const ext2 = ext[lang.toLowerCase()] ?? 'txt';
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `code.${ext2}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-[#e5e7eb] bg-[#f8faff]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#e5e7eb] bg-[#f0f4ff] px-4 py-2">
        <span className="text-[11px] font-medium text-blue-600">{lang || 'code'}</span>
        <div className="flex items-center gap-1.5">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0 }}
            type="button" onClick={copy}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1 text-[11px] font-medium text-[#6b7280] hover:border-blue-300 hover:text-blue-600 transition-colors">
            {copied ? <Check size={11} /> : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
            {copied ? 'Скопировано' : 'Копировать'}
          </motion.button>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} transition={{ duration: 0 }}
            type="button" onClick={download}
            className="flex items-center gap-1.5 rounded-lg border border-[#e5e7eb] bg-white px-2.5 py-1 text-[11px] font-medium text-[#6b7280] hover:border-blue-300 hover:text-blue-600 transition-colors">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Скачать
          </motion.button>
        </div>
      </div>
      {/* Code */}
      <pre className="overflow-x-auto px-4 py-3 text-[13px] leading-6 text-[#111]"
        style={{ fontFamily: "'Fira Code', 'Cascadia Code', monospace" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ── Message Renderer ────────────────────────────────────────────────────────────

function renderMessage(text: string) {
  const parts: React.ReactNode[] = [];
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let match;
  let key = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Текст до блока кода
    if (match.index > last) {
      parts.push(
        <span key={key++} className="whitespace-pre-wrap">{text.slice(last, match.index)}</span>
      );
    }
    // Блок кода
    parts.push(<CodeBlock key={key++} lang={match[1] || 'code'} code={match[2].trim()} />);
    last = match.index + match[0].length;
  }

  // Остаток текста
  if (last < text.length) {
    parts.push(<span key={key++} className="whitespace-pre-wrap">{text.slice(last)}</span>);
  }

  return parts.length > 0 ? parts : <span className="whitespace-pre-wrap">{text}</span>;
}

// ── Assistant Message ──────────────────────────────────────────────────────────

function AssistantMessage({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1400); };
  return (
    <motion.div variants={msgV} initial="initial" animate="animate" className="group flex gap-4 py-5" data-testid="assistant-message">
      <motion.div whileHover={{ scale: 1.12, rotate: 6 }} transition={{ duration: 0.2 }}
        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[#e8e8e8] bg-white text-[#333] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
        <Sparkles size={14} />
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 text-[12px] font-semibold text-[#aaa]">nekit AI</div>
        <div className="text-[14px] leading-[1.75] text-[#111]" data-testid="text-response-body">{renderMessage(text)}</div>
        <button type="button" onClick={copy}
          className="mt-2.5 flex items-center gap-1.5 text-[11px] text-[#ccc] opacity-0 transition-all group-hover:opacity-100 hover:text-[#666]"
          data-testid="button-copy-response">
          {copied ? <Check size={12} /> : null}{copied ? 'Скопировано' : 'Копировать'}
        </button>
      </div>
    </motion.div>
  );
}

// ── Error Toast ────────────────────────────────────────────────────────────────

function ErrorToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.3, ease }}
      className="mx-auto mb-3 flex max-w-md items-center gap-3 rounded-2xl border border-red-100 bg-white px-4 py-3 shadow-[0_4px_32px_rgba(239,68,68,0.12)]"
      role="status" data-testid="status-notice">
      <motion.div animate={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.4, delay: 0.1 }}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-red-50">
        <AlertCircle size={16} className="text-red-500" />
      </motion.div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-red-700">Ошибка подключения</p>
        <p className="text-[12px] text-red-400 truncate">{message}</p>
      </div>
      <button type="button" onClick={onDismiss} className="rounded-lg p-1 text-red-300 hover:text-red-600 transition-colors">
        <X size={14} />
      </button>
    </motion.div>
  );
}

// ── Image Generation Modal ─────────────────────────────────────────────────────

function ImageGenModal({ onClose, isPro }: { onClose: () => void; isPro: boolean }) {
  const [imgPrompt, setImgPrompt] = useState('');
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 24, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.9, y: 16, opacity: 0 }} transition={{ duration: 0.25, ease }}
        className="w-full max-w-md rounded-3xl bg-white shadow-[0_32px_80px_rgba(0,0,0,0.2)] overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
          <div>
            <div className="text-[15px] font-bold text-[#111]">Генерация изображения</div>
            <div className="text-[12px] text-[#9ca3af]">Только для Pro пользователей</div>
          </div>
          <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.85 }} transition={{ duration: 0 }}
            type="button" onClick={onClose}
            className="grid h-7 w-7 place-items-center rounded-full bg-[#f4f4f4] text-[#999]">
            <X size={14} />
          </motion.button>
        </div>
        {!isPro ? (
          <div className="p-6 text-center">
            <div className="mb-3 text-4xl">🔒</div>
            <div className="mb-2 text-[15px] font-semibold text-[#111]">Только для Pro</div>
            <div className="mb-4 text-[13px] text-[#6b7280]">Генерация изображений доступна в Pro плане за $5/месяц</div>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0 }}
              type="button" onClick={onClose}
              className="w-full rounded-xl bg-blue-600 py-3 text-[14px] font-semibold text-white hover:bg-blue-700">
              Перейти к оплате
            </motion.button>
          </div>
        ) : (
          <div className="p-5">
            <textarea value={imgPrompt} onChange={e => setImgPrompt(e.target.value)}
              placeholder="Опиши изображение которое хочешь создать..."
              rows={3} className="w-full resize-none rounded-xl border border-[#e5e7eb] bg-[#f8faff] px-4 py-3 text-[14px] text-[#111] outline-none focus:border-blue-400 placeholder:text-[#c0c0c0]" />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0 }}
              type="button" disabled={!imgPrompt.trim()}
              className="mt-3 w-full rounded-xl bg-blue-600 py-3 text-[14px] font-semibold text-white hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed">
              Создать изображение
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Composer ───────────────────────────────────────────────────────────────────

function Composer({ prompt, setPrompt, isPending, onSubmit, placeholder, credits, creditCost, isPro, onFileAttach, attachments, onRemoveAttachment }:
  { prompt: string; setPrompt: (v: string) => void; isPending: boolean; onSubmit: () => void; placeholder: string; credits: number; creditCost: number; isPro: boolean; onFileAttach: (files: FileList) => void; attachments: { name: string; type: string; url: string }[]; onRemoveAttachment: (i: number) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showImgGen, setShowImgGen] = useState(false);

  return (
    <div className="px-3 pb-4 pt-2 sm:px-6 sm:pb-5">
      <AnimatePresence>
        {showImgGen && <ImageGenModal onClose={() => setShowImgGen(false)} isPro={isPro} />}
      </AnimatePresence>

      <div className="mx-auto max-w-3xl rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)]">

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-4 pt-3">
            {attachments.map((a, i) => (
              <motion.div key={i} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                className="relative group flex items-center gap-2 rounded-xl border border-[#e5e7eb] bg-[#f8faff] px-3 py-1.5">
                {a.type.startsWith('image/') ? (
                  <img src={a.url} alt={a.name} className="h-8 w-8 rounded-lg object-cover" />
                ) : (
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-100 text-blue-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                )}
                <span className="max-w-[100px] truncate text-[11px] text-[#6b7280]">{a.name}</span>
                <button type="button" onClick={() => onRemoveAttachment(i)}
                  className="ml-1 text-[#9ca3af] hover:text-red-400 transition-colors">
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        <textarea id="chat-input" value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); } }}
          placeholder={placeholder} rows={1}
          className="max-h-44 min-h-[56px] w-full resize-none bg-transparent px-5 py-4 text-[14px] leading-6 text-[#111] outline-none placeholder:text-[#c0c0c0]"
          data-testid="input-prompt" />

        <div className="flex items-center justify-between px-3 pb-3">
          {/* Left — attach buttons */}
          <div className="flex items-center gap-1">
            {/* File attach */}
            <input ref={fileRef} type="file" multiple accept="*/*" className="hidden"
              onChange={e => { if (e.target.files) onFileAttach(e.target.files); }} />
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0 }}
              type="button" onClick={() => { if (fileRef.current) { fileRef.current.accept = '*/*'; fileRef.current.click(); } }}
              className="grid h-8 w-8 place-items-center rounded-xl text-[#9ca3af] hover:bg-blue-50 hover:text-blue-500 transition-colors"
              title="Прикрепить файл">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
              </svg>
            </motion.button>

            {/* Photo attach */}
            <input type="file" accept="image/*" className="hidden" id="photo-input"
              onChange={e => { if (e.target.files) onFileAttach(e.target.files); }} />
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0 }}
              type="button" onClick={() => document.getElementById('photo-input')?.click()}
              className="grid h-8 w-8 place-items-center rounded-xl text-[#9ca3af] hover:bg-blue-50 hover:text-blue-500 transition-colors"
              title="Прикрепить фото">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
              </svg>
            </motion.button>

            {/* Image generation — Pro */}
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} transition={{ duration: 0 }}
              type="button" onClick={() => setShowImgGen(true)}
              className="flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-[#9ca3af] hover:bg-blue-50 hover:text-blue-500 transition-colors"
              title="Генерация изображения (Pro)">
              <Sparkles size={14} />
              <span className="text-[11px] font-medium">Создать фото</span>
              {!isPro && <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-bold text-blue-600">PRO</span>}
            </motion.button>
          </div>

          {/* Right — send */}
          <motion.button
            whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88, rotate: -10 }}
            transition={{ duration: 0 }}
            type="button" onClick={onSubmit}
            disabled={(!prompt.trim() && attachments.length === 0) || isPending || credits <= 0}
            className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-[#e5e7eb] disabled:text-[#9ca3af]"
            aria-label="Отправить" data-testid="button-submit-request">
            {isPending ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Send size={15} />}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

// ── Chat Workspace ─────────────────────────────────────────────────────────────

function ChatWorkspace({ category, user, credits, setCredits, onOutOfCredits, onSettings }:
  { category: Category; user: UserProfile; credits: number; setCredits: (n: number) => void; onOutOfCredits: () => void; onSettings: () => void }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState('');
  const [attachments, setAttachments] = useState<{ name: string; type: string; url: string }[]>([]);
  const isPro = false; // TODO: подключить к реальному статусу подписки
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const respond = useRespondToAssistant();
  const activeTitle = messages.findLast(m => m.role === 'user')?.text ?? '';

  const newChat = () => { setMessages([]); setPrompt(''); setError(''); setAttachments([]); setSidebarOpen(false); };

  const handleFileAttach = (files: FileList) => {
    const newFiles = Array.from(files).map(f => ({
      name: f.name,
      type: f.type,
      url: URL.createObjectURL(f),
    }));
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const handleRemoveAttachment = (i: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== i));
  };

  const submit = () => {
    const text = prompt.trim();
    if ((!text && attachments.length === 0) || respond.isPending) return;
    if (credits < category.creditCost) { onOutOfCredits(); return; }

    const msgText = text || (attachments.length > 0 ? 'Посмотри на прикреплённый файл' : '');
    setMessages(items => [...items, { id: `u-${Date.now()}`, role: 'user', text: msgText }]);
    setPrompt('');
    setAttachments([]);
    setError('');

    respond.mutate(
      { data: { prompt: msgText || text || 'Помоги с этим', mode: 'build', context: 'Отвечай коротко и по делу, максимум 2-3 предложения если не нужен длинный ответ.' } },
      {
        onSuccess: d => {
          // Кредиты списываются только при успешном ответе
          const nc = Math.max(0, credits - category.creditCost);
          setCredits(nc);
          saveCredits(nc);
          setMessages(items => [...items, { id: d.id, role: 'assistant', text: d.response }]);
          void queryClient.invalidateQueries({ queryKey: getGetAssistantActivityQueryKey() });
          setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
          if (nc <= 0) setTimeout(() => onOutOfCredits(), 1200);
        },
        onError: () => {
          // При ошибке кредиты НЕ списываются
          setError('Не удалось получить ответ. Кредиты не списаны — попробуй ещё раз.');
        },
      },
    );
  };

  const SUGGESTIONS = ['Напиши код', 'Объясни концепцию', 'Помоги с ошибкой', 'Сгенерируй идею'];

  return (
    <div className="flex h-[100dvh] min-h-[520px] bg-[#f8f8f8]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} onNewChat={newChat}
        activeTitle={activeTitle} user={user} credits={credits} onSettings={onSettings} />

      <main className="flex min-w-0 flex-1 flex-col" data-testid="main-workspace">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#e5e7eb] bg-white px-3 sm:px-5">
          <div className="flex items-center gap-3">
            <motion.button variants={btnV} whileHover="hover" whileTap="tap"
              type="button" onClick={() => setSidebarOpen(true)}
              className="rounded-xl p-2 text-[#999] hover:bg-[#f4f4f4] hover:text-[#111] lg:hidden" data-testid="button-open-sidebar">
              <Menu size={19} />
            </motion.button>
            <span className="text-[14px] font-semibold text-[#111]">nekit AI</span>
            <motion.span initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="hidden rounded-full bg-[#f0f0f0] px-2.5 py-1 text-[11px] text-[#888] sm:block">
              {category.title}
            </motion.span>
          </div>
          <div className="flex items-center gap-2">
            <motion.button variants={btnV} whileHover="hover" whileTap="tap"
              type="button" onClick={onSettings}
              className="rounded-xl p-2 text-[#999] hover:bg-[#f4f4f4] hover:text-[#111]" data-testid="button-more">
              <Settings size={17} />
            </motion.button>
          </div>
        </header>

        <div className="relative min-h-0 flex-1 overflow-y-auto">
          {messages.length > 0 && (
            <div className="pointer-events-none fixed inset-0 flex items-center justify-center select-none" style={{ zIndex: 0 }} aria-hidden="true">
              <span className="text-[clamp(60px,13vw,150px)] font-black leading-none tracking-[-0.04em] text-black/[0.025]">nekit AI</span>
            </div>
          )}

          {messages.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              className="mx-auto flex min-h-[calc(100vh-220px)] max-w-3xl flex-col justify-center px-4 pb-12 pt-16 sm:px-8"
              data-testid="response-empty">
              <motion.div whileHover={{ scale: 1.08, rotate: 8 }} transition={{ duration: 0.15, ease: 'easeOut' }}
                className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.3)] cursor-default">
                <Sparkles size={20} />
              </motion.div>
              <h1 className="text-[30px] font-bold tracking-[-0.03em] text-[#111827] sm:text-[36px]">Чем могу помочь?</h1>
              <p className="mt-1.5 text-[15px] text-[#bbb]">{category.title}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button key={s}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}
                    type="button" onClick={() => setPrompt(s)}
                    className="rounded-full border border-[#e5e5e5] bg-white px-4 py-2 text-[13px] text-[#555] shadow-[0_1px_4px_rgba(0,0,0,0.04)] hover:border-[#ccc] hover:text-[#111] transition-colors">
                    {s}
                  </motion.button>
                ))}
              </div>
              <div className="pointer-events-none mt-10 select-none" aria-hidden="true">
                <span className="text-[clamp(44px,9vw,110px)] font-black leading-none tracking-[-0.04em] text-black/[0.05]">nekit AI</span>
              </div>
            </motion.div>
          ) : (
            <div className="mx-auto max-w-3xl px-4 pb-8 sm:px-8" style={{ position: 'relative', zIndex: 1 }}>
              <AnimatePresence>
                {messages.map(msg => msg.role === 'user' ? (
                  <motion.div key={msg.id} variants={msgV} initial="initial" animate="animate"
                    className="flex justify-end py-4" data-testid="user-message">
                    <motion.div whileHover={{ scale: 1.01 }}
                      className="max-w-[78%] rounded-2xl rounded-br-md bg-blue-600 px-4 py-3 text-[14px] leading-6 text-white shadow-[0_2px_12px_rgba(37,99,235,0.25)]">
                      {msg.text}
                    </motion.div>
                  </motion.div>
                ) : <AssistantMessage key={msg.id} text={msg.text} />)}
              </AnimatePresence>
              {respond.isPending && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex gap-4 py-5" data-testid="response-loading">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[#e8e8e8] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <Sparkles size={14} className="text-[#aaa]" />
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    {[0, 130, 260].map(d => (
                      <span key={d} className="h-2 w-2 animate-bounce rounded-full bg-[#ccc]" style={{ animationDelay: `${d}ms` }} />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        <AnimatePresence>
          {error && <ErrorToast message={error} onDismiss={() => setError('')} />}
        </AnimatePresence>

        <Composer prompt={prompt} setPrompt={setPrompt} isPending={respond.isPending} onSubmit={submit}
          placeholder={category.placeholder} credits={credits} creditCost={category.creditCost}
          isPro={isPro} onFileAttach={handleFileAttach} attachments={attachments} onRemoveAttachment={handleRemoveAttachment} />
      </main>
    </div>
  );
}

// ── App Shell ──────────────────────────────────────────────────────────────────

function AppShell() {
  const savedUser: UserProfile | null = (() => {
    try { const r = localStorage.getItem(S_USER); return r ? JSON.parse(r) as UserProfile : null; } catch { return null; }
  })();
  const savedCat = CATEGORIES.find(c => c.id === (localStorage.getItem(S_CATEGORY) ?? '')) ?? null;
  const initCredits = getCredits();

  const [screen, setScreen] = useState<Screen>(
    !savedUser ? 'login' : !savedCat ? 'onboarding' : initCredits <= 0 ? 'out-of-credits' : 'chat',
  );
  const [user, setUser] = useState<UserProfile | null>(savedUser);
  const [category, setCategory] = useState<Category>(savedCat ?? CATEGORIES[0]);
  const [credits, setCredits] = useState(initCredits);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const go = (s: Screen) => setScreen(s);

  const handleLogin = (u: UserProfile) => { localStorage.setItem(S_USER, JSON.stringify(u)); setUser(u); go('onboarding'); };
  const handleCategory = (c: Category) => { localStorage.setItem(S_CATEGORY, c.id); setCategory(c); go('chat'); };
  const handleLogout = () => {
    [S_USER, S_CATEGORY, S_CREDITS].forEach(k => localStorage.removeItem(k));
    setUser(null); setCredits(TOTAL_CREDITS); setSettingsOpen(false); go('login');
  };
  const handleCloseOoc = () => { go('chat'); };

  return (
    <>
      <AnimatePresence mode="wait">
        {screen === 'login' && <LoginScreen key="login" onLogin={handleLogin} />}
        {screen === 'onboarding' && user && <OnboardingScreen key="onboarding" user={user} onSelect={handleCategory} />}
        {screen === 'chat' && user && (
          <motion.div key="chat" variants={pageV} initial="initial" animate="animate" exit="exit" style={{ height: '100dvh' }}>
            <ChatWorkspace category={category} user={user} credits={credits} setCredits={setCredits}
              onOutOfCredits={() => go('out-of-credits')} onSettings={() => setSettingsOpen(true)} />
          </motion.div>
        )}
        {screen === 'out-of-credits' && user && (
          <motion.div key="ooc-bg" variants={pageV} initial="initial" animate="animate" exit="exit" style={{ height: '100dvh', position: 'relative' }}>
            <ChatWorkspace category={category} user={user} credits={0} setCredits={setCredits}
              onOutOfCredits={() => {}} onSettings={() => setSettingsOpen(true)} />
            <OutOfCreditsScreen onClose={handleCloseOoc} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal — поверх всего */}
      {settingsOpen && user && (
        <SettingsModal
          user={user} credits={credits}
          onClose={() => setSettingsOpen(false)}
          onLogout={handleLogout}
          onChangeCategory={() => { setSettingsOpen(false); go('onboarding'); }}
        />
      )}
    </>
  );
}

// ── Router ─────────────────────────────────────────────────────────────────────

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={AppShell} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {/* Canvas живёт постоянно — не пересоздаётся при смене экранов */}
          <ParticleCanvas />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
