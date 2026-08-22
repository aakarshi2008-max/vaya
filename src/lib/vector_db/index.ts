import { DocumentChunk, ChunkingStrategyId } from '../chunking/types';
import { MSMARCO_XI_DATASET } from '../dataset/msmarco_xi';
import { chunkDataset } from '../chunking';

export interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  denseScore: number;
  sparseScore: number;
  rank: number;
  retrievalLatencyMs: number;
}

/**
 * Deterministic fast embedding generator with 64-dimensional dense semantic hashing
 * Optimized for sub-millisecond in-memory vector calculations.
 */
export function generateEmbedding(text: string): number[] {
  const dim = 64;
  const vec = new Array(dim).fill(0);
  const clean = text.toLowerCase().replace(/[^a-z0-9\u0900-\u0D7F\s]/g, ' ');
  const words = clean.split(/\s+/).filter(w => w.length > 0);

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    let hash = 0;
    for (let c = 0; c < word.length; c++) {
      hash = (hash * 31 + word.charCodeAt(c)) & 0xffffffff;
    }
    
    // Distribute hash energy across 4 harmonic slots
    for (let slot = 0; slot < 4; slot++) {
      const idx = Math.abs((hash ^ (slot * 0x5bd1e995)) % dim);
      const sign = (hash & (1 << slot)) ? 1 : -1;
      vec[idx] += sign * (1 / Math.sqrt(i + 1));
    }
  }

  // L2 Normalization
  let norm = 0;
  for (let i = 0; i < dim; i++) norm += vec[i] * vec[i];
  norm = Math.sqrt(norm);
  if (norm > 0) {
    for (let i = 0; i < dim; i++) vec[i] /= norm;
  }
  return vec;
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
  }
  return Math.max(0, Math.min(1, (dot + 1) / 2)); // Normalized to 0-1
}

/**
 * High-Speed In-Memory Hybrid Vector Engine (Dense + BM25-lite)
 */
export class InMemoryVectorDB {
  private chunks: DocumentChunk[] = [];
  private embeddings: number[][] = [];
  private activeStrategy: ChunkingStrategyId = 'semantic_boundary';
  private isIndexed: boolean = false;

  constructor(strategy: ChunkingStrategyId = 'semantic_boundary') {
    this.activeStrategy = strategy;
    this.rebuildIndex(strategy);
  }

  public rebuildIndex(strategy: ChunkingStrategyId) {
    this.activeStrategy = strategy;
    this.chunks = chunkDataset(MSMARCO_XI_DATASET, strategy);
    this.embeddings = this.chunks.map(chunk => {
      const textToEmbed = `${chunk.metadata.docTitle} ${chunk.metadata.section} ${chunk.text}`;
      return generateEmbedding(textToEmbed);
    });
    this.isIndexed = true;
  }

  public getChunkCount(): number {
    return this.chunks.length;
  }

  public getActiveStrategy(): ChunkingStrategyId {
    return this.activeStrategy;
  }

  public search(query: string, topK: number = 3): { results: SearchResult[]; latencyMs: number } {
    const startTime = performance.now();
    if (!this.isIndexed || this.chunks.length === 0) {
      this.rebuildIndex(this.activeStrategy);
    }

    const queryEmbedding = generateEmbedding(query);
    const queryTokens = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

    const scored: { chunk: DocumentChunk; denseScore: number; sparseScore: number; combinedScore: number }[] = [];

    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      const dense = cosineSimilarity(queryEmbedding, this.embeddings[i]);
      
      // Sparse BM25-lite overlap score
      const chunkLower = chunk.text.toLowerCase();
      let matchCount = 0;
      for (const token of queryTokens) {
        if (chunkLower.includes(token)) matchCount++;
      }
      const sparse = queryTokens.length > 0 ? matchCount / queryTokens.length : 0;

      // Hybrid score (Dense 70% + Sparse 30%)
      const combinedScore = (dense * 0.7) + (sparse * 0.3);

      scored.push({
        chunk,
        denseScore: dense,
        sparseScore: sparse,
        combinedScore
      });
    }

    // Sort by combined score descending
    scored.sort((a, b) => b.combinedScore - a.combinedScore);

    const totalLatency = Number((performance.now() - startTime).toFixed(2));

    const results: SearchResult[] = scored.slice(0, topK).map((item, idx) => ({
      chunk: item.chunk,
      score: Number(item.combinedScore.toFixed(3)),
      denseScore: Number(item.denseScore.toFixed(3)),
      sparseScore: Number(item.sparseScore.toFixed(3)),
      rank: idx + 1,
      retrievalLatencyMs: totalLatency
    }));

    return {
      results,
      latencyMs: totalLatency
    };
  }
}

// Global Singleton for low-latency client/server RAG execution
export const globalVectorDB = new InMemoryVectorDB('semantic_boundary');
