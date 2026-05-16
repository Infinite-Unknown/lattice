'use client';
import { useState } from 'react';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';

type Channel = 'email' | 'calendar' | 'slack';

const CHANNEL_META: Record<Channel, { label: string; intro: string; bullets: string[] }> = {
  email: {
    label: 'Email',
    intro: 'In production this will draft and send an email via your connected mail provider.',
    bullets: [
      'Subject derived from the todo title',
      'Body uses the Steward reasoning',
      'To: the parties\' canonical addresses (once profile.email is populated)',
      'CC: optional admin distribution list',
    ],
  },
  calendar: {
    label: 'Calendar',
    intro: 'In production this will create a Google Calendar event and invite both parties.',
    bullets: [
      'Title from the todo',
      'Description from the Steward reasoning',
      'Attendees: both parties',
      'Default 30 min, scheduled in the next 7 days',
    ],
  },
  slack: {
    label: 'Slack',
    intro: 'In production this will post to the configured Slack channel and DM each party.',
    bullets: [
      'Channel: #ecosystem-coordination (configurable)',
      'Direct mentions for each party',
      'Includes action context + reasoning + a link back to this todo',
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
      <div className="space-y-5">
        <div>
          <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Todo
          </div>
          <div className="font-sans font-semibold text-foreground">{todoTitle}</div>
        </div>

        <div className="border border-border bg-card p-4 space-y-3">
          <div className="font-mono text-xs uppercase tracking-widest text-accent">
            ⚠ Placeholder · no message will actually be sent
          </div>
          <p className="font-sans text-sm text-foreground leading-relaxed">{meta.intro}</p>
          <ul className="space-y-1.5 font-sans text-xs text-muted-foreground">
            {meta.bullets.map(b => (
              <li key={b} className="flex gap-2">
                <span className="text-muted-foreground/50">·</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="font-mono text-xs text-muted-foreground/80 normal-case tracking-normal leading-relaxed">
          Clicking 'Record dispatch' marks this todo as dispatched via <span className="text-foreground">{meta.label}</span> in the audit log and on the todo itself, but won't send any real message yet. Mark the todo done separately once the work happens.
        </p>

        {error && (
          <div className="border border-accent bg-accent/10 p-3 font-mono text-xs uppercase tracking-widest text-accent">
            {error}
          </div>
        )}

        <div className="flex items-center gap-8 pt-4 border-t border-border">
          <button
            onClick={confirm}
            disabled={busy}
            className="group inline-flex items-center gap-2 font-semibold uppercase tracking-wider text-sm text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {busy && <Spinner />}
            <span className="relative">
              Record dispatch →
              <span
                aria-hidden="true"
                className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110 group-disabled:hidden"
                style={{ transformOrigin: 'left center' }}
              />
            </span>
          </button>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

export type { Channel as DispatchChannel };
