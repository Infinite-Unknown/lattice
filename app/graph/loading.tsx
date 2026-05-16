import LatticeLoader from '../components/LatticeLoader';

export default function GraphLoading() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2 font-medium">
          View · Live ecosystem graph
        </div>
        <h1 className="text-2xl font-semibold mb-1">Your ecosystem at a glance</h1>
      </div>
      <div className="border border-neutral-800 rounded-lg flex items-center justify-center" style={{ height: '60vh' }}>
        <LatticeLoader size="lg" label="Materialising your ecosystem…" />
      </div>
    </div>
  );
}
