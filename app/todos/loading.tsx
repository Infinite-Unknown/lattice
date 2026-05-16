import { SkeletonRows } from '../components/Skeleton';

export default function TodosLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-emerald-400 mb-2 font-medium">
          Action queue
        </div>
        <h1 className="text-2xl font-semibold mb-1">Your next actions</h1>
      </div>
      <SkeletonRows count={3} />
    </div>
  );
}
