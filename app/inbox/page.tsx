import InboxClient from './InboxClient';
export default function InboxPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Inbox</h1>
      <p className="text-neutral-400 mb-4">Stewards propose. You dispose.</p>
      <InboxClient />
    </div>
  );
}
