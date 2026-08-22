import React, { useState } from 'react';
import { Cpu, RotateCcw, Shield, Terminal, ArrowRight, CheckCircle2, Copy, Check } from 'lucide-react';
import { HarnessState, ToolExecutionTrace } from '../lib/harness/orchestrator';

interface HarnessVisualizerProps {
  currentState: HarnessState;
  toolTraces: ToolExecutionTrace[];
  retryCount: number;
}

export const HarnessVisualizer: React.FC<HarnessVisualizerProps> = ({
  currentState,
  toolTraces,
  retryCount,
}) => {
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  const pipelineStages: { id: HarnessState; label: string; stepNo: string }[] = [
    { id: 'LISTENING', label: 'Voice In', stepNo: '01' },
    { id: 'TRANSCRIBING', label: 'STT Audio', stepNo: '02' },
    { id: 'INPUT_GUARDRAIL', label: 'In Guardrail', stepNo: '03' },
    { id: 'TOOL_CALLING', label: 'Intent Tool', stepNo: '04' },
    { id: 'RETRIEVING', label: 'Vector DB', stepNo: '05' },
    { id: 'GENERATING', label: 'Synthesis', stepNo: '06' },
    { id: 'OUTPUT_GUARDRAIL', label: 'Faithfulness', stepNo: '07' },
    { id: 'COMPLETED', label: 'Verified Out', stepNo: '08' },
  ];

  const copyTrace = (idx: number, trace: ToolExecutionTrace) => {
    navigator.clipboard.writeText(JSON.stringify(trace, null, 2));
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div id="harness" className="app-card p-5 sm:p-6 transition-all">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-[var(--theme-border-subtle)] pb-3 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-[var(--theme-accent-primary)]" />
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-[var(--theme-text-title)]">
            Model Harness &amp; Orchestration Engine
          </h3>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono">
          <span className="app-badge">
            Circuit: CLOSED
          </span>
          <span className="app-badge flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Retries: {retryCount} / 3
          </span>
        </div>
      </div>

      {/* Lifecycle Flow Timeline */}
      <div className="mb-4">
        <div className="text-[11px] font-mono font-black text-[var(--theme-text-muted)] uppercase tracking-wider mb-2.5">
          Harness State Machine Lifecycle
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
          {pipelineStages.map((stage) => {
            const isActive = currentState === stage.id;
            return (
              <div
                key={stage.id}
                className={`p-2.5 rounded-xl border text-center transition-all duration-150 ${
                  isActive
                    ? 'app-btn-primary scale-105 shadow-md'
                    : 'app-card-subtle'
                }`}
              >
                <div className="text-[10px] font-mono font-black opacity-80">
                  {stage.stepNo}
                </div>
                <div className="text-[11px] font-mono truncate mt-0.5 font-bold">{stage.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tool Execution Traces */}
      <div>
        <div className="flex items-center justify-between text-[11px] font-mono font-black text-[var(--theme-text-muted)] uppercase tracking-wider mb-2">
          <span>Active Tool Execution Traces</span>
          <span className="text-[var(--theme-accent-secondary)]">{toolTraces.length} Executed</span>
        </div>

        {toolTraces.length === 0 ? (
          <div className="p-4 rounded-xl app-card-subtle text-xs font-mono text-[var(--theme-text-muted)] text-center font-bold">
            No active tool traces recorded. Execute a voice or text query to view live harness traces.
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {toolTraces.map((trace, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl app-card-subtle text-xs font-mono flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <Terminal className="w-3.5 h-3.5 text-[var(--theme-accent-primary)]" />
                  <span className="font-black text-[var(--theme-text-title)]">{trace.toolName}()</span>
                  <span className="text-[var(--theme-text-muted)] text-[11px]">
                    Output: {JSON.stringify(trace.output).slice(0, 50)}...
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-black text-[var(--theme-accent-secondary)]">{trace.executionTimeMs.toFixed(2)} ms</span>
                  <span className="app-badge">
                    SUCCESS
                  </span>
                  <button
                    onClick={() => copyTrace(idx, trace)}
                    className="p-1.5 rounded-lg app-card-subtle text-[var(--theme-text-title)] transition-all cursor-pointer"
                    title="Copy JSON Trace"
                  >
                    {copiedIdx === idx ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
