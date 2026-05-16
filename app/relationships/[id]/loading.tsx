import LatticeLoader from '../../components/LatticeLoader';

export default function RelationshipLoading() {
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="flex items-center justify-center min-h-[50vh]">
        <LatticeLoader size="lg" label="Loading relationship…" />
      </div>
    </div>
  );
}
