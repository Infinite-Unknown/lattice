'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

type GraphData = {
  nodes: Array<{ id: string; name: string; type: string }>;
  links: Array<{ source: string; target: string; state: string; id: string }>;
};

const COLORS: Record<string, string> = {
  company: '#60a5fa', mentor: '#34d399', programme: '#fbbf24', partner: '#f472b6',
};
const STATE_COLORS: Record<string, string> = {
  active: '#a3a3a3', proposed: '#f59e0b', escalated: '#ef4444', tapered: '#737373', closed: '#525252',
};

export default function GraphClient() {
  const [data, setData] = useState<GraphData | null>(null);
  const router = useRouter();
  const fgRef = useRef<any>(null);

  useEffect(() => { fetch('/api/graph').then(r => r.json()).then(setData); }, []);

  if (!data) return <div className="text-neutral-500">Loading graph…</div>;

  return (
    <div className="border border-neutral-800 rounded-lg" style={{ height: '70vh' }}>
      <ForceGraph2D
        ref={fgRef}
        graphData={data as any}
        nodeLabel={(n: any) => `${n.name} (${n.type})`}
        nodeCanvasObject={(node: any, ctx, scale) => {
          const r = 6;
          ctx.fillStyle = COLORS[node.type] ?? '#999';
          ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, 2 * Math.PI); ctx.fill();
          if (scale > 1.5) {
            ctx.fillStyle = '#e5e5e5'; ctx.font = '4px sans-serif';
            ctx.fillText(node.name, node.x + 8, node.y + 3);
          }
        }}
        linkColor={(l: any) => STATE_COLORS[l.state] ?? '#666'}
        linkWidth={(l: any) => (l.state === 'proposed' ? 1 : 1.5)}
        linkDirectionalParticles={(l: any) => (l.state === 'active' ? 2 : 0)}
        linkDirectionalParticleSpeed={0.004}
        onLinkClick={(l: any) => router.push(`/relationships/${l.id}`)}
        backgroundColor="#0a0a0a"
      />
      <div className="p-3 text-xs text-neutral-400 flex gap-4 flex-wrap">
        <span><span className="inline-block w-3 h-3 rounded-full bg-emerald-400 mr-1"></span>Mentor</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-1"></span>Company</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-amber-400 mr-1"></span>Programme</span>
        <span><span className="inline-block w-3 h-3 rounded-full bg-pink-400 mr-1"></span>Partner</span>
        <span><span className="inline-block w-6 h-px bg-amber-500 align-middle mr-1"></span>Proposed edge</span>
      </div>
    </div>
  );
}
