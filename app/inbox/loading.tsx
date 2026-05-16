import { SkeletonRows } from '../components/Skeleton';

export default function InboxLoading() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-4">
        <div className="text-xs uppercase tracking-[0.2em] text-amber-400 mb-2 font-medium">
          Inbox · Approvals queue
        </div>
        <h1 className="text-2xl font-semibold mb-1">Decisions waiting on you</h1>
      </div>
      <SkeletonRows count={4} />
    </div>
  );
}
