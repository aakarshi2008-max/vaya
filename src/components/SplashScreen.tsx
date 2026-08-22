import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Sparkles, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface SplashScreenProps { onComplete: () => void; }

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [ready, setReady] = useState(false);
  useEffect(() => { const id = window.setTimeout(() => setReady(true), 700); return () => window.clearTimeout(id); }, []);
  return (
    <motion.section className="fixed inset-0 z-[100] flex min-h-screen flex-col overflow-hidden bg-gradient-to-br from-[#fcf4f7] via-[#ffeef5] to-[#ffb7c5] text-[#240a15]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(#ff007f_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute -right-24 top-1/4 h-96 w-96 rounded-full bg-[#ff007f] blur-[160px] opacity-15" />
      <div className="absolute -left-24 bottom-1/4 h-96 w-96 rounded-full bg-[#ff70a6] blur-[160px] opacity-20" />
      
      <header className="relative z-10 flex items-center justify-between border-b border-[#ff2a85]/15 px-6 py-5 font-mono text-xs font-black tracking-[.14em] text-[#ff007f] sm:px-12">
        <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-[#ff007f]" /> JULIE / VOICE RAG</span>
        <span>HH GOA 2026 · TASK 02</span>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col justify-center px-6 sm:px-12">
        <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .1 }} className="mb-5 font-mono text-xs font-black tracking-[.25em] text-[#ff007f]">
          SPEAK NATURALLY. RETRIEVE EVIDENCE. VERIFY GROUNDING.
        </motion.p>
        <motion.h1 initial={{ y: 35, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .15, type: 'spring', stiffness: 75 }} className="font-serif text-[clamp(6rem,22vw,18rem)] leading-[.75] tracking-[-.07em] text-[#240a15]">
          JU<span className="text-[#ff007f]">L</span>IE
        </motion.h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .45 }} className="mt-14 grid gap-7 border-t border-[#ff2a85]/20 pt-6 md:grid-cols-[1fr_auto] md:items-end">
          <p className="max-w-xl text-xl leading-tight text-[#4a1528] sm:text-3xl font-medium">
            A voice-first RAG workspace engineered for answers that stay strictly grounded in verified evidence.
          </p>
          <button onClick={onComplete} disabled={!ready} className="group flex items-center gap-4 self-start rounded-2xl bg-gradient-to-r from-[#ff007f] to-[#ff70a6] px-8 py-4 font-mono text-xs font-black tracking-[.14em] text-white transition hover:opacity-95 shadow-md disabled:opacity-50 cursor-pointer">
            ENTER JULIE <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
          </button>
        </motion.div>
      </main>

      <footer className="relative z-10 flex justify-between border-t border-[#ff2a85]/15 px-6 py-5 font-mono text-[11px] tracking-[.14em] text-[#6b334a] sm:px-12">
        <span>SARVAM STT · AI4BHARAT/MSMARCO-XI</span>
        <span className="font-bold text-[#ff007f]">#RAGInGoa</span>
      </footer>
    </motion.section>
  );
};
