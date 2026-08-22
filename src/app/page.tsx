import React, { useState, useEffect, useRef } from 'react';
import { SplashScreen } from '../components/SplashScreen';
import { Header } from '../components/Header';
import { AudioWaveformOrb } from '../components/AudioWaveformOrb';
import { VoiceChatInterface } from '../components/VoiceChatInterface';
import { CinematicQueryWrapper, ExperienceState } from '../components/CinematicQueryWrapper';
import { Real3DBook } from '../components/Real3DBook';
import { TeamModalBook } from '../components/TeamModalBook';
import { CursorEffects } from '../components/CursorEffects';
import { ParticleBackground } from '../components/ParticleBackground';
import { BenchmarkModal } from '../components/BenchmarkModal';

import { ChunkingStrategyId } from '../lib/chunking/types';
import { STTEnginePreference } from '../lib/stt';
import { globalHarness, HarnessState, RAGAnswerResponse } from '../lib/harness/orchestrator';
import { Zap, Activity } from 'lucide-react';

export default function Home() {
  const [theme, setTheme] = useState<'hh-goa' | 'rose-white'>('hh-goa');
  const [showSplash, setShowSplash] = useState(true);
  const [showBenchmarkModal, setShowBenchmarkModal] = useState(false);
  const [showTeamBook, setShowTeamBook] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState<ChunkingStrategyId>('semantic_boundary');
  const [sttEngine, setSTTEngine] = useState<STTEnginePreference>('sarvam');
  const [sarvamKey, setSarvamKey] = useState('');
  const [elevenLabsKey, setElevenLabsKey] = useState('');
  
  // Single Experience State Machine
  const [experienceState, setExperienceState] = useState<ExperienceState>('idle');
  const [harnessState, setHarnessState] = useState<HarnessState>('IDLE');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeQueryPreview, setActiveQueryPreview] = useState('');
  const [latestResponse, setLatestResponse] = useState<RAGAnswerResponse | null>(null);

  const bookRef = useRef<HTMLDivElement | null>(null);

  // Load saved theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('julie_theme_mode') as 'hh-goa' | 'rose-white' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      document.documentElement.setAttribute('data-theme', 'hh-goa');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'hh-goa' ? 'rose-white' : 'hh-goa';
    setTheme(nextTheme);
    localStorage.setItem('julie_theme_mode', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Cinematic Timeline Orchestration + Simultaneous API Call
  const handleExecuteQuery = async (rawTextQuery: string, audioBlob?: Blob): Promise<RAGAnswerResponse> => {
    setIsProcessing(true);
    setActiveQueryPreview(rawTextQuery || 'Voice Audio Stream');

    // 0.0s Step 1: Start Wrapping Query Bubble
    setExperienceState('wrapping');

    // 0.4s Step 2: Audio Packet Takes Flight
    const flightTimer = setTimeout(() => {
      setExperienceState('sending');
    }, 450);

    // 0.9s Step 3: Sarvam Processing State
    const processTimer = setTimeout(() => {
      setExperienceState('processing');
    }, 950);

    try {
      // Simultaneous API Execution (Sub-200ms Core Pipeline)
      const response = await globalHarness.executePipeline({
        audioBlob,
        rawTextQuery,
        strategy: activeStrategy,
        sttEngine: sttEngine,
        sarvamKey,
        elevenLabsKey,
        onStateChange: (st) => setHarnessState(st)
      });

      setLatestResponse(response);

      // Clean up timers
      clearTimeout(flightTimer);
      clearTimeout(processTimer);

      // Step 4: Book Materializes
      setExperienceState('book-enter');

      // Step 5: Transition to Reading Open 3D Book
      setTimeout(() => {
        setExperienceState('reading');
        if (bookRef.current) {
          bookRef.current.scrollIntoView({ behavior: 'smooth' });
        }
      }, 700);

      return response;
    } catch (err) {
      console.error('Pipeline execution failed:', err);
      setExperienceState('idle');
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetToMic = () => {
    setExperienceState('idle');
    setLatestResponse(null);
    setHarnessState('IDLE');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="julie-app min-h-screen flex flex-col justify-between relative overflow-hidden transition-colors duration-300">
      {/* Background Ambient Canvas */}
      <ParticleBackground theme={theme} />

      {/* Cursor Effects */}
      <CursorEffects />

      {/* Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Automated Benchmark Suite Modal */}
      <BenchmarkModal
        isOpen={showBenchmarkModal}
        onClose={() => setShowBenchmarkModal(false)}
        activeStrategy={activeStrategy}
      />

      {/* Dedicated Team Dossier Book Modal */}
      <TeamModalBook
        isOpen={showTeamBook}
        onClose={() => setShowTeamBook(false)}
      />

      {/* Main App Header with Theme Switcher & Team Book Trigger */}
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        onOpenBenchmark={() => setShowBenchmarkModal(true)}
        onOpenTeam={() => setShowTeamBook(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10 flex flex-col justify-center">
        {/* ── STAGE 1: IDLE STATE (Prominent Center Mic + Bullet Options) ── */}
        {experienceState === 'idle' && (
          <section
            id="ask"
            className="app-card p-6 sm:p-10 relative overflow-hidden shadow-2xl transition-all"
          >
            {/* Hero Header */}
            <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--theme-border-subtle)] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-black tracking-[.2em] uppercase flex items-center gap-1.5 text-[var(--theme-text-title)]">
                    <Zap className="w-3.5 h-3.5 fill-[var(--theme-accent-primary)] text-[var(--theme-accent-primary)]" />
                    JULIE // VOICE-ENABLED RAG MODEL
                  </span>
                  <span className="app-badge">
                    SLA: &lt; 200MS
                  </span>
                </div>
                <h1 className="mt-1 text-2xl sm:text-4xl font-black tracking-tight text-[var(--theme-text-title)]">
                  Ask Julie anything in English or Indic languages.
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBenchmarkModal(true)}
                  className="px-4 py-2 rounded-xl border border-[var(--theme-border-subtle)] bg-[var(--theme-card-bg)] hover:bg-[var(--theme-card-subtle)] text-[var(--theme-text-title)] text-xs font-mono font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Activity className="w-3.5 h-3.5" />
                  RUN BENCHMARK
                </button>
                <button
                  onClick={() => setShowTeamBook(true)}
                  className="app-btn-primary px-4 py-2 font-mono text-xs cursor-pointer"
                >
                  TEAM BOOK
                </button>
              </div>
            </div>

            {/* 3D Audio Visualizer Orb */}
            <AudioWaveformOrb
              state={harnessState}
              isRecording={harnessState === 'LISTENING'}
              isSpeaking={harnessState === 'AUDIO_SYNTHESIZING'}
              theme={theme}
            />

            {/* Prominent Centered Mic + Bullet Options */}
            <VoiceChatInterface
              onExecuteQuery={handleExecuteQuery}
              isProcessing={isProcessing}
              harnessState={harnessState}
              activeStrategy={activeStrategy}
            />
          </section>
        )}

        {/* ── STAGE 2: CINEMATIC QUERY WRAPPING & FLIGHT TIMELINE ── */}
        <CinematicQueryWrapper
          experienceState={experienceState}
          queryText={activeQueryPreview}
          isVoice={harnessState === 'LISTENING' || harnessState === 'TRANSCRIBING'}
        />

        {/* ── STAGE 3: READING REAL 3D BOOK (Appears upon synthesis) ── */}
        {experienceState === 'reading' && (
          <div ref={bookRef} className="pt-2 transition-all">
            <Real3DBook
              response={latestResponse}
              harnessState={harnessState}
              activeStrategy={activeStrategy}
              onSelectStrategy={(newStrat) => setActiveStrategy(newStrat)}
              onAskNewQuestion={handleResetToMic}
              theme={theme}
            />
          </div>
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-[var(--theme-border-subtle)] py-6 px-4 text-center font-mono text-xs relative z-10 bg-[var(--theme-card-bg)] text-[var(--theme-text-muted)]">
        <div className="flex flex-wrap items-center justify-center gap-3 font-bold text-[var(--theme-text-title)]">
          <span>HH GOA 2026 // TASK #2</span>
          <span>·</span>
          <span>SUB-200MS VOICE RAG</span>
          <span>·</span>
          <span>SARVAM STT (saarika:v2.5)</span>
          <span>·</span>
          <span>AI4BHARAT/MSMARCO-XI</span>
        </div>
      </footer>
    </div>
  );
}
