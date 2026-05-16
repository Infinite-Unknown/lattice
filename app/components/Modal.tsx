'use client';
import { useEffect } from 'react';

export default function Modal({
  open, onClose, title, children, width = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/85 overflow-y-auto py-12 animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-card border border-border w-full mx-4 ${width} animate-scale-in relative`}
        onClick={e => e.stopPropagation()}
      >
        {/* Accent bar above title */}
        <div className="absolute top-0 left-0 w-16 h-1 bg-accent" />
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <h2 className="font-sans font-bold text-lg tracking-tight">{title}</h2>
          <button
            onClick={onClose}
            className="font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors duration-150 mt-0.5"
            aria-label="Close"
          >
            Close ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
