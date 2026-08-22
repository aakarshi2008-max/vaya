import React, { useState } from 'react';
import { X, Play, Download, BarChart3, CheckCircle2, AlertTriangle, RefreshCw, Layers, Heart } from 'lucide-react';
import { runComprehensiveBenchmark, BenchmarkRunReport } from '../lib/analytics/latency_tracker';
import { ChunkingStrategyId, STRATEGY_CONFIGS } from '../lib/chunking/types';

interface BenchmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStrategy: ChunkingStrategyId;
}

export const BenchmarkModal: React.FC<BenchmarkModalProps> = ({
  isOpen,
  onClose,
  activeStrategy
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [report, setReport] = useState<BenchmarkRunReport | null>(null);

  if (!isOpen) return null;

  const handleStartBenchmark = async () => {
    setIsRunning(true);
    setProgress(0);
    try {
      const res = await runComprehensiveBenchmark(activeStrategy, (current, total) => {
        setProgress(Math.round((current / total) * 100));
      });
      setReport(res);
    } catch (err) {
      console.error('Benchmark run error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleExportJSON = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `julie_hhgoa2026_latency_benchmark_${activeStrategy}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white border-2 border-pink-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-pink-100 bg-[#fff5f9]">
          <div className="flex items-center space-x-2.5">
            <Heart className="w-5 h-5 fill-[#ff007f] text-[#ff007f]" />
            <div>
              <h2 className="text-base font-mono font-black text-[#2b0914] uppercase tracking-wider">
                HH Goa 2026 Latency Analytics Suite
              </h2>
              <p className="text-xs font-mono text-[#7d3c59]">
                P50 / P70 / P100 Multi-Query Benchmark Evaluator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#7d3c59] hover:text-[#ff007f] hover:bg-pink-100 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-mono text-xs text-[#2b0914]">
          {/* Top Info Banner */}
          <div className="p-4 rounded-2xl bg-[#fff5f9] border border-pink-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-[#2b0914] font-black mb-1">
                Active Benchmark Target: <span className="text-[#ff007f]">{STRATEGY_CONFIGS[activeStrategy].name}</span>
              </div>
              <div className="text-[#7d3c59] text-[11px]">
                Evaluates 12+ multilingual, technical, factual, and adversarial queries against `ai4bharat/MSMARCO-XI`.
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleStartBenchmark}
                disabled={isRunning}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#ff007f] to-[#ff70a6] text-white font-black flex items-center space-x-2 hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer shadow-md"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Running ({progress}%)...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>Run Benchmark Suite</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Progress Bar */}
          {isRunning && (
            <div className="w-full bg-pink-100 h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff007f] to-[#ff70a6] transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Results Summary Cards */}
          {report && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#fff5f9] border border-pink-200 rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-[#7d3c59] uppercase font-bold">P50 (Median)</div>
                  <div className="text-xl font-black text-[#ff007f] mt-1">{report.p50} ms</div>
                </div>
                <div className="bg-[#fff5f9] border border-pink-200 rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-[#7d3c59] uppercase font-bold">P70 (70th %ile)</div>
                  <div className="text-xl font-black text-[#ff2a85] mt-1">{report.p70} ms</div>
                </div>
                <div className="bg-[#fff5f9] border border-pink-200 rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-[#7d3c59] uppercase font-bold">P100 (Max Worst)</div>
                  <div className="text-xl font-black text-rose-600 mt-1">{report.p100} ms</div>
                </div>
                <div className="bg-[#fff5f9] border border-pink-200 rounded-2xl p-4 text-center">
                  <div className="text-[10px] text-[#7d3c59] uppercase font-bold">&lt; 200ms Compliance</div>
                  <div className="text-xl font-black text-emerald-600 mt-1">{report.under200msRatio}%</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end">
                <button
                  onClick={handleExportJSON}
                  className="px-4 py-2 rounded-xl bg-white border border-pink-300 text-[#ff007f] font-bold flex items-center space-x-1.5 hover:bg-pink-50 transition-all cursor-pointer shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Benchmark JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
