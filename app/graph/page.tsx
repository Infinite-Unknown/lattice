import GraphClient from './GraphClient';
export default function GraphPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Ecosystem Graph</h1>
      <p className="text-neutral-400 mb-4">Every line is a Relationship — an autonomous AI agent.</p>
      <GraphClient />
    </div>
  );
}
