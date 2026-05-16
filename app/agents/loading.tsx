import { SkeletonRows } from '../components/Skeleton';

export default function AgentsLoading() {
  return (
    <div className="max-w-7xl mx-auto">
      <header className="mb-10 md:mb-12 pb-8 border-b border-border">
        <div className="font-mono text-xs uppercase tracking-widest text-accent mb-4">
          Agents / Decisions awaiting you
        </div>
        <h1 className="font-sans font-bold text-4xl md:text-6xl leading-none tracking-tighter">
          Approve.<br /><span className="text-muted-foreground">Or dismiss.</span>
        </h1>
      </header>
      <SkeletonRows count={4} />
    </div>
  );
}
