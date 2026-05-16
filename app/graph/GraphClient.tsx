'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import AddActorModal from './AddActorModal';
import AddRelationshipModal from './AddRelationshipModal';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

type GraphLink = {
  id: string;
  source: string;
  target: string;
  state: string;
  type: string;
  focus: string[];
  cadence: string;
  outcomes_count: number;
  label: string;
};

type GraphData = {
  nodes: Array<{ id: string; name: string; type: string }>;
  links: GraphLink[];
};

// Actor node colors — match the persona type
const NODE_COLORS: Record<string, string> = {
  company:   '#60a5fa', // blue-400
  mentor:    '#34d399', // emerald-400
  programme: '#fbbf24', // amber-400
  partner:   '#f472b6', // pink-400
};

// Relationship type colors — distinct hue per type
const TYPE_COLORS: Record<string, string> = {
  mentorship:             '#34d399', // emerald — mentor ↔ founder
  company_in_programme:   '#fbbf24', // amber  — company → programme
  partner_in_initiative:  '#f472b6', // pink   — partner → initiative
  service_engagement:     '#60a5fa', // blue   — service provider engagement
};

// Edge style overrides by state
function edgeStyle(link: GraphLink): { color: string; dash: number[] | null; width: number; particles: number } {
  const base = TYPE_COLORS[link.type] ?? '#94a3b8';
  switch (link.state) {
    case 'active':
      return { color: base, dash: null, width: 1.6, particles: 2 };
    case 'proposed':
      return { color: base, dash: [6, 4], width: 1.2, particles: 0 };
    case 'escalated':
      // Override to red — escalation should be visually unmissable
      return { color: '#ef4444', dash: null, width: 2.4, particles: 3 };
    case 'tapered':
      return { color: base + '66', dash: [2, 3], width: 1, particles: 0 }; // 40% opacity
    case 'closed':
      return { color: '#52525266', dash: null, width: 0.8, particles: 0 };
    default:
      return { color: base, dash: null, width: 1.4, particles: 0 };
  }
}

const RELATIONSHIP_TYPE_LABEL: Record<string, string> = {
  mentorship: 'Mentorship',
  company_in_programme: 'Company in programme',
  partner_in_initiative: 'Partner in initiative',
  service_engagement: 'Service engagement',
};

export default function GraphClient() {
  const { can } = useAuth();
  const canWriteActor = can('actor.write');
  const canWriteRelationship = can('relationship.write');
  const [data, setData] = useState<GraphData | null>(null);
  const [hoveredLink, setHoveredLink] = useState<GraphLink | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphData['nodes'][number] | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showAddActor, setShowAddActor] = useState(false);
  const [showAddRelationship, setShowAddRelationship] = useState(false);
  const router = useRouter();
  const fgRef = useRef<any>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  async function refresh() {
    const r = await fetch('/api/graph', { cache: 'no-store' });
    setData(await r.json());
  }

  useEffect(() => { refresh(); }, []);

  // Toggle cursor on the graph container as the user hovers nodes/links.
  useEffect(() => {
    if (canvasContainerRef.current) {
      canvasContainerRef.current.style.cursor = (hoveredNode || hoveredLink) ? 'pointer' : 'default';
    }
  }, [hoveredNode, hoveredLink]);

  const selectedNode = selectedNodeId ? data?.nodes.find(n => n.id === selectedNodeId) ?? null : null;

  if (!data) return <div className="text-neutral-500 py-8">Loading graph…</div>;

  return (
    <div className="space-y-4">
      {/* Top actions row — Add actor is always available; Add relationship is contextual */}
      {(canWriteActor || canWriteRelationship) && (
        <div className="flex items-center gap-2 flex-wrap">
          {selectedNode && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900 border border-neutral-700 text-xs">
              <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: NODE_COLORS[selectedNode.type] ?? '#94a3b8' }}></span>
              <span className="font-medium">{selectedNode.name}</span>
              <span className="text-neutral-500">selected</span>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-neutral-500 hover:text-neutral-200 ml-1"
                aria-label="Clear selection"
              >
                ×
              </button>
            </div>
          )}
          <div className="ml-auto flex gap-2">
            {canWriteActor && (
              <button
                onClick={() => setShowAddActor(true)}
                className="px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-sm font-medium"
              >
                + Add actor
              </button>
            )}
            {canWriteRelationship && selectedNode && (
              <button
                onClick={() => setShowAddRelationship(true)}
                className="px-3 py-1.5 rounded bg-amber-700 hover:bg-amber-600 text-sm font-medium"
              >
                + Form relationship from {selectedNode.name}
              </button>
            )}
          </div>
        </div>
      )}

      {canWriteRelationship && !selectedNode && (
        <div className="text-xs text-neutral-500 border border-neutral-800 rounded p-2 bg-neutral-900/30">
          💡 Click any node to select it, then form a new relationship starting from there. Click empty canvas to deselect.
        </div>
      )}

      <AddActorModal open={showAddActor} onClose={() => setShowAddActor(false)} onCreated={refresh} />
      <AddRelationshipModal
        open={showAddRelationship}
        onClose={() => setShowAddRelationship(false)}
        onCreated={() => { refresh(); setSelectedNodeId(null); }}
        actors={data.nodes}
        prefilledPartyA={selectedNodeId ?? undefined}
      />
      {/* Graph canvas */}
      <div ref={canvasContainerRef} className="border border-neutral-800 rounded-lg relative overflow-hidden" style={{ height: '60vh' }}>
        <ForceGraph2D
          ref={fgRef}
          graphData={data as any}
          nodeLabel={(n: any) => `${n.name} (${n.type})`}
          linkLabel={(l: any) => {
            const focusBits = (l.focus as string[] | undefined)?.length ? ` · ${l.focus.join(', ')}` : '';
            const cadence = l.cadence ? ` · ${l.cadence}` : '';
            return `${l.label}\n${RELATIONSHIP_TYPE_LABEL[l.type] ?? l.type} · ${l.state}${cadence}${focusBits}`;
          }}
          nodeCanvasObject={(node: any, ctx, scale) => {
            const baseR = 6;
            const isHovered = hoveredNode?.id === node.id;
            const isSelected = selectedNodeId === node.id;
            const r = isHovered || isSelected ? baseR + 2 : baseR;

            // Selection / hover halo
            if (isSelected) {
              ctx.beginPath();
              ctx.arc(node.x, node.y, r + 5, 0, 2 * Math.PI);
              ctx.fillStyle = '#fbbf2433'; // amber glow
              ctx.fill();
            } else if (isHovered) {
              ctx.beginPath();
              ctx.arc(node.x, node.y, r + 4, 0, 2 * Math.PI);
              ctx.fillStyle = '#ffffff22';
              ctx.fill();
            }

            // Filled circle
            ctx.fillStyle = NODE_COLORS[node.type] ?? '#94a3b8';
            ctx.beginPath();
            ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
            ctx.fill();

            // Outline ring
            ctx.strokeStyle = isSelected ? '#fbbf24' : '#0a0a0a';
            ctx.lineWidth = isSelected ? 2 : 1;
            ctx.stroke();

            // Label when zoomed in OR when hovered
            if (scale > 1.4 || isHovered || isSelected) {
              ctx.fillStyle = '#e5e5e5';
              ctx.font = `${isHovered || isSelected ? 'bold ' : ''}4px sans-serif`;
              ctx.fillText(node.name, node.x + r + 2, node.y + 2);
            }
          }}
          nodePointerAreaPaint={(node: any, color: string, ctx) => {
            // Make the hit-area slightly larger than the visual circle so hover is forgiving.
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
            ctx.fill();
          }}
          linkColor={(l: any) => edgeStyle(l).color}
          linkWidth={(l: any) => edgeStyle(l).width}
          linkLineDash={(l: any) => edgeStyle(l).dash}
          linkDirectionalParticles={(l: any) => edgeStyle(l).particles}
          linkDirectionalParticleSpeed={0.004}
          linkDirectionalParticleWidth={(l: any) => (l.state === 'escalated' ? 3 : 2)}
          onLinkHover={(l: any) => setHoveredLink(l as GraphLink | null)}
          onLinkClick={(l: any) => router.push(`/relationships/${l.id}`)}
          onNodeHover={(n: any) => setHoveredNode(n as any)}
          onNodeClick={(n: any) => setSelectedNodeId(n.id)}
          onBackgroundClick={() => setSelectedNodeId(null)}
          backgroundColor="#0a0a0a"
        />

        {/* Hover tooltip */}
        {hoveredLink && (
          <div className="absolute top-3 right-3 max-w-xs p-3 rounded-lg border border-neutral-700 bg-neutral-900/95 backdrop-blur text-xs shadow-lg pointer-events-none">
            <div className="font-medium text-neutral-100 mb-1">{hoveredLink.label}</div>
            <div className="text-neutral-400 mb-1">
              <span style={{ color: TYPE_COLORS[hoveredLink.type] }}>{RELATIONSHIP_TYPE_LABEL[hoveredLink.type] ?? hoveredLink.type}</span>
              <span className="text-neutral-600 mx-1">·</span>
              <span className={
                hoveredLink.state === 'escalated' ? 'text-rose-400' :
                hoveredLink.state === 'proposed' ? 'text-amber-400' :
                'text-emerald-400'
              }>{hoveredLink.state}</span>
            </div>
            {hoveredLink.cadence && (
              <div className="text-neutral-500">Cadence: {hoveredLink.cadence}</div>
            )}
            {hoveredLink.focus?.length > 0 && (
              <div className="text-neutral-500">Focus: {hoveredLink.focus.join(', ')}</div>
            )}
            {hoveredLink.outcomes_count > 0 && (
              <div className="text-neutral-500">Outcomes logged: {hoveredLink.outcomes_count}</div>
            )}
            <div className="text-neutral-600 mt-2 italic">Click to open detail →</div>
          </div>
        )}
      </div>

      {/* Comprehensive legend panel */}
      <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/30">
        <div className="text-xs uppercase tracking-[0.15em] text-neutral-500 mb-3 font-medium">Legend</div>
        <div className="grid md:grid-cols-3 gap-6 text-xs">
          {/* Actor nodes */}
          <div>
            <div className="text-neutral-300 font-medium mb-2">Actors (nodes)</div>
            <div className="space-y-1.5">
              <LegendDot color="#34d399" label="Mentor" hint="experienced operator" />
              <LegendDot color="#60a5fa" label="Company" hint="founder / startup" />
              <LegendDot color="#fbbf24" label="Programme" hint="accelerator / cohort" />
              <LegendDot color="#f472b6" label="Partner" hint="corporate, service, or network" />
            </div>
          </div>

          {/* Relationship types */}
          <div>
            <div className="text-neutral-300 font-medium mb-2">Relationship types (edge colour)</div>
            <div className="space-y-1.5">
              <LegendEdge color="#34d399" label="Mentorship" hint="mentor ↔ founder" />
              <LegendEdge color="#fbbf24" label="Company in programme" hint="founder enrolled in cohort" />
              <LegendEdge color="#f472b6" label="Partner in initiative" hint="partner attached to programme" />
              <LegendEdge color="#60a5fa" label="Service engagement" hint="service provider engagement" />
            </div>
          </div>

          {/* Relationship states */}
          <div>
            <div className="text-neutral-300 font-medium mb-2">Lifecycle state (edge style)</div>
            <div className="space-y-1.5">
              <LegendState style="solid" color="#34d399" label="Active" hint="Steward is running" />
              <LegendState style="dashed" color="#34d399" label="Proposed" hint="Cartographer suggestion, not yet approved" />
              <LegendState style="solid" color="#ef4444" label="Escalated" hint="policy trigger fired, needs admin" />
              <LegendState style="dashed" color="#34d39966" label="Tapered" hint="winding down" />
              <LegendState style="solid" color="#52525266" label="Closed" hint="sunset, kept for memory" />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-800 text-xs text-neutral-500">
          <span className="text-neutral-300 font-medium">Tip:</span> hover any edge to see its parties, focus, cadence, and outcome count. Click to drill into the Steward log and policy editor.
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label, hint }: { color: string; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }}></span>
      <span className="text-neutral-200">{label}</span>
      <span className="text-neutral-500">— {hint}</span>
    </div>
  );
}

function LegendEdge({ color, label, hint }: { color: string; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-block w-6 h-0.5 flex-shrink-0" style={{ backgroundColor: color }}></span>
      <span className="text-neutral-200">{label}</span>
      <span className="text-neutral-500">— {hint}</span>
    </div>
  );
}

function LegendState({ style, color, label, hint }: { style: 'solid' | 'dashed'; color: string; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg width="24" height="6" className="flex-shrink-0">
        <line
          x1="0" y1="3" x2="24" y2="3"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={style === 'dashed' ? '4 3' : undefined}
        />
      </svg>
      <span className="text-neutral-200">{label}</span>
      <span className="text-neutral-500">— {hint}</span>
    </div>
  );
}
