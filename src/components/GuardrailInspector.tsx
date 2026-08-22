import React from 'react';
import { ShieldCheck, ShieldAlert, Shield, CheckCircle, XCircle, Activity } from 'lucide-react';
import { FullGuardrailReport } from '../lib/guardrails/evaluator';

interface GuardrailInspectorProps {
  guardrailReport?: FullGuardrailReport;
}

export const GuardrailInspector: React.FC<GuardrailInspectorProps> = ({
  guardrailReport = {
    inputSafety: { passed: true, type: 'input_safety', confidenceScore: 0.99, suggestedAction: 'proceed', latencyMs: 0.3 },
    domainRelevance: { passed: true, type: 'domain_relevance', confidenceScore: 0.95, suggestedAction: 'proceed', latencyMs: 0.2 },
    outputFaithfulness: { passed: true, type: 'output_faithfulness', confidenceScore: 1.0, suggestedAction: 'proceed', latencyMs: 0.4 },
    isRefusal: false,
    totalGuardrailLatencyMs: 0.9,
  },
}) => {
  const isAllPassed = !guardrailReport.isRefusal;
  const faithfulnessScore = guardrailReport.outputFaithfulness?.confidenceScore ?? 1.0;

  return (
    <div className="app-card p-5 sm:p-6 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--theme-border-subtle)] pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-[var(--theme-accent-primary)]" />
          <h3 className="font-mono text-xs font-black uppercase tracking-wider text-[var(--theme-text-title)]">
            Guardrails &amp; Faithfulness Inspector
          </h3>
        </div>
        <span className="text-[11px] font-mono font-bold text-[var(--theme-text-muted)]">
          Latency: {(guardrailReport.totalGuardrailLatencyMs || 0.9).toFixed(1)} ms
        </span>
      </div>

      {/* Main Status Banner */}
      <div
        className={`mb-4 rounded-xl p-4 border flex items-center justify-between transition-all ${
          isAllPassed
            ? 'app-card-subtle'
            : 'bg-rose-50 border-rose-400 text-rose-800'
        }`}
      >
        <div className="flex items-center space-x-3">
          {isAllPassed ? (
            <ShieldCheck className="w-5 h-5 text-[var(--theme-accent-primary)]" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          )}
          <div>
            <div className="text-xs font-mono font-black uppercase tracking-wider text-[var(--theme-text-title)]">
              {isAllPassed ? 'ALL GUARDRAILS PASSED (GROUNDED)' : 'GUARDRAIL REFUSAL ARMED (SAFE)'}
            </div>
            <div className="text-[11px] font-mono text-[var(--theme-text-muted)]">
              {isAllPassed
                ? 'Query in MSMARCO-XI scope · Grounded in verifiable evidence'
                : `Refusal Code: ${guardrailReport.refusalReason || 'Off-topic or ungrounded'}`}
            </div>
          </div>
        </div>
        <span className="app-badge">
          {isAllPassed ? 'PASSED' : 'BLOCKED'}
        </span>
      </div>

      {/* 3 Checkpoint Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-4">
        {/* Checkpoint 1: Input Sanitization */}
        <div className="app-card-subtle p-3.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--theme-text-muted)] mb-1">
            <span>INPUT SANITIZATION</span>
            <span>{guardrailReport.inputSafety.latencyMs.toFixed(1)} ms</span>
          </div>
          <div className="flex items-center space-x-1.5 mb-1">
            {guardrailReport.inputSafety.passed ? (
              <CheckCircle className="w-4 h-4 text-[var(--theme-accent-primary)]" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
            <span className="font-mono text-xs font-black text-[var(--theme-text-title)]">Input &amp; Adversarial</span>
          </div>
          <p className="text-[10px] font-mono text-[var(--theme-text-muted)]">
            {guardrailReport.inputSafety.passed
              ? 'Prompt injection & safety checks passed'
              : 'Adversarial payload blocked'}
          </p>
        </div>

        {/* Checkpoint 2: Scope Validation */}
        <div className="app-card-subtle p-3.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--theme-text-muted)] mb-1">
            <span>SCOPE VALIDATION</span>
            <span>{guardrailReport.domainRelevance.latencyMs.toFixed(1)} ms</span>
          </div>
          <div className="flex items-center space-x-1.5 mb-1">
            {guardrailReport.domainRelevance.passed ? (
              <CheckCircle className="w-4 h-4 text-[var(--theme-accent-primary)]" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
            <span className="font-mono text-xs font-black text-[var(--theme-text-title)]">Domain Relevance</span>
          </div>
          <p className="text-[10px] font-mono text-[var(--theme-text-muted)]">
            {guardrailReport.domainRelevance.passed
              ? 'Matched indexed MSMARCO-XI topics'
              : 'Off-topic query safely refused'}
          </p>
        </div>

        {/* Checkpoint 3: Hallucination Prevention */}
        <div className="app-card-subtle p-3.5">
          <div className="flex items-center justify-between text-[10px] font-mono text-[var(--theme-text-muted)] mb-1">
            <span>HALLUCINATION CHECK</span>
            <span>{(guardrailReport.outputFaithfulness?.latencyMs || 0.4).toFixed(1)} ms</span>
          </div>
          <div className="flex items-center space-x-1.5 mb-1">
            {isAllPassed ? (
              <CheckCircle className="w-4 h-4 text-[var(--theme-accent-primary)]" />
            ) : (
              <XCircle className="w-4 h-4 text-rose-500" />
            )}
            <span className="font-mono text-xs font-black text-[var(--theme-text-title)]">Faithful Grounding</span>
          </div>
          <p className="text-[10px] font-mono text-[var(--theme-text-muted)]">
            {isAllPassed
              ? 'Answer grounded in retrieved context'
              : 'Ungrounded answers halted'}
          </p>
        </div>
      </div>

      {/* Faithfulness Grounding Progress Bar */}
      <div className="app-card-subtle p-3.5">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="font-bold flex items-center gap-1.5 text-[var(--theme-text-title)]">
            <Activity className="w-3.5 h-3.5 text-[var(--theme-accent-primary)]" /> Grounding Faithfulness Score:
          </span>
          <span className="font-black font-mono text-[var(--theme-text-title)]">
            {Math.round(faithfulnessScore * 100)}% (Threshold: &gt;30%)
          </span>
        </div>
        <div className="w-full bg-[var(--theme-meter-track)] h-2.5 rounded-full overflow-hidden border border-[var(--theme-border-subtle)]">
          <div
            className="h-full bg-[var(--theme-meter-fill)] transition-all duration-500 rounded-full"
            style={{ width: `${Math.min(100, faithfulnessScore * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};
