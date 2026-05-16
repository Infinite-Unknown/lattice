import { describe, it, expect } from 'vitest';
import { StewardActionSchema, CartographerGapSchema } from '@/lib/schemas';

describe('StewardActionSchema', () => {
  it('accepts a valid steward action', () => {
    const ok = StewardActionSchema.safeParse({
      action: 'propose-session',
      reasoning: 'X because Y',
      citations: ['outcome:abc', 'profile:m1.deals'],
      confidence: 0.82,
    });
    expect(ok.success).toBe(true);
  });

  it('rejects invalid action enum', () => {
    const bad = StewardActionSchema.safeParse({
      action: 'magic',
      reasoning: 'x', citations: ['outcome:abc'], confidence: 0.5,
    });
    expect(bad.success).toBe(false);
  });

  it('rejects missing citations', () => {
    const bad = StewardActionSchema.safeParse({
      action: 'hold', reasoning: 'x', citations: [], confidence: 0.5,
    });
    expect(bad.success).toBe(false);
  });

  it('rejects confidence > 1', () => {
    const bad = StewardActionSchema.safeParse({
      action: 'hold', reasoning: 'x', citations: ['outcome:a'], confidence: 1.4,
    });
    expect(bad.success).toBe(false);
  });
});

describe('CartographerGapSchema', () => {
  it('accepts a valid gap', () => {
    const ok = CartographerGapSchema.safeParse({
      gap_type: 'missing_expertise',
      candidate_parties: ['a1', 'a2'],
      reasoning: 'because',
      citations: ['actor:a1', 'metric:expertise_coverage'],
      expected_impact: 'unlocks 4 founders',
      confidence: 0.9,
    });
    expect(ok.success).toBe(true);
  });

  it('rejects unknown gap_type', () => {
    const bad = CartographerGapSchema.safeParse({
      gap_type: 'mystery',
      candidate_parties: [], reasoning: '', citations: ['x'],
      expected_impact: '', confidence: 0.5,
    });
    expect(bad.success).toBe(false);
  });
});
