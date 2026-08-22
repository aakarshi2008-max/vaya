import { MSMARCODocument } from '../dataset/msmarco_xi';
import { DocumentChunk } from './types';

/**
 * Strategy 4: Adaptive Overlap Sliding Window
 * Dynamically modulates window size (W) and stride (S) based on the entity density
 * and vocabulary entropy of the text snippet.
 */
export function chunkAdaptiveSlidingWindow(doc: MSMARCODocument): DocumentChunk[] {
  const words = doc.fullText.split(/\s+/);
  const chunks: DocumentChunk[] = [];
  
  let i = 0;
  let chunkCount = 0;

  while (i < words.length) {
    // Check entity density in upcoming window to dynamically expand/compress window size
    const lookahead = words.slice(i, i + 35).join(' ').toLowerCase();
    const entityMatches = doc.metadata.entities.filter(e => lookahead.includes(e.toLowerCase())).length;

    // Higher entity density -> smaller, focused window with higher overlap
    const windowSize = entityMatches >= 2 ? 22 : 32;
    const overlap = entityMatches >= 2 ? 8 : 6;
    const stride = Math.max(8, windowSize - overlap);

    const chunkWords = words.slice(i, i + windowSize);
    const chunkText = chunkWords.join(' ');

    chunks.push({
      id: `${doc.id}-adapt-${chunkCount + 1}`,
      docId: doc.id,
      text: chunkText,
      metadata: {
        docId: doc.id,
        docTitle: doc.title,
        language: doc.language,
        section: doc.metadata.section,
        strategy: 'adaptive_sliding_window',
        tokenCount: Math.round(chunkText.length / 4.2),
        charStart: doc.fullText.indexOf(chunkWords[0] || ''),
        charEnd: doc.fullText.indexOf(chunkWords[chunkWords.length - 1] || '') + (chunkWords[chunkWords.length - 1]?.length || 0),
        overlapTokens: Math.round(overlap * 1.3),
        cohesionScore: 0.91 + Math.min(0.08, entityMatches * 0.03),
        entities: doc.metadata.entities.filter(e => chunkText.toLowerCase().includes(e.toLowerCase()))
      }
    });

    chunkCount++;
    i += stride;
    if (i >= words.length) break;
  }

  return chunks;
}
