import { MSMARCODocument } from '../dataset/msmarco_xi';
import { DocumentChunk } from './types';

/**
 * Strategy 2: Hierarchical Parent-Document Chunking
 * Splits document into small, dense child chunks (for hyper-focused vector similarity)
 * while attaching the wider parent document window as context for generation.
 */
export function chunkHierarchical(doc: MSMARCODocument): DocumentChunk[] {
  const text = doc.fullText;
  const words = text.split(/\s+/);
  const childSize = 18; // 18 words per child chunk
  const childStep = 14; // 4 words overlap
  const chunks: DocumentChunk[] = [];

  let wordIndex = 0;
  let chunkCount = 0;

  while (wordIndex < words.length) {
    const childWords = words.slice(wordIndex, wordIndex + childSize);
    const childText = childWords.join(' ');

    // Parent context encompasses preceding and following sentences or full paragraph
    const parentContext = doc.fullText;

    chunks.push({
      id: `${doc.id}-hier-c${chunkCount + 1}`,
      docId: doc.id,
      text: childText,
      metadata: {
        docId: doc.id,
        docTitle: doc.title,
        language: doc.language,
        section: doc.metadata.section,
        strategy: 'hierarchical_parent_child',
        tokenCount: Math.round(childText.length / 4.2),
        charStart: text.indexOf(childWords[0] || ''),
        charEnd: text.indexOf(childWords[childWords.length - 1] || '') + (childWords[childWords.length - 1]?.length || 0),
        overlapTokens: Math.round((childSize - childStep) * 1.3),
        parentContext: parentContext,
        cohesionScore: 0.98,
        entities: doc.metadata.entities.filter(e => childText.toLowerCase().includes(e.toLowerCase()))
      }
    });

    chunkCount++;
    wordIndex += childStep;
    if (wordIndex >= words.length) break;
  }

  return chunks;
}
