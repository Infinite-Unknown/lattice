'use client';
import { useState } from 'react';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';

type Channel = 'email' | 'calendar' | 'slack';

const CHANNEL_META: Record<Channel, { label: string; icon: string; intro: string; bullets: string[] }> = {
  email: {
    label: 'Email',
    icon: '📧',
    intro: 'In production this will draft and send an email via your connected mail provider.',
    bullets: [
      'Subject: derived from the todo title',
      'Body: the todo description (Steward’s reasoning)',
      'To: the parties\' canonical addresses (once profile.email is populated)',
      'CC: optional admin distribution list',
    ],
  },
  calendar: {
    label: 'Calendar',
    icon: '📅',
    intro: 'In production this will create a Google Calendar event and invite both parties.',
    bullets: [
      'Title: the todo title',
      'Description: the Steward’s reasoning',
      'Attendees: both parties',
      'Default duration: 30 minutes, scheduled within the next 7 days',
    ],
  },
  slack: {
    label: 'Slack',
    icon: '💬',
    intro: 'In production this will post to the configured Slack channel and DM each party.',
    bullets: [
      'Channel: #ecosystem-coordination (configurable)',
      'Direct mentions for each party',
      'Includes the action context + reasoning + a link back to this todo',
    ],
  },
};

export default function DispatchModal({
  todoId, channel, todoTitle, onClose, onDispatched,
}: {
  todoId: string | null;
  channel: Channel | null;
  todoTitle: string;
  onClose: () => void;
  onDispatched: (channel: Channel, message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!todoId || !channel) return null;
  const meta = CHANNEL_META[channel];

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const r = await fetch(`/api/todos/${todoId}/dispatch`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ channel }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'dispatch failed');
      onDispatched(channel!, j.message);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!todoId} onClose={onClose} title={`Send via ${meta.label}`} width="max-w-md">
      <div className="space-y-4">
        <div className="text-2xl">{meta.icon}</div>
        <div className="text-sm text-neutral-300">
          <span className="text-neutral-500">Todo:</span> <span className="font-medium text-neutral-100">{todoTitle}</span>
        </div>

        <div className="border border-neutral-800 rounded-lg p-3 bg-neutral-900/30 text-sm">
          <div className="text-amber-300 text-xs uppercase tracking-wider mb-1.5 font-medium">⚠ Placeholder — no message will actually be sent</div>
          <p className="text-neutral-300 leading-relaxed mb-2">{meta.intro}</p>
          <ul className="space-y-1 text-xs text-neutral-400 list-disc list-inside">
            {meta.bullets.map(b => <li key={b}>{b}</li>)}
          </ul>
        </div>

        <p className="text-xs text-neutral-500">
          Clicking <strong>Record dispatch</strong> will mark this todo as dispatched via <span className="font-medium">{meta.label}</span> in the audit log and on the todo itself, but won&apos;t send any real message yet. The todo stays open — mark it done separately once the work actually happens.
        </p>

        {error && (
          <div className="text-sm text-rose-300 border border-rose-900 bg-rose-950/30 rounded p-2">{error}</div>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-neutral-800">
          <button onClick={onClose} className="px-4 py-2 rounded border border-neutral-700 hover:bg-neutral-900 text-sm">Cancel</button>
          <button
            onClick={confirm}
            disabled={busy}
            className="px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-sm font-medium flex items-center gap-1.5"
          >
            {busy && <Spinner />}
            Record dispatch
          </button>
        </div>
      </div>
    </Modal>
  );
}

export type { Channel as DispatchChannel };
