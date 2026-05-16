import GraphClient from './GraphClient';

export default function GraphPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2 font-medium">
          View · Live ecosystem graph
        </div>
        <h1 className="text-2xl font-semibold mb-1">Your ecosystem at a glance</h1>
        <p className="text-neutral-400 max-w-3xl">
          Every node is an actor (mentor, company, programme, partner). Every line is an
          <span className="text-emerald-300"> autonomous AI Steward</span> that runs that relationship.
          Click any edge to see its memory, run a tick, or edit its policy.
          Orange edges are <span className="text-amber-400">Cartographer proposals</span> awaiting your approval.
        </p>
      </div>
      <GraphClient />
    </div>
  );
}
