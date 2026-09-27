'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ArrowRight, Activity, MapPin, Zap, Layers, Sparkles } from 'lucide-react';

export default function IntroPage() {
  const router = useRouter();
  const [phase, setPhase] = useState<number>(1); // Phase 1 (0-1s), Phase 2 (1-2s), Phase 3 (2-3s)
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    // 3-second progress timer
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2.5; // reaches 100% in ~3000ms
      });
    }, 75);

    const timer1 = setTimeout(() => setPhase(2), 1000);
    const timer2 = setTimeout(() => setPhase(3), 2000);
    const timer3 = setTimeout(() => {
      router.push('/signin');
    }, 3200);

    return () => {
      clearInterval(interval);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [router]);

  const handleSkip = () => {
    router.push('/signin');
  };

  return (
    <div className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#03090e] font-body text-txt-primary select-none">
      {/* Dynamic Cyber Grid & GIS Vector Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan/10 via-void to-black opacity-60" />
      
      {/* Animated GIS Grid Lines */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0, 229, 255, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0, 229, 255, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Radar scanning line effect */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-cyan/10 to-transparent h-[120px]"
        animate={{ y: ['-100%', '1000%'] }}
        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
      />

      {/* Skip Button in Top Right */}
      <div className="absolute right-6 top-6 z-50">
        <button
          onClick={handleSkip}
          className="group flex items-center gap-2 rounded-full border border-cyanline/60 bg-raised/80 px-4 py-2 font-mono text-[11.5px] text-cyan backdrop-blur-md transition-all hover:border-cyan hover:bg-cyan-glow hover:text-white"
        >
          <span>Skip Intro</span>
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>

      {/* Main Cinematic Sequence Content */}
      <div className="relative z-10 flex max-w-2xl flex-col items-center px-6 text-center">
        {/* Animated Insignia Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative mb-6"
        >
          <div className="absolute -inset-4 rounded-3xl bg-cyan/20 blur-xl animate-pulse" />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border border-cyan/40 bg-gradient-to-br from-[#0a2533] to-[#04121a] shadow-[0_0_50px_rgba(0,229,255,0.3)]">
            <ShieldCheck className="h-10 w-10 text-cyan animate-pulse" strokeWidth={2.2} />
          </div>
        </motion.div>

        {/* Phase 1: 0.0 - 1.0s: LANDGUARD AI */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-2"
        >
          <h1 className="font-display text-4xl font-extrabold tracking-wider text-white sm:text-5xl">
            LANDGUARD <span className="text-cyan drop-shadow-[0_0_20px_rgba(0,229,255,0.8)]">AI</span>
          </h1>
          <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.3em] text-cyan/70">
            Government Infrastructure Intelligence
          </div>
        </motion.div>

        {/* Phase 2: 1.0 - 2.0s: Predictive Intelligence & LAND -> RISK -> ACTION */}
        <AnimatePresence mode="wait">
          {phase >= 2 && (
            <motion.div
              key="phase2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6 flex flex-col items-center"
            >
              <p className="font-display text-lg font-medium tracking-wide text-txt-secondary sm:text-xl">
                Predictive Land Acquisition Intelligence
              </p>

              {/* LAND -> RISK -> ACTION Visual Corridor Flow */}
              <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-hair bg-raised/70 px-4 py-2.5 backdrop-blur-md">
                <div className="flex items-center gap-1.5 font-mono text-[11.5px] font-bold text-cyan">
                  <Layers className="h-3.5 w-3.5 text-cyan" /> LAND
                </div>
                <span className="text-txt-tertiary">→</span>
                <div className="flex items-center gap-1.5 font-mono text-[11.5px] font-bold text-risk-high">
                  <Activity className="h-3.5 w-3.5 text-risk-high animate-bounce" /> RISK
                </div>
                <span className="text-txt-tertiary">→</span>
                <div className="flex items-center gap-1.5 font-mono text-[11.5px] font-bold text-risk-low">
                  <Zap className="h-3.5 w-3.5 text-risk-low" /> ACTION
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Phase 3: 2.0 - 3.0s: Predict • Alert • Assign • Act • Verify */}
        <AnimatePresence mode="wait">
          {phase >= 3 && (
            <motion.div
              key="phase3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mt-6"
            >
              <div className="flex flex-wrap items-center justify-center gap-2 font-mono text-[11px] uppercase tracking-widest text-txt-secondary">
                <span className="rounded border border-cyanline/40 bg-cyan-glow/20 px-2 py-0.5 text-cyan">Predict</span>
                <span>•</span>
                <span className="rounded border border-risk-critical/30 bg-risk-critical/10 px-2 py-0.5 text-risk-critical">Alert</span>
                <span>•</span>
                <span className="rounded border border-risk-high/30 bg-risk-high/10 px-2 py-0.5 text-risk-high">Assign</span>
                <span>•</span>
                <span className="rounded border border-hair bg-panel2 px-2 py-0.5 text-txt-primary">Act</span>
                <span>•</span>
                <span className="rounded border border-risk-low/40 bg-risk-low/10 px-2 py-0.5 text-risk-low">Verify</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 3-Second Loading Bar Indicator */}
        <div className="mt-10 w-64">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-raised/80 border border-hair">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan to-cyan-bright"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>
          <div className="mt-2 font-mono text-[10px] text-txt-tertiary">
            Initializing Secure Command Interface… {Math.min(100, Math.round(progress))}%
          </div>
        </div>
      </div>

      {/* Bottom Legal / SIH Demo Notice */}
      <div className="absolute bottom-4 z-10 font-mono text-[10px] text-txt-tertiary">
        SIH26017 Prototype • National Infrastructure Decision Intelligence • Synthetic Simulation
      </div>
    </div>
  );
}
