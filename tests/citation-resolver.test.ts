import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCitations } from '@/lib/agents/citation-resolver';

vi.mock('@/lib/data/actors', () => ({
  getActor: vi.fn(async (id: string) =>
    id === 'a1' ? { id: 'a1', name: 'X', profile: { bio: 'b', deals: ['d1'] } } : null,
  ),
}));
vi.mock('@/lib/data/outcomes', () => ({
  getOutcome: vi.fn(async (id: string) => (id === 'o1' ? { id: 'o1' } : null)),
}));

const VALID_METRICS = new Set(['expertise_coverage', 'capacity_utilization', 'dormancy_days']);

describe('validateCitations', () => {
  beforeEach(() => vi.clearAllMocks());

  it('accepts a valid outcome citation', async () => {
    const r = await validateCitations(['outcome:o1'], VALID_METRICS);
    expect(r.ok).toBe(true);
  });
  it('rejects an unknown outcome', async () => {
    const r = await validateCitations(['outcome:does-not-exist'], VALID_METRICS);
    expect(r.ok).toBe(false);
    expect(r.invalid).toContain('outcome:does-not-exist');
  });
  it('accepts a valid profile field', async () => {
    const r = await validateCitations(['profile:a1.bio'], VALID_METRICS);
    expect(r.ok).toBe(true);
  });
  it('rejects a missing profile field', async () => {
    const r = await validateCitations(['profile:a1.salary'], VALID_METRICS);
    expect(r.ok).toBe(false);
  });
  it('accepts a known metric', async () => {
    const r = await validateCitations(['metric:dormancy_days'], VALID_METRICS);
    expect(r.ok).toBe(true);
  });
  it('rejects an unknown metric', async () => {
    const r = await validateCitations(['metric:made_up'], VALID_METRICS);
    expect(r.ok).toBe(false);
  });
  it('rejects malformed citation', async () => {
    const r = await validateCitations(['banana'], VALID_METRICS);
    expect(r.ok).toBe(false);
  });
});
