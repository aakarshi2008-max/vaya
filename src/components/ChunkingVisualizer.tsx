import React, { useState } from 'react';
import { Layers, Database, Sparkles, Sliders, CheckCircle2, ChevronRight, BarChart2, Cpu } from 'lucide-react';
import { ChunkingStrategyId, STRATEGY_CONFIGS } from '../lib/chunking/types';
import { MSMARCO_XI_DATASET } from '../lib/dataset/msmarco_xi';
import { executeChunking, compareChunkingStrategies } from '../lib/chunking';

interface ChunkingVisualizerProps {
  activeStrategy: ChunkingStrategyId;
  onSelectStrategy: (strategy: ChunkingStrategyId) => void;
}

export const ChunkingVisualizer: React.FC<ChunkingVisualizerProps> = ({
  activeStrategy,
  onSelectStrategy,
}) => {
  const [selectedDocId, setSelectedDocId] = useState<string>(MSMARCO_XI_DATASET[0].id);
  const [activeTab, setActiveTab] = useState<'inspector' | 'matrix'>('inspector');

  const selectedDoc = MSMARCO_XI_DATASET.find((d) => d.id === selectedDocId) || MSMARCO_XI_DATASET[0];
  const currentChunks = executeChunking(selectedDoc, activeStrategy);
  const comparisonResults = compareChunkingStrategies(selectedDoc);

  const strategies: { id: ChunkingStrategyId; name: string; desc: string; targetTok: string; pak: string }[] = [
    { id: 'semantic_boundary', name: 'Semantic Boundary Chunking', desc: 'Proposition-level semantic splitting', targetTok: '~45 tok', pak: '94.6% P@K' },
    { id: 'hierarchical_parent_child', name: 'Hierarchical Parent-Document', desc: 'Child retrieval → Parent generation', targetTok: '~28 tok', pak: '97.2% P@K' },
    { id: 'metadata_aware', name: 'Metadata & Language Aware', desc: 'ISO-code & Section tagged boundaries', targetTok: '~50 tok', pak: '92.8% P@K' },
    { id: 'adaptive_sliding_window', name: 'Adaptive Overlap Sliding Window', desc: 'Entropy-guided dynamic windowing', targetTok: '~40 tok', pak: '91.4% P@K' },
  ];

  return (
    <div id="chunking" className="app-card p-5 sm:p-6 transition-all">
      {/* Header with Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--theme-border-subtle)] pb-3 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Layers className="w-4 h-4 text-[var(--theme-accent-primary)]" />
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-[var(--theme-text-title)]">
            Engineered Chunking Architecture
          </h3>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-black transition-all cursor-pointer border ${
              activeTab === 'inspector'
                ? 'app-btn-primary'
                : 'app-card-subtle'
            }`}
          >
            Chunk Inspector
          </button>
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-1.5 rounded-full text-xs font-mono font-black transition-all cursor-pointer border ${
              activeTab === 'matrix'
                ? 'app-btn-primary'
                : 'app-card-subtle'
            }`}
          >
            Strategy Matrix
          </button>
        </div>
      </div>

      {/* 4 Strategy Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 mb-4">
        {strategies.map((strat) => {
          const isSelected = activeStrategy === strat.id;
          return (
            <button
              key={strat.id}
              onClick={() => onSelectStrategy(strat.id)}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'app-card-subtle border-[var(--theme-border)] shadow-md'
                  : 'app-card-subtle opacity-75 hover:opacity-100'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[var(--theme-accent-primary)]" />
                </div>
              )}
              <div className="font-mono text-xs font-black text-[var(--theme-text-title)] pr-5">{strat.name}</div>
              <div className="text-[10px] font-mono text-[var(--theme-text-muted)] mt-1 line-clamp-1">{strat.desc}</div>
              <div className="flex items-center justify-between text-[10px] font-mono mt-2 pt-2 border-t border-[var(--theme-border-subtle)]">
                <span className="font-black text-[var(--theme-accent-secondary)]">{strat.targetTok}</span>
                <span className="app-badge">{strat.pak}</span>
              </div>
            </button>
          );
        })}
      </div>

      {activeTab === 'inspector' ? (
        <div>
          {/* Document Picker */}
          <div className="mb-3 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="text-[var(--theme-text-muted)] font-bold">Test Passage:</span>
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="app-card-subtle text-[var(--theme-text-title)] font-black px-3 py-1.5 text-xs font-mono focus:outline-none"
              >
                {MSMARCO_XI_DATASET.map((d) => (
                  <option key={d.id} value={d.id}>
                    [{d.language.toUpperCase()}] {d.title} ({d.domain})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] font-mono text-[var(--theme-text-muted)] flex items-center space-x-3">
              <span>Generated Chunks: <strong className="text-[var(--theme-text-title)]">{currentChunks.length}</strong></span>
              <span>Total Tokens: <strong className="text-[var(--theme-accent-secondary)]">{currentChunks.reduce((a, b) => a + b.metadata.tokenCount, 0)}</strong></span>
              <span>Avg Cohesion: <strong className="text-[var(--theme-text-title)]">{(currentChunks.reduce((a, b) => a + b.metadata.cohesionScore, 0) / (currentChunks.length || 1)).toFixed(2)}</strong></span>
            </div>
          </div>

          {/* Rendered Chunks Stream */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {currentChunks.map((chunk, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl app-card-subtle text-xs"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-[var(--theme-text-muted)] mb-1.5">
                  <span className="font-black text-[var(--theme-text-title)]">Chunk #{idx + 1} ({chunk.id})</span>
                  <span className="font-black text-[var(--theme-accent-secondary)]">~{chunk.metadata.tokenCount} tok</span>
                </div>
                <p className="text-[var(--theme-text-body)] font-sans leading-relaxed text-xs">{chunk.text}</p>
                {chunk.parentContext && (
                  <div className="mt-2 pt-2 border-t border-[var(--theme-border-subtle)] text-[10px] font-mono text-[var(--theme-text-muted)]">
                    <span className="font-black text-[var(--theme-text-title)]">Parent Context Link:</span> {chunk.parentContext.slice(0, 120)}...
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Strategy Matrix Comparison View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {comparisonResults.map((res) => (
            <div key={res.strategyId} className="app-card-subtle p-4 flex flex-col justify-between">
              <div>
                <div className="font-mono text-xs font-black text-[var(--theme-text-title)]">{res.config.name}</div>
                <div className="text-[10px] font-mono text-[var(--theme-text-muted)] mt-1">{res.config.description}</div>
              </div>
              <div className="space-y-1.5 mt-3 pt-3 border-t border-[var(--theme-border-subtle)] text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-[var(--theme-text-muted)]">Chunks:</span>
                  <span className="font-black text-[var(--theme-text-title)]">{res.chunkCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--theme-text-muted)]">Avg Tokens:</span>
                  <span className="font-black text-[var(--theme-accent-secondary)]">{res.avgTokensPerChunk}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--theme-text-muted)]">Cohesion Score:</span>
                  <span className="font-black text-[var(--theme-text-title)]">{res.avgCohesion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--theme-text-muted)]">Index Latency:</span>
                  <span className="font-bold text-[var(--theme-text-title)]">{res.benchmarkTimeMs} ms</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
