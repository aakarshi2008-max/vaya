import { BENCHMARK_QUERIES, BenchmarkQuery } from '../dataset/msmarco_xi';
import { globalHarness, RAGAnswerResponse } from '../harness/orchestrator';
import { ChunkingStrategyId } from '../chunking/types';

export interface PercentileStats {
  p50: number; // Median
  p70: number; // 70th Percentile
  p90: number; // 90th Percentile
  p99: number; // 99th Percentile
  p100: number; // Max Latency (Worst case)
  min: number;
  avg: number;
  totalRuns: number;
  under200msRatio: number; // Percentage meeting < 200ms
}

export interface BenchmarkRunReport {
  timestamp: string;
  strategy: ChunkingStrategyId;
  totalQueriesEvaluated: number;
  overallStats: PercentileStats;
  stageBreakdown: {
    stt: PercentileStats;
    retrieval: PercentileStats;
    generation: PercentileStats;
    guardrails: PercentileStats;
  };
  detailedRuns: {
    queryId: string;
    query: string;
    language: string;
    totalLatencyMs: number;
    targetMet: boolean;
    isRefusal: boolean;
  }[];
}

/**
 * Calculates accurate percentile distribution (P50, P70, P90, P99, P100)
 */
export function calculatePercentiles(values: number[]): PercentileStats {
  if (values.length === 0) {
    return { p50: 0, p70: 0, p90: 0, p99: 0, p100: 0, min: 0, avg: 0, totalRuns: 0, under200msRatio: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;

  const getP = (p: number) => {
    const index = Math.min(count - 1, Math.max(0, Math.ceil((p / 100) * count) - 1));
    return sorted[index];
  };

  const min = sorted[0];
  const max = sorted[count - 1];
  const avg = Number((sorted.reduce((a, b) => a + b, 0) / count).toFixed(2));
  const under200Count = sorted.filter(v => v <= 200).length;

  return {
    p50: Number(getP(50).toFixed(2)),
    p70: Number(getP(70).toFixed(2)),
    p90: Number(getP(90).toFixed(2)),
    p99: Number(getP(99).toFixed(2)),
    p100: Number(max.toFixed(2)),
    min: Number(min.toFixed(2)),
    avg,
    totalRuns: count,
    under200msRatio: Number(((under200Count / count) * 100).toFixed(1))
  };
}

/**
 * Automated benchmark test runner across MSMARCO-XI test suite
 */
export async function runComprehensiveBenchmark(
  strategy: ChunkingStrategyId = 'semantic_boundary',
  onProgress?: (current: number, total: number, latestResult: RAGAnswerResponse) => void
): Promise<BenchmarkRunReport> {
  const queries = BENCHMARK_QUERIES;
  const total = queries.length;
  const runs: { query: BenchmarkQuery; res: RAGAnswerResponse }[] = [];

  for (let i = 0; i < total; i++) {
    const q = queries[i];
    const res = await globalHarness.executePipeline({
      rawTextQuery: q.query,
      strategy: strategy
    });
    runs.push({ query: q, res });
    if (onProgress) onProgress(i + 1, total, res);
  }

  const totalLatencies = runs.map(r => r.res.telemetry.totalEndToEndLatencyMs);
  const sttLatencies = runs.map(r => r.res.telemetry.sttLatencyMs);
  const retrievalLatencies = runs.map(r => r.res.telemetry.retrievalLatencyMs);
  const genLatencies = runs.map(r => r.res.telemetry.generationLatencyMs);
  const guardrailLatencies = runs.map(r => r.res.guardrailReport.totalGuardrailLatencyMs);

  return {
    timestamp: new Date().toISOString(),
    strategy,
    totalQueriesEvaluated: total,
    overallStats: calculatePercentiles(totalLatencies),
    stageBreakdown: {
      stt: calculatePercentiles(sttLatencies),
      retrieval: calculatePercentiles(retrievalLatencies),
      generation: calculatePercentiles(genLatencies),
      guardrails: calculatePercentiles(guardrailLatencies)
    },
    detailedRuns: runs.map(r => ({
      queryId: r.query.id,
      query: r.query.query,
      language: r.query.language,
      totalLatencyMs: r.res.telemetry.totalEndToEndLatencyMs,
      targetMet: r.res.telemetry.targetMet,
      isRefusal: r.res.isRefusal
    }))
  };
}
