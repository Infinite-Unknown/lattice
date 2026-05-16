'use client';

export type ChipCitation = {
  kind: 'actor' | 'outcome' | 'profile' | 'metric' | 'unknown';
  label: string;
  id: string;
  raw: string;
};

// Bold Typography palette — single accent. Each citation kind gets a
// border style instead of a colored fill so the page palette stays clean.
const KIND_BORDER: Record<ChipCitation['kind'], string> = {
  actor:   'border-foreground',
  outcome: 'border-accent',
  profile: 'border-muted-foreground',
  metric:  'border-foreground border-dashed',
  unknown: 'border-border',
};

const KIND_LABEL: Record<ChipCitation['kind'], string> = {
  actor:   'Entity',  // internal discriminator stays 'actor' but UX label is 'Entity'
  outcome: 'Outcome',
  profile: 'Profile',
  metric:  'Metric',
  unknown: 'Cite',
};

const KIND_LABEL_COLOR: Record<ChipCitation['kind'], string> = {
  actor:   'text-foreground',
  outcome: 'text-accent',
  profile: 'text-muted-foreground',
  metric:  'text-foreground',
  unknown: 'text-muted-foreground',
};

export default function CitationChip({ citation }: { citation: ChipCitation }) {
  return (
    <span
      title={citation.raw}
      className={`inline-flex items-center gap-2 px-2.5 py-1 border bg-card whitespace-nowrap ${KIND_BORDER[citation.kind]}`}
    >
      <span className={`font-mono text-[10px] uppercase tracking-widest ${KIND_LABEL_COLOR[citation.kind]}`}>
        {KIND_LABEL[citation.kind]}
      </span>
      <span className="font-sans text-xs text-foreground">{citation.label}</span>
    </span>
  );
}

export function CitationChipList({ citations }: { citations: ChipCitation[] }) {
  if (!citations || citations.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {citations.map(c => <CitationChip key={c.raw} citation={c} />)}
    </div>
  );
}
