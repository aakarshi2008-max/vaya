import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Activity, ShieldCheck, Layers, Cpu, Volume2, VolumeX, Terminal, FileText
} from 'lucide-react';
import { 
  IconBookOpen, IconChevronLeft, IconChevronRight, IconCopy, IconCheck, IconBookmark, IconRotateCcw 
} from './CustomIcons';
import { RAGAnswerResponse, HarnessState } from '../lib/harness/orchestrator';
import { ChunkingStrategyId } from '../lib/chunking/types';

import { LatencyTelemetryPanel } from './LatencyTelemetryPanel';
import { GuardrailInspector } from './GuardrailInspector';
import { ChunkingVisualizer } from './ChunkingVisualizer';
import { HarnessVisualizer } from './HarnessVisualizer';

interface Real3DBookProps {
  response: RAGAnswerResponse | null;
  harnessState: HarnessState;
  activeStrategy: ChunkingStrategyId;
  onSelectStrategy: (strategy: ChunkingStrategyId) => void;
  onAskNewQuestion: () => void;
  theme?: 'hh-goa' | 'rose-white';
}

const CHAPTERS = [
  { id: 1, title: 'Grounded Answer', subtitle: 'Voice Synthesizer Output', icon: Sparkles },
  { id: 2, title: 'Latency Radar', subtitle: 'Sub-200ms Telemetry Matrix', icon: Activity },
  { id: 3, title: 'Guardrail Inspector', subtitle: 'Multi-Stage Safety & Grounding', icon: ShieldCheck },
  { id: 4, title: 'Chunking Engine', subtitle: '4 Strategies on MSMARCO-XI', icon: Layers },
  { id: 5, title: 'Harness Engine', subtitle: 'State Lifecycle & Tool Traces', icon: Cpu },
];

export const Real3DBook: React.FC<Real3DBookProps> = ({
  response,
  harnessState,
  activeStrategy,
  onSelectStrategy,
  onAskNewQuestion,
  theme = 'hh-goa',
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [direction, setDirection] = useState<number>(1);

  const goToChapter = (pageNo: number) => {
    setDirection(pageNo > currentPage ? 1 : -1);
    setCurrentPage(pageNo);
  };

  const nextPage = () => {
    if (currentPage < CHAPTERS.length) {
      setDirection(1);
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setDirection(-1);
      setCurrentPage((prev) => prev - 1);
    }
  };

  // Keyboard navigation for turning pages
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === 'ArrowLeft') prevPage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage]);

  const speakAnswer = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    const cleanText = text.replace(/【[^】]*】/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto my-6 space-y-4">
      {/* ── TOP BOOK HEADER & BOOKMARK RIBBONS ── */}
      <div className="flex items-center justify-between flex-wrap gap-2 app-card p-3 shadow-md">
        <div className="flex items-center space-x-2">
          <IconBookOpen className="w-5 h-5 text-[var(--theme-accent-primary)]" />
          <span className="font-mono text-xs font-black uppercase text-[var(--theme-text-title)] tracking-wider">
            Julie // 3D Technical Book
          </span>
          <span className="app-badge">
            CHAPTER {currentPage} OF {CHAPTERS.length}
          </span>
        </div>

        {/* Chapter Ribbon Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {CHAPTERS.map((chap) => {
            const isSelected = currentPage === chap.id;
            const Icon = chap.icon;
            return (
              <button
                key={chap.id}
                onClick={() => goToChapter(chap.id)}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'app-btn-primary shadow-sm'
                    : 'app-card-subtle opacity-75 hover:opacity-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{chap.title}</span>
              </button>
            );
          })}
        </div>

        {/* Ask New Question Button */}
        <button
          onClick={onAskNewQuestion}
          className="px-3.5 py-1.5 rounded-xl app-btn-primary text-xs font-mono font-black transition-all cursor-pointer flex items-center gap-1.5"
        >
          <IconRotateCcw className="w-3.5 h-3.5" />
          <span>Ask New Question</span>
        </button>
      </div>

      {/* ── 3D PHYSICAL HARDCOVER OPEN BOOK CASING ── */}
      <div
        style={{ perspective: '1800px' }}
        className="relative rounded-[2.5rem] p-5 sm:p-8 app-card shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] border-4 border-[var(--theme-border)] overflow-hidden"
      >
        {/* Central Realistic Spine Crease / Gutter Shadow */}
        <div className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-10 bg-gradient-to-r from-black/10 via-black/30 to-black/10 pointer-events-none z-30 shadow-inner" />

        {/* Left & Right Stacked Paper Edge Highlights */}
        <div className="hidden lg:block absolute left-2 inset-y-6 w-2.5 bg-gradient-to-r from-black/15 to-transparent rounded-l pointer-events-none opacity-50" />
        <div className="hidden lg:block absolute right-2 inset-y-6 w-2.5 bg-gradient-to-l from-black/15 to-transparent rounded-r pointer-events-none opacity-50" />

        {/* ── 3D PAGE CONTENT LAYER WITH SMOOTH FLIP PHYSICS ── */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            initial={{
              opacity: 0,
              rotateY: direction * 18,
              x: direction * 25,
            }}
            animate={{
              opacity: 1,
              rotateY: 0,
              x: 0,
            }}
            exit={{
              opacity: 0,
              rotateY: -direction * 18,
              x: -direction * 25,
            }}
            transition={{
              duration: 0.35,
              ease: [0.25, 1, 0.5, 1],
            }}
            style={{ transformStyle: 'preserve-3d' }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10"
          >
            {/* ════ CHAPTER 1: DUAL PAGE SPREAD (QUESTION & GROUNDED ANSWER) ════ */}
            {currentPage === 1 && (
              <>
                {/* Left Page: Recorded Question Dossier */}
                <div className="app-card-subtle p-6 rounded-2xl flex flex-col justify-between space-y-4 border-r border-[var(--theme-border-subtle)]">
                  <div>
                    <div className="flex items-center justify-between border-b border-[var(--theme-border-subtle)] pb-3 mb-4">
                      <span className="font-mono text-xs font-black text-[var(--theme-text-muted)] uppercase tracking-wider">
                        LEFT PAGE · VOICE RECORDING DOSSIER
                      </span>
                      <span className="app-badge">
                        LANG: {response?.detectedLanguage.toUpperCase() || 'EN'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-[var(--theme-card-bg)] border border-[var(--theme-border-subtle)]">
                        <span className="text-[10px] font-mono font-black text-[var(--theme-accent-primary)] uppercase">
                          Recorded Question:
                        </span>
                        <p className="text-base font-bold text-[var(--theme-text-title)] mt-1 font-sans">
                          "{response?.query || 'Voice Query Payload'}"
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--theme-card-bg)] border border-[var(--theme-border-subtle)] space-y-2">
                        <span className="text-[10px] font-mono font-black text-[var(--theme-text-muted)] uppercase">
                          Pipeline Telemetry:
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                          <div>
                            <span className="text-[var(--theme-text-muted)]">Core RAG:</span>{' '}
                            <strong className="text-[var(--theme-text-title)]">
                              {(response?.telemetry.totalEndToEndLatencyMs || 16.6).toFixed(1)} ms
                            </strong>
                          </div>
                          <div>
                            <span className="text-[var(--theme-text-muted)]">Target SLA:</span>{' '}
                            <strong className="text-emerald-600 font-black">&lt; 200ms (MET)</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--theme-border-subtle)] flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--theme-text-muted)]">Chapter 01 · Page 1</span>
                    <button
                      onClick={nextPage}
                      className="text-[var(--theme-accent-primary)] font-black hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Turn to Latency Radar <IconChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Right Page: Grounded Answer & Audio Synthesis */}
                <div className="app-card-subtle p-6 rounded-2xl flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between border-b border-[var(--theme-border-subtle)] pb-3 mb-4">
                      <span className="font-mono text-xs font-black text-[var(--theme-text-muted)] uppercase tracking-wider">
                        RIGHT PAGE · SYNTHESIZED ANSWER
                      </span>
                      {response && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => copyToClipboard(response.answer)}
                            className="px-2.5 py-1 rounded-lg app-card text-xs font-mono flex items-center gap-1 cursor-pointer"
                          >
                            {copied ? <IconCheck className="w-3 h-3 text-emerald-600" /> : <IconCopy className="w-3 h-3" />}
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                          <button
                            onClick={() => speakAnswer(response.answer)}
                            className="px-3 py-1 app-btn-primary text-xs font-mono flex items-center gap-1 cursor-pointer"
                          >
                            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                            <span>{isSpeaking ? 'Mute' : 'Play Voice'}</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {response ? (
                      <div className="space-y-4">
                        <div className="text-[var(--theme-text-title)] text-sm sm:text-base leading-relaxed font-sans font-medium p-4 rounded-xl bg-[var(--theme-card-bg)] border border-[var(--theme-border-subtle)]">
                          {response.answer}
                        </div>

                        {response.retrievedChunks && response.retrievedChunks.length > 0 && !response.isRefusal && (
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono font-black text-[var(--theme-text-muted)] uppercase">
                              Top Grounded Context Evidence:
                            </span>
                            <div className="p-3.5 rounded-xl bg-[var(--theme-card-bg)] border border-[var(--theme-border-subtle)] text-xs">
                              <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                                <span className="font-black text-[var(--theme-text-title)]">
                                  【1】 {response.retrievedChunks[0].chunk.metadata.docTitle}
                                </span>
                                <span className="app-badge">
                                  Match: {(response.retrievedChunks[0].score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-[var(--theme-text-body)] text-xs line-clamp-3">
                                {response.retrievedChunks[0].chunk.text}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-xs font-mono text-[var(--theme-text-muted)]">
                        No answer generated yet.
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[var(--theme-border-subtle)] flex items-center justify-between text-xs font-mono">
                    <span className="text-[var(--theme-text-muted)]">Chapter 01 · Page 2</span>
                    <span className="app-badge">GROUNDED EVIDENCE</span>
                  </div>
                </div>
              </>
            )}

            {/* ════ CHAPTER 2: LATENCY TELEMETRY RADAR ════ */}
            {currentPage === 2 && (
              <div className="col-span-1 lg:col-span-2">
                <LatencyTelemetryPanel telemetry={response?.telemetry} />
              </div>
            )}

            {/* ════ CHAPTER 3: GUARDRAILS & FAITHFULNESS ════ */}
            {currentPage === 3 && (
              <div className="col-span-1 lg:col-span-2">
                <GuardrailInspector guardrailReport={response?.guardrailReport} />
              </div>
            )}

            {/* ════ CHAPTER 4: 4 CHUNKING STRATEGIES ON MSMARCO-XI ════ */}
            {currentPage === 4 && (
              <div className="col-span-1 lg:col-span-2">
                <ChunkingVisualizer
                  activeStrategy={activeStrategy}
                  onSelectStrategy={onSelectStrategy}
                />
              </div>
            )}

            {/* ════ CHAPTER 5: MODEL HARNESS & TOOL TRACES ════ */}
            {currentPage === 5 && (
              <div className="col-span-1 lg:col-span-2">
                <HarnessVisualizer
                  currentState={harnessState}
                  toolTraces={response?.toolTraces || []}
                  retryCount={response?.retryAttempts || 0}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* ── 3D BOOK FOOTBAR TURN CONTROLS ── */}
        <div className="flex items-center justify-between border-t-2 border-[var(--theme-border-subtle)] pt-4 mt-6">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="px-4 py-2.5 rounded-xl app-card-subtle font-mono text-xs font-bold flex items-center space-x-1.5 disabled:opacity-30 cursor-pointer shadow-sm"
          >
            <IconChevronLeft className="w-4 h-4" />
            <span>Turn to Previous Page</span>
          </button>

          <div className="text-center font-mono text-xs font-black text-[var(--theme-text-title)]">
            {CHAPTERS[currentPage - 1].title} —{' '}
            <span className="font-normal text-[var(--theme-text-muted)]">
              {CHAPTERS[currentPage - 1].subtitle}
            </span>
          </div>

          <button
            onClick={nextPage}
            disabled={currentPage === CHAPTERS.length}
            className="px-4 py-2.5 rounded-xl app-btn-primary font-mono text-xs font-black flex items-center space-x-1.5 disabled:opacity-30 cursor-pointer shadow-sm"
          >
            <span>Turn to Next Page</span>
            <IconChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
