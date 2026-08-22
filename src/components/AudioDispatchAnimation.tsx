import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Zap, Radio, Cpu, Sparkles } from 'lucide-react';
import { HarnessState } from '../lib/harness/orchestrator';

interface AudioDispatchAnimationProps {
  isVisible: boolean;
  harnessState: HarnessState;
  queryPreview?: string;
}

export const AudioDispatchAnimation: React.FC<AudioDispatchAnimationProps> = ({
  isVisible,
  harnessState,
  queryPreview = '',
}) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        className="w-full my-6 p-6 rounded-2xl app-card relative overflow-hidden shadow-2xl"
      >
        {/* Sky / Cloud Flowing Horizon Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--theme-card-subtle)] to-transparent opacity-60" />

        <div className="relative z-10 space-y-4">
          {/* Flight Runway & Supersonic Audio Jet */}
          <div className="flex items-center justify-between relative h-20 px-4">
            {/* Launchpad: Voice Audio Stream */}
            <div className="flex flex-col items-center z-10 shrink-0">
              <div className="w-12 h-12 rounded-2xl app-btn-primary flex items-center justify-center shadow-lg">
                <Radio className="w-6 h-6 animate-pulse" />
              </div>
              <span className="font-mono text-[10px] font-black uppercase mt-1 text-[var(--theme-text-title)]">
                Voice Input
              </span>
            </div>

            {/* Flight Path with Flying Supersonic Jet */}
            <div className="flex-1 mx-6 relative h-12 flex items-center overflow-hidden">
              {/* Runway Vapor Trails */}
              <div className="w-full h-1 bg-[var(--theme-meter-track)] rounded-full relative">
                <motion.div
                  className="absolute inset-y-0 bg-[var(--theme-accent-primary)] rounded-full"
                  animate={{
                    left: ['0%', '100%'],
                    width: ['10%', '35%', '10%'],
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>

              {/* Supersonic Audio Jet flying across sky */}
              <motion.div
                className="absolute flex items-center gap-2 app-btn-primary px-3.5 py-1.5 rounded-full shadow-xl -top-1"
                animate={{
                  left: ['-5%', '92%'],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <div className="relative flex items-center">
                  {/* Jet Flame Exhaust */}
                  <motion.span
                    className="h-2 w-4 bg-[var(--theme-accent-secondary)] rounded-full blur-xs mr-1"
                    animate={{ scaleX: [1, 1.8, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 0.2, repeat: Infinity }}
                  />
                  <Zap className="w-4 h-4 fill-current rotate-90" />
                </div>
                <span className="font-mono text-[10px] font-black tracking-wider whitespace-nowrap">
                  SARVAM FLIGHT
                </span>
              </motion.div>
            </div>

            {/* Target Node: Sarvam Neural STT */}
            <div className="flex flex-col items-center z-10 shrink-0">
              <div className="w-12 h-12 rounded-2xl app-card flex items-center justify-center shadow-lg border-2 border-[var(--theme-accent-primary)]">
                <Cpu className="w-6 h-6 text-[var(--theme-accent-primary)] animate-bounce" />
              </div>
              <span className="font-mono text-[10px] font-black uppercase mt-1 text-[var(--theme-text-title)]">
                Sarvam AI
              </span>
            </div>
          </div>

          {/* Status Capsule */}
          <div className="text-center font-mono">
            <div className="text-xs font-black text-[var(--theme-text-title)] flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--theme-accent-primary)] animate-ping" />
              <span>
                {harnessState === 'TRANSCRIBING'
                  ? 'FLYING JET AUDIO DELIVERED → SARVAM (saarika:v2.5) TRANSCRIBING...'
                  : harnessState === 'INPUT_GUARDRAIL'
                  ? 'GUARDRAIL SECURITY CHECKING...'
                  : harnessState === 'RETRIEVING'
                  ? 'QUERYING MSMARCO-XI VECTOR DB...'
                  : 'SYNTHESIZING GROUNDED ANSWER (<200MS)...'}
              </span>
            </div>
            {queryPreview && (
              <p className="text-[11px] text-[var(--theme-text-muted)] mt-1 truncate max-w-md mx-auto italic font-sans">
                "{queryPreview}"
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
