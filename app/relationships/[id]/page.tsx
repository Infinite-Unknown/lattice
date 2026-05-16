import RelationshipClient from './RelationshipClient';
export default function RelationshipPage({ params }: { params: { id: string } }) {
  return <RelationshipClient id={params.id} />;
}
