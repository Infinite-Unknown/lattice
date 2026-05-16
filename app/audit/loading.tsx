import { SkeletonRows } from '../components/Skeleton';

export default function AuditLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-2 font-medium">
          Governance · Audit log
        </div>
        <h1 className="text-2xl font-semibold mb-1">Every admin action, recorded</h1>
      </div>
      <SkeletonRows count={5} />
    </div>
  );
}
