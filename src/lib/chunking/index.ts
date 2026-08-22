import { MSMARCODocument, MSMARCO_XI_DATASET } from '../dataset/msmarco_xi';
import { ChunkingStrategyId, DocumentChunk, STRATEGY_CONFIGS } from './types';
import { chunkSemanticBoundary } from './semantic';
import { chunkHierarchical } from './hierarchical';
import { chunkMetadataAware } from './metadata_aware';
import { chunkAdaptiveSlidingWindow } from './adaptive_sliding';

export * from './types';
export * from './semantic';
export * from './hierarchical';
export * from './metadata_aware';
export * from './adaptive_sliding';

/**
 * Executes a selected chunking strategy on a document or entire corpus
 */
export function executeChunking(
  doc: MSMARCODocument, 
  strategy: ChunkingStrategyId
): DocumentChunk[] {
  switch (strategy) {
    case 'semantic_boundary':
      return chunkSemanticBoundary(doc);
    case 'hierarchical_parent_child':
      return chunkHierarchical(doc);
    case 'metadata_aware':
      return chunkMetadataAware(doc);
    case 'adaptive_sliding_window':
      return chunkAdaptiveSlidingWindow(doc);
    default:
      return chunkSemanticBoundary(doc);
  }
}

/**
 * Chunks the entire MSMARCO-XI dataset with a given strategy
 */
export function chunkDataset(
  docs: MSMARCODocument[] = MSMARCO_XI_DATASET,
  strategy: ChunkingStrategyId = 'semantic_boundary'
): DocumentChunk[] {
  const allChunks: DocumentChunk[] = [];
  for (const doc of docs) {
    allChunks.push(...executeChunking(doc, strategy));
  }
  return allChunks;
}

/**
 * Runs a cross-strategy diagnostic comparison on a sample document
 */
export function compareChunkingStrategies(doc: MSMARCODocument) {
  const strategies: ChunkingStrategyId[] = [
    'semantic_boundary',
    'hierarchical_parent_child',
    'metadata_aware',
    'adaptive_sliding_window'
  ];

  return strategies.map(stratId => {
    const startTime = performance.now();
    const chunks = executeChunking(doc, stratId);
    const timeMs = Number((performance.now() - startTime).toFixed(2));
    const totalTokens = chunks.reduce((acc, c) => acc + c.metadata.tokenCount, 0);
    const avgTokens = Math.round(totalTokens / (chunks.length || 1));
    const avgCohesion = Number((chunks.reduce((acc, c) => acc + c.metadata.cohesionScore, 0) / (chunks.length || 1)).toFixed(2));

    return {
      strategyId: stratId,
      config: STRATEGY_CONFIGS[stratId],
      chunkCount: chunks.length,
      totalTokens,
      avgTokensPerChunk: avgTokens,
      avgCohesion,
      benchmarkTimeMs: timeMs,
      sampleChunks: chunks
    };
  });
}
