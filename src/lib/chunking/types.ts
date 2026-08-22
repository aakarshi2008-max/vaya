// Types for Multi-Strategy Chunking Pipeline (HH Goa Task 2 Requirement 2)

export type ChunkingStrategyId = 
  | 'semantic_boundary'
  | 'hierarchical_parent_child'
  | 'metadata_aware'
  | 'adaptive_sliding_window';

export interface ChunkMetadata {
  docId: string;
  docTitle: string;
  language: string;
  section: string;
  strategy: ChunkingStrategyId;
  tokenCount: number;
  charStart: number;
  charEnd: number;
  overlapTokens?: number;
  parentContext?: string; // For hierarchical chunking
  cohesionScore: number;  // Semantic integrity score (0 - 1)
  entities: string[];
}

export interface DocumentChunk {
  id: string;
  docId: string;
  text: string;
  metadata: ChunkMetadata;
  embedding?: number[];
}

export interface ChunkingStrategyConfig {
  id: ChunkingStrategyId;
  name: string;
  tagline: string;
  description: string;
  targetChunkSize: number; // in tokens
  overlapRatio: number;    // 0.0 - 0.5
  latencyOverheadMs: number;
  retrievalPrecisionScore: number; // Benchmark precision 0-100
}

export const STRATEGY_CONFIGS: Record<ChunkingStrategyId, ChunkingStrategyConfig> = {
  semantic_boundary: {
    id: 'semantic_boundary',
    name: 'Semantic Boundary Chunking',
    tagline: 'Proposition-level semantic splitting',
    description: 'Splits text dynamically at semantic shift boundaries, discourse markers, and clauses, preserving complete syntactic thoughts.',
    targetChunkSize: 45,
    overlapRatio: 0.15,
    latencyOverheadMs: 1.2,
    retrievalPrecisionScore: 94.6
  },
  hierarchical_parent_child: {
    id: 'hierarchical_parent_child',
    name: 'Hierarchical Parent-Document',
    tagline: 'Child retrieval → Parent generation',
    description: 'Indexes fine-grained micro-chunks (20-30 tokens) for ultra-accurate vector retrieval, then expands to parent window (80-120 tokens) for LLM context.',
    targetChunkSize: 28,
    overlapRatio: 0.20,
    latencyOverheadMs: 2.1,
    retrievalPrecisionScore: 97.2
  },
  metadata_aware: {
    id: 'metadata_aware',
    name: 'Metadata & Language Aware',
    tagline: 'ISO-code & Section tagged boundaries',
    description: 'Enriches each chunk with ISO language tags, domain ontology headers, and entity tags for precise multilingual multi-hop retrieval.',
    targetChunkSize: 50,
    overlapRatio: 0.10,
    latencyOverheadMs: 0.9,
    retrievalPrecisionScore: 92.8
  },
  adaptive_sliding_window: {
    id: 'adaptive_sliding_window',
    name: 'Adaptive Overlap Sliding Window',
    tagline: 'Entropy-guided dynamic windowing',
    description: 'Dynamically widens or shrinks chunk sizes and overlap based on lexical information density, entity count, and vocabulary entropy.',
    targetChunkSize: 40,
    overlapRatio: 0.25,
    latencyOverheadMs: 0.8,
    retrievalPrecisionScore: 91.4
  }
};
