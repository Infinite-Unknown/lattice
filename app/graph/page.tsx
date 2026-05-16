import GraphClient from './GraphClient';

export default function GraphPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10 md:mb-12 pb-8 border-b border-border">
        <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
          The ecosystem / Live graph
        </div>
        <h1 className="font-sans font-bold text-4xl md:text-6xl leading-none tracking-tighter mb-6">
          Every line is<br /><span className="text-muted-foreground">an AI Steward.</span>
        </h1>
        <p className="font-sans text-base md:text-lg text-muted-foreground max-w-2xl leading-relaxed">
          Click any edge to see its memory, run a tick, or edit its policy.
          Orange dashes are <span className="text-accent font-medium">Cartographer proposals</span> awaiting your approval.
        </p>
      </header>
      <GraphClient />
    </div>
  );
}
