'use client';

export type ChipCitation = {
  kind: 'actor' | 'outcome' | 'profile' | 'metric' | 'unknown';
  label: string;
  id: string;
  raw: string;
};

const KIND_STYLE: Record<ChipCitation['kind'], string> = {
  actor:   'bg-blue-950/40 border-blue-800/60 text-blue-200',
  outcome: 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200',
  profile: 'bg-purple-950/40 border-purple-800/60 text-purple-200',
  metric:  'bg-amber-950/40 border-amber-800/60 text-amber-200',
  unknown: 'bg-neutral-900 border-neutral-700 text-neutral-300',
};

const KIND_LABEL: Record<ChipCitation['kind'], string> = {
  actor:   'Actor',
  outcome: 'Outcome',
  profile: 'Profile',
  metric:  'Metric',
  unknown: '',
};

export default function CitationChip({ citation }: { citation: ChipCitation }) {
  return (
    <span
      title={citation.raw}
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] border ${KIND_STYLE[citation.kind]} whitespace-nowrap`}
    >
      {KIND_LABEL[citation.kind] && (
        <span className="opacity-60">{KIND_LABEL[citation.kind]}</span>
      )}
      <span className="font-medium">{citation.label}</span>
    </span>
  );
}

export function CitationChipList({ citations }: { citations: ChipCitation[] }) {
  if (!citations || citations.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {citations.map(c => <CitationChip key={c.raw} citation={c} />)}
    </div>
  );
}
