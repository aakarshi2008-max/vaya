import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, ChevronLeft, ChevronRight, Sparkles, Activity, 
  ShieldCheck, Layers, Cpu, Volume2, VolumeX, Copy, Check, Terminal, FileText
} from 'lucide-react';
import { RAGAnswerResponse, HarnessState } from '../lib/harness/orchestrator';
import { ChunkingStrategyId } from '../lib/chunking/types';

import { LatencyTelemetryPanel } from './LatencyTelemetryPanel';
import { GuardrailInspector } from './GuardrailInspector';
import { ChunkingVisualizer } from './ChunkingVisualizer';
import { HarnessVisualizer } from './HarnessVisualizer';

interface InteractiveDossierBookProps {
  response: RAGAnswerResponse | null;
  harnessState: HarnessState;
  activeStrategy: ChunkingStrategyId;
  onSelectStrategy: (strategy: ChunkingStrategyId) => void;
}

const CHAPTERS = [
  { id: 1, title: 'Grounded Answer', subtitle: 'Voice Synthesized Output', icon: Sparkles },
  { id: 2, title: 'Latency Radar', subtitle: 'Sub-200ms Telemetry', icon: Activity },
  { id: 3, title: 'Guardrail Inspector', subtitle: 'Safety & Hallucination Guard', icon: ShieldCheck },
  { id: 4, title: 'Chunking Engine', subtitle: '4 Strategies on MSMARCO-XI', icon: Layers },
  { id: 5, title: 'Model Harness', subtitle: 'State Machine & Tool Traces', icon: Cpu },
];

export const InteractiveDossierBook: React.FC<InteractiveDossierBookProps> = ({
  response,
  harnessState,
  activeStrategy,
  onSelectStrategy,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [direction, setDirection] = useState<number>(1);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);

  const goToPage = (page: number) => {
    setDirection(page > currentPage ? 1 : -1);
    setCurrentPage(page);
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

  // Keyboard arrow navigation
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
    <div id="dossier-book" className="w-full max-w-7xl mx-auto space-y-4">
      {/* Book Navigation Ribbon */}
      <div className="flex items-center justify-between flex-wrap gap-2 app-card p-3 shadow-md">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-[var(--theme-accent-primary)]" />
          <span className="font-mono text-xs font-black uppercase text-[var(--theme-text-title)] tracking-wider">
            Technical Dossier Book
          </span>
          <span className="app-badge">
            CHAPTER {currentPage} OF {CHAPTERS.length}
          </span>
        </div>

        {/* Chapter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {CHAPTERS.map((chap) => {
            const Icon = chap.icon;
            const isSelected = currentPage === chap.id;
            return (
              <button
                key={chap.id}
                onClick={() => goToPage(chap.id)}
                className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
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

        {/* Page Flip Next/Prev Controls */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={prevPage}
            disabled={currentPage === 1}
            className="p-2 rounded-xl app-card-subtle disabled:opacity-30 transition-all cursor-pointer"
            title="Previous Chapter (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextPage}
            disabled={currentPage === CHAPTERS.length}
            className="p-2 rounded-xl app-card-subtle disabled:opacity-30 transition-all cursor-pointer"
            title="Next Chapter (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Animated Page Content View */}
      <div className="relative min-h-[460px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentPage}
            custom={direction}
            initial={{ opacity: 0, x: direction * 40, rotateY: direction * 6 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            exit={{ opacity: 0, x: -direction * 40, rotateY: -direction * 6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full"
          >
            {/* CHAPTER 1: Grounded Answer & Voice Synthesis */}
            {currentPage === 1 && (
              <div className="app-card p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between border-b border-[var(--theme-border-subtle)] pb-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-[var(--theme-text-title)]">
                      Chapter 01 // Grounded Answer &amp; Voice Output
                    </h2>
                    <p className="text-xs font-mono text-[var(--theme-text-muted)]">
                      Sub-200ms Synthesizer strictly cited against `ai4bharat/MSMARCO-XI`.
                    </p>
                  </div>
                  {response && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(response.answer)}
                        className="px-3 py-1 rounded-xl app-card-subtle text-xs font-mono flex items-center space-x-1 cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <button
                        onClick={() => speakAnswer(response.answer)}
                        className="px-3.5 py-1.5 app-btn-primary text-xs font-mono flex items-center space-x-1.5 cursor-pointer"
                      >
                        {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span>{isSpeaking ? 'Mute' : 'Play Voice'}</span>
                      </button>
                    </div>
                  )}
                </div>

                {response ? (
                  <div className="space-y-4">
                    {/* User Query Echo */}
                    <div className="p-3.5 rounded-xl app-card-subtle text-xs font-mono flex items-start space-x-2">
                      <Terminal className="w-4 h-4 text-[var(--theme-accent-primary)] flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-[var(--theme-text-title)]">Question:</span> "{response.query}"
                      </div>
                    </div>

                    {/* Answer Output */}
                    <div className="text-[var(--theme-text-title)] text-base sm:text-lg leading-relaxed font-sans font-medium p-5 rounded-2xl app-card-subtle">
                      {response.answer}
                    </div>

                    {/* Retrieved Grounded Context Passages */}
                    {response.retrievedChunks && response.retrievedChunks.length > 0 && !response.isRefusal && (
                      <div className="border-t border-[var(--theme-border-subtle)] pt-4">
                        <div className="flex items-center space-x-2 text-xs font-mono mb-3">
                          <FileText className="w-4 h-4 text-[var(--theme-accent-primary)]" />
                          <span className="font-black text-[var(--theme-text-title)]">
                            Grounded Context Passages (Top-{response.retrievedChunks.length}):
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {response.retrievedChunks.map((res, i) => (
                            <div key={i} className="p-4 rounded-xl app-card-subtle text-xs">
                              <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                                <span className="font-black text-[var(--theme-text-title)]">
                                  【{i + 1}】 {res.chunk.metadata.docTitle}
                                </span>
                                <span className="app-badge">
                                  Match: {(res.score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p className="text-[var(--theme-text-body)] text-xs leading-relaxed">{res.chunk.text}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-16 text-center text-xs font-mono text-[var(--theme-text-muted)]">
                    Ask any question above to generate your grounded answer!
                  </div>
                )}
              </div>
            )}

            {/* CHAPTER 2: Sub-200ms Latency Radar */}
            {currentPage === 2 && (
              <LatencyTelemetryPanel telemetry={response?.telemetry} />
            )}

            {/* CHAPTER 3: Guardrail & Hallucination Inspector */}
            {currentPage === 3 && (
              <GuardrailInspector guardrailReport={response?.guardrailReport} />
            )}

            {/* CHAPTER 4: 4-Way Chunking Architecture */}
            {currentPage === 4 && (
              <ChunkingVisualizer
                activeStrategy={activeStrategy}
                onSelectStrategy={onSelectStrategy}
              />
            )}

            {/* CHAPTER 5: Model Harness State Machine & Tool Traces */}
            {currentPage === 5 && (
              <HarnessVisualizer
                currentState={harnessState}
                toolTraces={response?.toolTraces || []}
                retryCount={response?.retryAttempts || 0}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Page Navigation Controls */}
      <div className="flex items-center justify-between app-card p-3 shadow-md">
        <button
          onClick={prevPage}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-xl app-card-subtle font-mono text-xs font-bold flex items-center space-x-1.5 disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Chapter</span>
        </button>

        <div className="text-center font-mono text-xs font-black text-[var(--theme-text-title)]">
          {CHAPTERS[currentPage - 1].title} — <span className="font-normal text-[var(--theme-text-muted)]">{CHAPTERS[currentPage - 1].subtitle}</span>
        </div>

        <button
          onClick={nextPage}
          disabled={currentPage === CHAPTERS.length}
          className="px-4 py-2 rounded-xl app-btn-primary font-mono text-xs font-black flex items-center space-x-1.5 disabled:opacity-30 cursor-pointer"
        >
          <span>Next Chapter</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
