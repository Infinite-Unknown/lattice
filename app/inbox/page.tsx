import InboxClient from './InboxClient';

export default function InboxPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-2 font-medium">
          Decisions queue · Your AI proposals
        </div>
        <h1 className="text-2xl font-semibold mb-1">What needs your decision today</h1>
        <p className="text-neutral-400 max-w-3xl">
          Per-relationship <span className="text-emerald-300">Stewards</span> propose next actions for
          individual linkages. The graph-wide <span className="text-amber-300">Cartographer</span> surfaces
          structural gaps in the whole ecosystem. Nothing executes without your approval —
          every proposal cites the outcomes it reasoned from.
        </p>
      </div>
      <InboxClient />
    </div>
  );
}
