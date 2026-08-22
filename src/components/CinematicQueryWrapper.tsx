import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { 
  Radio, Zap, Cpu, Sparkles, Send, Shield, Activity, 
  Lock, CheckCircle2, Box, ArrowRight
} from 'lucide-react';

export type ExperienceState =
  | 'idle'
  | 'wrapping'
  | 'sending'
  | 'processing'
  | 'book-enter'
  | 'reading';

interface CinematicQueryWrapperProps {
  experienceState: ExperienceState;
  queryText: string;
  isVoice: boolean;
}

export const CinematicQueryWrapper: React.FC<CinematicQueryWrapperProps> = ({
  experienceState,
  queryText,
  isVoice,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cargoBoxRef = useRef<HTMLDivElement | null>(null);
  const sarvamStationRef = useRef<HTMLDivElement | null>(null);

  // GSAP 3D Cargo Box Acceleration & Docking at Sarvam Station
  useEffect(() => {
    if (experienceState === 'sending' && cargoBoxRef.current) {
      gsap.fromTo(
        cargoBoxRef.current,
        { 
          x: -180, 
          y: 20, 
          scale: 1.2, 
          rotationY: -20,
          rotationZ: -8,
          opacity: 1 
        },
        { 
          x: 180, 
          y: -10, 
          scale: 0.9, 
          rotationY: 25, 
          rotationZ: 10,
          opacity: 1, 
          duration: 1.1, 
          ease: 'power3.inOut' 
        }
      );
    }

    if (experienceState === 'processing' && sarvamStationRef.current) {
      gsap.to(sarvamStationRef.current, {
        scale: 1.08,
        boxShadow: '0 0 50px rgba(0,93,55,0.8)',
        duration: 0.4,
        yoyo: true,
        repeat: 3,
        ease: 'sine.inOut',
      });
    }
  }, [experienceState]);

  if (experienceState === 'idle' || experienceState === 'reading') {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        style={{ perspective: '1600px' }}
        initial={{ opacity: 0, scale: 0.9, y: 25 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: -25 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-3xl mx-auto my-8 p-6 sm:p-10 rounded-[2.5rem] app-card shadow-[0_30px_90px_-20px_rgba(0,0,0,0.35)] relative overflow-hidden text-center border-4 border-[var(--theme-border)]"
      >
        {/* Holographic Grid Background */}
        <div className="absolute inset-0 bg-radial-gradient from-[var(--theme-card-subtle)] via-[var(--theme-card-bg)] to-black/10 opacity-90 pointer-events-none" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[32rem] h-[32rem] rounded-full bg-[var(--theme-accent-primary)]/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* ════ STAGE 1: 8K AUDIO ORB DESCENDING INTO CYBERNETIC CARGO BOX ════ */}
          {experienceState === 'wrapping' && (
            <div className="py-4 flex flex-col items-center justify-center space-y-4">
              {/* 8K Glowing Audio Crystal / Voice Waveform Sphere */}
              <motion.div
                initial={{ y: -60, scale: 1.3, opacity: 1 }}
                animate={{ y: 20, scale: 0.65, opacity: 0.9 }}
                transition={{ duration: 0.7, ease: 'easeInOut' }}
                className="relative z-20"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--theme-accent-primary)] via-[var(--theme-accent-secondary)] to-[var(--theme-accent-primary)] p-1 shadow-[0_0_50px_var(--theme-accent-primary)] animate-pulse flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-[var(--theme-card-bg)] flex items-center justify-center">
                    <Radio className="w-9 h-9 text-[var(--theme-accent-primary)] animate-ping" />
                  </div>
                </div>
              </motion.div>

              {/* 3D Cybernetic Cargo Box (Opens Hatch, Audio Enters, Hatch Seals) */}
              <div className="relative w-48 h-28 rounded-2xl app-card border-3 border-[var(--theme-border)] shadow-2xl flex flex-col items-center justify-center overflow-hidden p-3">
                {/* Glowing Sealing Hatch Bars */}
                <motion.div
                  className="absolute inset-x-0 top-0 h-2 bg-[var(--theme-accent-primary)]"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 0.7, delay: 0.3 }}
                />

                <Box className="w-10 h-10 text-[var(--theme-accent-primary)] mb-1" />
                <span className="font-mono text-[10px] font-black uppercase text-[var(--theme-text-title)] tracking-wider">
                  ENCRYPTED AUDIO CARGO
                </span>
                <span className="text-[9px] font-mono text-[var(--theme-text-muted)] truncate max-w-[150px]">
                  {queryText || 'Voice Stream Payload'}
                </span>
              </div>
            </div>
          )}

          {/* ════ STAGE 2 & 3: CARGO BOX FLYING TO SARVAM STATION & DOCKING ════ */}
          {(experienceState === 'sending' || experienceState === 'processing') && (
            <div style={{ perspective: '1200px' }} className="relative h-36 flex items-center justify-between px-4">
              {/* Origin Station: User Voice Antenna */}
              <div className="flex flex-col items-center z-20 shrink-0">
                <div className="w-14 h-14 rounded-2xl app-btn-primary flex items-center justify-center shadow-[0_10px_25px_rgba(0,0,0,0.25)] border-2 border-[var(--theme-border)]">
                  <Radio className="w-7 h-7 animate-pulse" />
                </div>
                <span className="font-mono text-[10px] font-black uppercase mt-2 text-[var(--theme-text-title)]">
                  Voice Launchpad
                </span>
              </div>

              {/* Hyperloop Flight Path with Flying Cargo Box */}
              <div className="flex-1 mx-6 relative h-24 flex items-center justify-center">
                {/* Hyperloop Track */}
                <div className="w-full h-2.5 bg-[var(--theme-meter-track)] rounded-full relative overflow-hidden shadow-inner">
                  <motion.div
                    className="absolute inset-y-0 bg-gradient-to-r from-[var(--theme-accent-secondary)] to-[var(--theme-accent-primary)] rounded-full"
                    animate={{ left: ['0%', '100%'], width: ['20%', '50%', '20%'] }}
                    transition={{ duration: 1.0, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>

                {/* Flying Encrypted 3D Audio Box with Thrusters */}
                <motion.div
                  ref={cargoBoxRef}
                  style={{ transformStyle: 'preserve-3d' }}
                  className="absolute flex items-center gap-2 app-card px-4 py-2.5 rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.4)] border-2 border-[var(--theme-accent-primary)] cursor-pointer"
                >
                  {/* Thruster Flame Exhaust */}
                  <motion.div
                    className="h-3 w-7 bg-gradient-to-r from-transparent via-[var(--theme-accent-secondary)] to-[var(--theme-accent-primary)] rounded-full mr-1 blur-xs"
                    animate={{ scaleX: [1, 2.4, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 0.15, repeat: Infinity }}
                  />
                  <Box className="w-5 h-5 text-[var(--theme-accent-primary)]" />
                  <div className="text-left font-mono">
                    <div className="text-[10px] font-black tracking-wider text-[var(--theme-text-title)]">
                      AUDIO CARGO
                    </div>
                    <div className="text-[8px] text-[var(--theme-accent-secondary)] font-bold uppercase">
                      SARVAM TRANSIT
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Destination Station: Sarvam Neural Quantum Hub */}
              <div ref={sarvamStationRef} className="flex flex-col items-center z-20 shrink-0">
                <div
                  className={`w-16 h-16 rounded-2xl app-card flex flex-col items-center justify-center shadow-2xl border-3 border-[var(--theme-accent-primary)] relative transition-all duration-300 ${
                    experienceState === 'processing'
                      ? 'scale-110 shadow-[0_0_40px_var(--theme-accent-primary)]'
                      : ''
                  }`}
                >
                  {/* Orbital Particle Halo */}
                  {experienceState === 'processing' && (
                    <motion.div
                      className="absolute -inset-2.5 rounded-2xl border-2 border-dashed border-[var(--theme-accent-secondary)]"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                  <Cpu className="w-7 h-7 text-[var(--theme-accent-primary)]" />
                  <span className="text-[8px] font-mono font-black text-[var(--theme-text-muted)] mt-0.5">
                    SARVAM
                  </span>
                </div>
                <span className="font-mono text-[10px] font-black uppercase mt-2 text-[var(--theme-text-title)]">
                  Sarvam Station
                </span>
              </div>
            </div>
          )}

          {/* ════ STAGE 4: SARVAM MATERIALIZES 3D DOSSIER BOOK ════ */}
          {experienceState === 'book-enter' && (
            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              <div className="w-20 h-20 rounded-3xl app-btn-primary flex items-center justify-center shadow-[0_0_50px_var(--theme-accent-primary)] animate-spin-slow">
                <Sparkles className="w-10 h-10" />
              </div>
              <span className="font-mono text-base font-black text-[var(--theme-text-title)] tracking-widest uppercase">
                ✨ Materializing 3D Dossier Book...
              </span>
            </div>
          )}

          {/* Status Capsule Ribbon */}
          <div className="pt-2">
            <div className="inline-flex items-center gap-2 app-badge py-1.5 px-4 text-xs font-mono font-black shadow-md">
              <span className="h-2 w-2 rounded-full bg-[var(--theme-accent-primary)] animate-ping" />
              <span>
                {experienceState === 'wrapping'
                  ? 'PACKAGING VOICE AUDIO INTO CARGO CONTAINER...'
                  : experienceState === 'sending'
                  ? 'DISPATCHING AUDIO CARGO TO SARVAM STATION...'
                  : experienceState === 'processing'
                  ? 'SARVAM STATION PROCESSING & GROUNDING (<200MS)...'
                  : '3D DOSSIER BOOK MATERIALIZING...'}
              </span>
            </div>
            {queryText && experienceState !== 'wrapping' && (
              <p className="text-xs text-[var(--theme-text-muted)] mt-2 italic font-sans max-w-md mx-auto truncate">
                "{queryText}"
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
