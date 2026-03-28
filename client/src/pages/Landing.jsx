import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, TrendingUp, Apple, CheckSquare,
  Trophy, Dumbbell, Calendar, ArrowRight,
  Play, Star, Users, Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from '../components/ui/Logo';

// ── Data ──────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: Dumbbell,
    title: 'Smart Workouts',
    desc: 'PPL, Upper/Lower, Full Body — import templates or build from scratch with our full exercise library.',
    color: 'from-brand-500 to-brand-600',
    light: 'bg-brand-50 dark:bg-brand-900/20',
    text: 'text-brand-500',
  },
  {
    icon: Apple,
    title: 'Nutrition Tracking',
    desc: 'Search 70+ foods, log macros, and hit your daily calorie goals with smart meal plan generation.',
    color: 'from-green-500 to-emerald-600',
    light: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-500',
  },
  {
    icon: CheckSquare,
    title: 'Habit Builder',
    desc: 'Build daily habits with streak tracking, 7-day completion grids, and milestone notifications.',
    color: 'from-purple-500 to-violet-600',
    light: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-500',
  },
  {
    icon: TrendingUp,
    title: 'Progress Analytics',
    desc: 'Body metrics, strength PRs, estimated 1RM with Epley formula, and volume charts over time.',
    color: 'from-orange-500 to-amber-600',
    light: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-500',
  },
  {
    icon: Calendar,
    title: 'Weekly Schedule',
    desc: 'Plan your entire training week on a 7-day grid with calendar sync and rest day scheduling.',
    color: 'from-cyan-500 to-blue-600',
    light: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-500',
  },
  {
    icon: Trophy,
    title: 'Achievements & XP',
    desc: 'Earn badges, level up, and unlock 15+ achievements as you hit personal milestones.',
    color: 'from-amber-500 to-yellow-600',
    light: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-500',
  },
];

const STATS = [
  { value: '80+', label: 'Exercises', icon: Dumbbell },
  { value: '70+', label: 'Foods tracked', icon: Apple },
  { value: '15+', label: 'Achievements', icon: Trophy },
  { value: '100%', label: 'Free forever', icon: Star },
];

// ── Scroll reveal hook ────────────────────────────────────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

// ── Animated counter ──────────────────────────────────────────
function Counter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal(0.5);
  const started = useRef(false);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const num = parseInt(target);
    const duration = 1200;
    const steps = 40;
    const inc = num / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += inc;
      if (current >= num) { setCount(num); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
  }, [visible, target]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

// ── Infinite carousel ─────────────────────────────────────────
function FeatureCarousel() {
  const trackRef = useRef(null);
  const rafRef = useRef(null);
  const pausedRef = useRef(false);
  const offsetRef = useRef(0);
  const SPEED = 0.6;

  const items = [...FEATURES, ...FEATURES, ...FEATURES];

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const singleSetWidth = track.scrollWidth / 3;

    const animate = () => {
      if (!pausedRef.current) {
        offsetRef.current += SPEED;
        if (offsetRef.current >= singleSetWidth)
          offsetRef.current = 0;
        track.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <div
      className="relative overflow-hidden cursor-default"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; }}
    >
      {/* Edge fades */}
      <div className="absolute left-0 top-0 bottom-0 w-32 z-10
                      bg-gradient-to-r from-white dark:from-[#0c0c0f]
                      to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-32 z-10
                      bg-gradient-to-l from-white dark:from-[#0c0c0f]
                      to-transparent pointer-events-none" />

      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-5 will-change-transform py-6 px-4"
        style={{ width: 'max-content' }}
      >
        {items.map(({ icon: Icon, title, desc,
          color, light, text }, i) => (
          <div key={i}
            className="w-72 flex-shrink-0 group relative
                       rounded-2xl border border-zinc-100
                       dark:border-zinc-800/80
                       bg-white dark:bg-[#141418]
                       p-6 overflow-hidden
                       hover:border-zinc-200 dark:hover:border-zinc-700
                       hover:shadow-card-md
                       transition-all duration-300
                       hover:-translate-y-1">
            {/* Gradient blob on hover */}
            <div className={`absolute -top-10 -right-10 w-32 h-32
                             rounded-full bg-gradient-to-br ${color}
                             opacity-0 group-hover:opacity-10
                             transition-opacity duration-500
                             blur-2xl pointer-events-none`} />

            <div className={`w-11 h-11 rounded-2xl ${light}
                             flex items-center justify-center mb-4
                             group-hover:scale-110
                             transition-transform duration-300`}>
              <Icon size={20} className={text} />
            </div>
            <h3 className="font-semibold text-zinc-900
                           dark:text-zinc-100 mb-2 text-sm">
              {title}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400
                           leading-relaxed">
              {desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Testimonial card ──────────────────────────────────────────
function TestimonialCard({ name, role, text, rating, delay }) {
  const [ref, visible] = useReveal(0.2);
  return (
    <div
      ref={ref}
      className={`card p-6 flex flex-col gap-4 transition-all duration-700
        ${visible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-8'
        }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Stars */}
      <div className="flex gap-0.5">
        {Array.from({ length: rating }).map((_, i) => (
          <Star key={i} size={13}
            className="text-amber-400 fill-amber-400" />
        ))}
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400
                    leading-relaxed flex-1">
        "{text}"
      </p>
      <div className="flex items-center gap-3 pt-2 border-t
                      border-zinc-50 dark:border-zinc-800">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br
                        from-brand-400 to-brand-600
                        flex items-center justify-center
                        flex-shrink-0">
          <span className="text-xs font-bold text-white">
            {name[0]}
          </span>
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-900
                         dark:text-zinc-100">
            {name}
          </p>
          <p className="text-xs text-zinc-400">{role}</p>
        </div>
      </div>
    </div>
  );
}

// ── Main Landing page ─────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    fetch('/api/reviews')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setReviews(data);
        } else {
          setReviews([]);
        }
      })
      .catch(() => setReviews([]));
  }, []);

  const handleLogo = () => navigate(user ? '/dashboard' : '/');

  // Navbar shadow on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const [heroRef, heroVisible] = useReveal(0.1);
  const [statsRef, statsVisible] = useReveal(0.2);
  const [featureRef, featureVisible] = useReveal(0.1);
  const [testimonialRef, testimonialVisible] = useReveal(0.1);
  const [ctaRef, ctaVisible] = useReveal(0.2);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0c0c0f]
                    overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className={`sticky top-0 z-50
                       bg-white/80 dark:bg-[#0c0c0f]/80
                       backdrop-blur-md
                       border-b border-zinc-100 dark:border-zinc-800/60
                       transition-shadow duration-300
                       ${scrolled ? 'shadow-sm' : ''}`}>
        <div className="max-w-6xl mx-auto px-6
                        flex items-center justify-between h-16">
          <button onClick={handleLogo}
            className="flex items-center gap-3
                       hover:opacity-80 transition-opacity">
            <Logo className="w-11 h-11" />
            <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100
                             tracking-tight">
              FitNexus
            </span>
          </button>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/login')}
              className="btn-ghost text-sm">
              Log in
            </button>
            <button onClick={() => navigate('/signup')}
              className="btn-primary text-sm">
              Get started
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[90vh]
                          flex items-center">
        {/* Layered background */}
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2
                        w-[800px] h-[500px]
                        bg-gradient-to-b from-brand-500/10
                        dark:from-brand-500/6 to-transparent
                        blur-3xl pointer-events-none" />
        {/* Floating orbs */}
        <div className="absolute top-32 left-[10%] w-64 h-64
                        rounded-full bg-brand-400/8 blur-3xl
                        animate-pulse-soft pointer-events-none" />
        <div className="absolute bottom-20 right-[8%] w-48 h-48
                        rounded-full bg-purple-400/8 blur-3xl
                        animate-pulse-soft pointer-events-none"
          style={{ animationDelay: '1s' }} />

        <div
          ref={heroRef}
          className={`relative max-w-5xl mx-auto px-6 py-24
                      text-center w-full transition-all duration-1000
            ${heroVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-10'
            }`}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5
                          rounded-full border border-brand-200
                          dark:border-brand-800/60
                          bg-brand-50 dark:bg-brand-900/20
                          text-brand-600 dark:text-brand-400
                          text-xs font-semibold mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500
                             animate-pulse" />
            Your complete fitness ecosystem
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold
                         text-zinc-900 dark:text-zinc-50
                         tracking-tight leading-[1.05] mb-6">
            Train smarter.
            <br />
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text
                               bg-gradient-to-r from-brand-500
                               via-brand-400 to-purple-500">
                Live better.
              </span>
              {/* Underline accent */}
              <span className="absolute -bottom-2 left-0 right-0
                               h-1 bg-gradient-to-r from-brand-500
                               to-purple-500 rounded-full
                               opacity-30" />
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-zinc-500
                        dark:text-zinc-400 max-w-2xl mx-auto
                        leading-relaxed mb-10">
            FitNexus brings workouts, nutrition, habits, and progress
            into one beautiful platform.
            <span className="text-zinc-900 dark:text-zinc-200
                             font-medium">
              {' '}Completely free, forever.
            </span>
          </p>

          {/* CTA buttons */}
          <div className="flex items-center justify-center
                          gap-3 flex-wrap mb-14">
            <button
              onClick={() => navigate('/signup')}
              className="group relative px-8 py-3.5 text-base
                         font-semibold rounded-xl text-white
                         bg-brand-500 hover:bg-brand-600
                         transition-all duration-200
                         shadow-[0_4px_14px_0_rgb(99_102_241_/_0.4)]
                         hover:shadow-[0_6px_20px_0_rgb(99_102_241_/_0.5)]
                         hover:-translate-y-0.5
                         flex items-center gap-2"
            >
              Start for free
              <ArrowRight size={16}
                className="group-hover:translate-x-1
                           transition-transform duration-200" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 text-base font-semibold
                         rounded-xl border border-zinc-200
                         dark:border-zinc-700
                         text-zinc-700 dark:text-zinc-300
                         hover:bg-zinc-50 dark:hover:bg-zinc-800/60
                         hover:-translate-y-0.5
                         transition-all duration-200"
            >
              Log in
            </button>
          </div>

          {/* Social proof strip */}
          <div className="flex items-center justify-center gap-6
                          text-xs text-zinc-400 flex-wrap">
            {[
              { icon: Clock, text: 'Setup in under 2 minutes' },
              { icon: Star, text: 'No ads, no paywalls' },
            ].map(({ icon: Icon, text }) => (
              <div key={text}
                className="flex items-center gap-1.5">
                <Icon size={13} className="text-brand-400" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section
        ref={statsRef}
        className={`border-y border-zinc-100 dark:border-zinc-800/60
                    bg-zinc-50/80 dark:bg-[#111115]
                    transition-all duration-700
          ${statsVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
          }`}
      >
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ value, label, icon: Icon }) => {
              const num = parseInt(value);
              const suffix = value.replace(String(num), '');
              return (
                <div key={label}
                  className="text-center group">
                  <div className="w-10 h-10 bg-brand-50
                                  dark:bg-brand-900/20 rounded-xl
                                  flex items-center justify-center
                                  mx-auto mb-3
                                  group-hover:scale-110
                                  transition-transform duration-200">
                    <Icon size={18} className="text-brand-500" />
                  </div>
                  <p className="text-3xl font-bold text-zinc-900
                                 dark:text-zinc-100 tabular-nums">
                    <Counter target={num} suffix={suffix} />
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400
                                 mt-1 font-medium">
                    {label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features carousel ── */}
      <section className="py-24">
        <div
          ref={featureRef}
          className={`text-center mb-12 px-6
                      transition-all duration-700
            ${featureVisible
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-6'
            }`}
        >
          <p className="text-xs font-semibold text-brand-500
                         uppercase tracking-widest mb-3">
            Everything included
          </p>
          <h2 className="text-3xl md:text-4xl font-bold
                         text-zinc-900 dark:text-zinc-100
                         tracking-tight mb-3">
            Built for serious training
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400
                         max-w-xl mx-auto">
            Every tool you need from first rep to final meal.
            No subscriptions, no limits.
          </p>
        </div>
        <FeatureCarousel />
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 bg-zinc-50/60 dark:bg-[#111115]/60">
        <div className="max-w-6xl mx-auto px-6">
          <div
            ref={testimonialRef}
            className={`text-center mb-12 transition-all duration-700
              ${testimonialVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-6'
              }`}
          >
            <p className="text-xs font-semibold text-brand-500
                           uppercase tracking-widest mb-3">
              From our users
            </p>
            <h2 className="text-3xl font-bold text-zinc-900
                           dark:text-zinc-100 tracking-tight">
              Real results, real people
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reviews.length > 0 ? (
              [...reviews]
                .sort((a, b) => {
                  if (b.rating === a.rating) {
                    return new Date(b.created_at) - new Date(a.created_at);
                  }
                  return b.rating - a.rating;
                })
                .slice(0, 3)
                .map((review) => (
                  <TestimonialCard key={review.id} {...review} />
                ))
            ) : (
              <div className="col-span-full flex justify-center relative animate-slide-up mt-6" style={{ animationDelay: '200ms' }}>
                {/* Subtle Divider Glow */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-full max-w-2xl h-px bg-gradient-to-r from-transparent via-brand-500/40 to-transparent" />
                
                {/* Background Blobs */}
                <div className="absolute top-0 -left-10 w-72 h-72 bg-brand-500/20 blur-[80px] rounded-full pointer-events-none animate-float" />
                <div className="absolute bottom-0 -right-10 w-72 h-72 bg-purple-500/20 blur-[80px] rounded-full pointer-events-none animate-float" style={{ animationDelay: '2s' }} />

                <div className="relative p-10 text-center max-w-lg w-full
                                bg-white/60 dark:bg-white/5 backdrop-blur-xl
                                border border-zinc-200/50 dark:border-white/10
                                rounded-[2rem] z-10
                                shadow-[0_8px_32px_rgba(0,0,0,0.04)]
                                dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_20px_60px_-20px_rgba(99,102,241,0.35)]">
                  <p className="text-xl md:text-2xl font-semibold mb-3 tracking-tight
                                text-zinc-900 dark:text-transparent dark:bg-clip-text
                                dark:bg-gradient-to-r dark:from-white dark:to-zinc-400">
                    Be among the first to transform with FitNexus
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed mx-auto max-w-sm">
                    Start your journey and share your experience. Join the community and inspire others to reach their peak.
                  </p>
                  <button
                    onClick={() => {
                      if (user) {
                        navigate('/reviews');
                      } else {
                        navigate('/login', { state: { from: '/reviews' } });
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-white font-medium
                               bg-gradient-to-r from-brand-500 to-purple-500
                               shadow-[0_8px_30px_rgba(99,102,241,0.5)]
                               hover:shadow-[0_8px_40px_rgba(99,102,241,0.7)] hover:scale-105 hover:-translate-y-0.5
                               transition-all duration-300 ease-out group"
                  >
                    <Star size={18} className="text-amber-300 fill-amber-300 group-hover:scale-110 transition-transform duration-300" />
                    Write a Review
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6">
        <div
          ref={ctaRef}
          className={`max-w-4xl mx-auto transition-all duration-700
            ${ctaVisible
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95'
            }`}
        >
          <div className="relative overflow-hidden rounded-3xl p-12
                          text-center
                          bg-gradient-to-br from-brand-500
                          via-brand-600 to-purple-600">
            {/* Grid overlay */}
            <div className="absolute inset-0 bg-grid opacity-15" />
            {/* Glow blobs */}
            <div className="absolute -top-10 -left-10 w-48 h-48
                            rounded-full bg-white/10 blur-3xl
                            pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-64 h-64
                            rounded-full bg-purple-400/20 blur-3xl
                            pointer-events-none" />

            <div className="relative">
              <div className="inline-flex items-center gap-2 px-4 py-1.5
                              rounded-full bg-white/20 text-white/90
                              text-xs font-semibold mb-6">
                <Zap size={11} />
                Get started in seconds
              </div>
              <h2 className="text-3xl md:text-4xl font-bold
                             text-white mb-3 tracking-tight">
                Ready to start your journey?
              </h2>
              <p className="text-brand-100/80 mb-8 max-w-md mx-auto">
                Free forever. No credit card.
                No ads. No paywalls.
              </p>
              <button
                onClick={() => navigate('/signup')}
                className="group inline-flex items-center gap-2
                           px-8 py-3.5 bg-white text-brand-600
                           font-semibold rounded-xl
                           hover:bg-zinc-50 transition-all duration-200
                           shadow-[0_4px_20px_0_rgb(0_0_0_/_0.2)]
                           hover:shadow-[0_8px_30px_0_rgb(0_0_0_/_0.25)]
                           hover:-translate-y-0.5 text-sm"
              >
                Create your free account
                <ArrowRight size={15}
                  className="group-hover:translate-x-1
                             transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-100 dark:border-zinc-800/60
                         py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row
                        items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <Logo className="w-9 h-9" />
            <span className="text-base font-bold text-zinc-900
                             dark:text-zinc-100">
              FitNexus
            </span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6">
            {['Dashboard', 'Workouts', 'Nutrition', 'Progress'].map(link => (
              <button
                key={link}
                onClick={() => navigate(
                  user ? `/${link.toLowerCase()}` : '/signup'
                )}
                className="text-xs text-zinc-400 hover:text-zinc-600
                           dark:hover:text-zinc-300 transition-colors"
              >
                {link}
              </button>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-xs text-zinc-400">
            &copy; {new Date().getFullYear()} FitNexus —
            Built with La Passion mi Amor
          </p>
        </div>
      </footer>
    </div>
  );
}