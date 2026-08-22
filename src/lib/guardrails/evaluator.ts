import { SearchResult } from '../vector_db';

export interface GuardrailCheckResult {
  passed: boolean;
  type: 'input_safety' | 'domain_relevance' | 'output_faithfulness' | 'hallucination_check';
  confidenceScore: number; // 0.0 to 1.0
  reason?: string;
  suggestedAction: 'proceed' | 'refuse' | 'retry_with_fallback';
  latencyMs: number;
}

export interface FullGuardrailReport {
  inputSafety: GuardrailCheckResult;
  domainRelevance: GuardrailCheckResult;
  outputFaithfulness?: GuardrailCheckResult;
  isRefusal: boolean;
  refusalReason?: string;
  totalGuardrailLatencyMs: number;
}

const ADVERSARIAL_KEYWORDS = [
  'bypass', 'hack', 'steal', 'bomb', 'exploit', 'jailbreak',
  'override rules', 'system prompt', 'ignore previous instructions',
  'malware', 'ddos', 'stolen credentials', 'password dump'
];

const OFF_TOPIC_KEYWORDS = [
  'lasagna', 'bolognese', 'cooking recipe', 'crypto token pump',
  'horoscope', 'zodiac', 'astrology prediction', 'celebrity gossip',
  'premier league score', 'hollywood actor'
];

/**
 * 1. Input Guardrail: Evaluates query safety and adversarial intent
 */
export function evaluateInputSafety(query: string): GuardrailCheckResult {
  const startTime = performance.now();
  const lower = query.toLowerCase();

  for (const pattern of ADVERSARIAL_KEYWORDS) {
    if (lower.includes(pattern)) {
      return {
        passed: false,
        type: 'input_safety',
        confidenceScore: 0.98,
        reason: `Violates Safety Guardrail: Malicious / adversarial keyword detected (${pattern})`,
        suggestedAction: 'refuse',
        latencyMs: Number((performance.now() - startTime).toFixed(2))
      };
    }
  }

  // Check character anomaly / prompt injection delimiters
  if (query.includes('```system') || query.includes('<script>') || query.length > 500) {
    return {
      passed: false,
      type: 'input_safety',
      confidenceScore: 0.95,
      reason: 'Violates Safety Guardrail: Injection delimiter or excessive payload',
      suggestedAction: 'refuse',
      latencyMs: Number((performance.now() - startTime).toFixed(2))
    };
  }

  return {
    passed: true,
    type: 'input_safety',
    confidenceScore: 1.0,
    suggestedAction: 'proceed',
    latencyMs: Number((performance.now() - startTime).toFixed(2))
  };
}

/**
 * 2. Domain Guardrail: Evaluates if query is within the MSMARCO-XI index domain
 */
export function evaluateDomainRelevance(query: string, topResults: SearchResult[]): GuardrailCheckResult {
  const startTime = performance.now();
  const lower = query.toLowerCase();

  for (const off of OFF_TOPIC_KEYWORDS) {
    if (lower.includes(off)) {
      return {
        passed: false,
        type: 'domain_relevance',
        confidenceScore: 0.92,
        reason: `Out-of-Domain Guardrail: Query references unsupported domain (${off})`,
        suggestedAction: 'refuse',
        latencyMs: Number((performance.now() - startTime).toFixed(2))
      };
    }
  }

  // If top retrieved chunk score is excessively low (< 0.28), flag as out of domain
  const maxScore = topResults.length > 0 ? topResults[0].score : 0;
  if (maxScore < 0.28) {
    return {
      passed: false,
      type: 'domain_relevance',
      confidenceScore: Number((1 - maxScore).toFixed(2)),
      reason: `Out-of-Domain Guardrail: Low semantic similarity (${maxScore}) against MSMARCO-XI index`,
      suggestedAction: 'refuse',
      latencyMs: Number((performance.now() - startTime).toFixed(2))
    };
  }

  return {
    passed: true,
    type: 'domain_relevance',
    confidenceScore: Number(maxScore.toFixed(2)),
    suggestedAction: 'proceed',
    latencyMs: Number((performance.now() - startTime).toFixed(2))
  };
}

/**
 * 3. Output Faithfulness / Hallucination Guardrail
 * Verifies that the generated answer is strictly grounded in the retrieved chunks.
 */
export function evaluateOutputFaithfulness(answer: string, contextChunks: SearchResult[]): GuardrailCheckResult {
  const startTime = performance.now();
  if (contextChunks.length === 0) {
    return {
      passed: false,
      type: 'output_faithfulness',
      confidenceScore: 0.0,
      reason: 'No context passages available for grounding verification',
      suggestedAction: 'refuse',
      latencyMs: Number((performance.now() - startTime).toFixed(2))
    };
  }

  const combinedContext = contextChunks.map(r => r.chunk.text.toLowerCase()).join(' ');
  const answerWords = answer.toLowerCase().replace(/[^a-z0-9\u0900-\u0D7F\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  
  if (answerWords.length === 0) {
    return {
      passed: true,
      type: 'output_faithfulness',
      confidenceScore: 0.9,
      suggestedAction: 'proceed',
      latencyMs: Number((performance.now() - startTime).toFixed(2))
    };
  }

  let groundedWordCount = 0;
  for (const word of answerWords) {
    if (combinedContext.includes(word)) {
      groundedWordCount++;
    }
  }

  const groundingScore = Number((groundedWordCount / answerWords.length).toFixed(2));
  const isFaithful = groundingScore >= 0.55; // Threshold 55% lexical-semantic entity overlap

  return {
    passed: isFaithful,
    type: 'output_faithfulness',
    confidenceScore: groundingScore,
    reason: isFaithful 
      ? `Grounded with ${Math.round(groundingScore * 100)}% context citation faithfulness`
      : `Potential Hallucination: Low grounding score (${Math.round(groundingScore * 100)}% < 55%)`,
    suggestedAction: isFaithful ? 'proceed' : 'refuse',
    latencyMs: Number((performance.now() - startTime).toFixed(2))
  };
}
