'use client';
import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useAuth } from '../AuthContext';
import LatticeLoader from '../components/LatticeLoader';
import AddActorModal from './AddActorModal';
import AddRelationshipModal from './AddRelationshipModal';
import EditActorModal from './EditActorModal';

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

// Edge style overrides by state.
//
// Visual grammar (so each state reads instantly even at zoom-out):
//   active     — solid, full type-colour, flowing particles → 'healthy'
//   proposed   — AMBER overlay (regardless of type) + long dash + slow particle
//                → 'awaiting decision' (same amber as Cartographer chips in the inbox)
//   escalated  — solid RED + thick + fast particles → 'unmissable'
//   tapered    — type colour at ~30% opacity, DOTTED [1,4] pattern, no particles
//                → 'winding down'; very different from proposed (long-dash + amber)
//   closed     — grey ghost line, very faded → 'kept for memory'
function edgeStyle(link: GraphLink): { color: string; dash: number[] | null; width: number; particles: number } {
  const base = TYPE_COLORS[link.type] ?? '#94a3b8';
  switch (link.state) {
    case 'active':
      return { color: base, dash: null, width: 1.6, particles: 2 };
    case 'proposed':
      // Always vermillion so it reads as 'needs decision' regardless of type
      // — matches the single-accent Bold Typography palette and the
      // Cartographer chips on /agents.
      return { color: '#FF3D00', dash: [8, 4], width: 1.8, particles: 1 };
    case 'escalated':
      return { color: '#ef4444', dash: null, width: 2.6, particles: 3 };
    case 'tapered':
      // Dotted (1px on / 4px off) is structurally different from the long
      // dash used by 'proposed' — at any zoom level they don't collide.
      return { color: base + '4d', dash: [1, 4], width: 1, particles: 0 };
    case 'closed':
      return { color: '#52525250', dash: null, width: 0.7, particles: 0 };
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
  const [editingActorId, setEditingActorId] = useState<string | null>(null);
  // Bumping this key force-remounts ForceGraph2D — i.e. a true 'page refresh
  // for the graph only', which throws away every existing node position and
  // re-runs the force layout from scratch.
  const [resetKey, setResetKey] = useState(0);
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

  /**
   * Reset layout: throw away every existing node position and re-run the
   * force simulation from scratch — same effect as refreshing the page,
   * scoped to the graph alone.
   *
   * Bumping resetKey force-remounts ForceGraph2D so node objects are
   * fresh (no carried-over x/y/vx/vy). We also re-fetch in case Firestore
   * data changed underneath.
   */
  async function resetLayout() {
    setSelectedNodeId(null);
    setData(null);
    setResetKey(k => k + 1);
    await refresh();
  }

  const selectedNode = selectedNodeId ? data?.nodes.find(n => n.id === selectedNodeId) ?? null : null;

  if (!data) return (
    <div className="border border-border flex items-center justify-center animate-fade-in" style={{ height: '60vh' }}>
      <LatticeLoader size="lg" label="Materialising your ecosystem…" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top actions row */}
      {(canWriteActor || canWriteRelationship) && (
        <div className="flex items-center gap-4 flex-wrap">
          {selectedNode && (
            <div className="flex items-center gap-3 px-4 py-2 border border-border bg-card font-mono text-xs uppercase tracking-widest">
              <span className="inline-block w-2 h-2" style={{ backgroundColor: NODE_COLORS[selectedNode.type] ?? '#FAFAFA' }}></span>
              <span className="text-foreground">{selectedNode.name}</span>
              <span className="text-muted-foreground">selected</span>
              {canWriteActor && (
                <button
                  onClick={() => setEditingActorId(selectedNode.id)}
                  className="text-accent hover:opacity-80 transition-opacity duration-150 ml-2 underline underline-offset-4 decoration-1"
                  title="Edit entity details"
                >
                  Edit
                </button>
              )}
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-muted-foreground hover:text-accent transition-colors duration-150 ml-1"
                aria-label="Clear selection"
              >
                ×
              </button>
            </div>
          )}
          <div className="ml-auto flex gap-6">
            {canWriteActor && (
              <button
                onClick={() => setShowAddActor(true)}
                className="group inline-flex items-center font-semibold uppercase tracking-wider text-xs text-accent py-2 transition-all duration-150 ease-crisp active:translate-y-px"
              >
                <span className="relative">
                  + Add entity
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-accent transition-transform duration-150 ease-crisp group-hover:scale-x-110"
                    style={{ transformOrigin: 'left center' }}
                  />
                </span>
              </button>
            )}
            {canWriteRelationship && selectedNode && (
              <button
                onClick={() => setShowAddRelationship(true)}
                className="group inline-flex items-center font-semibold uppercase tracking-wider text-xs text-foreground py-2 transition-all duration-150 ease-crisp active:translate-y-px"
              >
                <span className="relative">
                  + Form relationship from {selectedNode.name}
                  <span
                    aria-hidden="true"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-foreground transition-transform duration-150 ease-crisp group-hover:scale-x-110"
                    style={{ transformOrigin: 'left center' }}
                  />
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {canWriteRelationship && !selectedNode && (
        <div className="border border-border bg-card p-4 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Click any node to select it · then form a new relationship from there
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
      <EditActorModal
        open={editingActorId !== null}
        actorId={editingActorId}
        onClose={() => setEditingActorId(null)}
        onSaved={refresh}
      />
      {/* Graph canvas */}
      <div ref={canvasContainerRef} className="border border-border relative overflow-hidden animate-fade-in" style={{ height: '60vh' }}>
        <ForceGraph2D
          key={resetKey}
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
          backgroundColor="#0A0A0A"
          // Settle physics after a finite number of simulation ticks so the
          // graph isn't perpetually drifting. Dragging a node naturally
          // re-heats the simulation when needed.
          cooldownTicks={200}
        />

        {/* Hover tooltip */}
        {hoveredLink && (
          <div className="absolute top-3 right-3 max-w-xs p-4 border border-border bg-card/95 backdrop-blur text-xs pointer-events-none">
            <div className="absolute top-0 left-0 w-12 h-1 bg-accent" />
            <div className="font-sans font-semibold text-foreground mb-2">{hoveredLink.label}</div>
            <div className="font-mono text-xs uppercase tracking-widest mb-2">
              <span style={{ color: TYPE_COLORS[hoveredLink.type] }}>{RELATIONSHIP_TYPE_LABEL[hoveredLink.type] ?? hoveredLink.type}</span>
              <span className="text-muted-foreground mx-2">/</span>
              <span className={
                hoveredLink.state === 'escalated' ? 'text-accent' :
                hoveredLink.state === 'proposed' ? 'text-accent' :
                'text-foreground'
              }>{hoveredLink.state}</span>
            </div>
            {hoveredLink.cadence && (
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">Cadence · <span className="text-foreground normal-case tracking-normal">{hoveredLink.cadence}</span></div>
            )}
            {hoveredLink.focus?.length > 0 && (
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">Focus · <span className="text-foreground normal-case tracking-normal">{hoveredLink.focus.join(', ')}</span></div>
            )}
            {hoveredLink.outcomes_count > 0 && (
              <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-1">Outcomes · <span className="text-foreground">{hoveredLink.outcomes_count}</span></div>
            )}
            <div className="font-mono text-xs uppercase tracking-widest text-accent mt-3">Click for detail →</div>
          </div>
        )}

        {/* View control */}
        <div className="absolute top-3 left-3 z-10">
          <button
            onClick={resetLayout}
            title="Re-run the force layout from scratch"
            className="px-3 py-1.5 bg-card/85 hover:bg-muted backdrop-blur border border-border font-mono text-xs uppercase tracking-widest text-foreground transition-colors duration-150"
          >
            ↻ Reset layout
          </button>
        </div>
      </div>

      {/* Legend — editorial 3-column */}
      <div className="border-t border-border pt-8">
        <div className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-6">
          Legend
        </div>
        <div className="grid md:grid-cols-3 gap-px bg-border">
          <div className="bg-background p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-foreground mb-4">
              Entities / Nodes
            </div>
            <div className="space-y-3">
              <LegendDot color="#34d399" label="Mentor" hint="experienced operator" />
              <LegendDot color="#60a5fa" label="Company" hint="founder / startup" />
              <LegendDot color="#fbbf24" label="Programme" hint="accelerator / cohort" />
              <LegendDot color="#f472b6" label="Partner" hint="corporate · service · network" />
            </div>
          </div>

          <div className="bg-background p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-foreground mb-4">
              Relationship type / Edge color
            </div>
            <div className="space-y-3">
              <LegendEdge color="#34d399" label="Mentorship" hint="mentor ↔ founder" />
              <LegendEdge color="#fbbf24" label="Company in programme" hint="founder in cohort" />
              <LegendEdge color="#f472b6" label="Partner in initiative" hint="partner in programme" />
              <LegendEdge color="#60a5fa" label="Service engagement" hint="provider engagement" />
            </div>
          </div>

          <div className="bg-background p-6">
            <div className="font-mono text-xs uppercase tracking-widest text-foreground mb-4">
              Lifecycle / Edge style
            </div>
            <div className="space-y-3">
              <LegendState style="solid" color="#34d399" label="Active" hint="Steward running" />
              <LegendState style="long-dash" color="#FF3D00" label="Proposed" hint="awaiting approval" />
              <LegendState style="solid" color="#ef4444" label="Escalated" hint="policy triggered" />
              <LegendState style="dotted" color="#34d3994d" label="Tapered" hint="winding down" />
              <LegendState style="solid" color="#52525250" label="Closed" hint="kept for memory" />
            </div>
          </div>
        </div>

        <div className="mt-8 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Tip · <span className="text-foreground normal-case tracking-normal">hover any edge for parties, focus, cadence, outcome count. Click to drill in.</span>
        </div>
      </div>
    </div>
  );
}

function LegendDot({ color, label, hint }: { color: string; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-block w-3 h-3 flex-shrink-0" style={{ backgroundColor: color }}></span>
      <span className="font-sans text-sm text-foreground">{label}</span>
      <span className="font-mono text-xs text-muted-foreground">· {hint}</span>
    </div>
  );
}

function LegendEdge({ color, label, hint }: { color: string; label: string; hint: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-block w-6 h-0.5 flex-shrink-0" style={{ backgroundColor: color }}></span>
      <span className="font-sans text-sm text-foreground">{label}</span>
      <span className="font-mono text-xs text-muted-foreground">· {hint}</span>
    </div>
  );
}

function LegendState({ style, color, label, hint }: { style: 'solid' | 'long-dash' | 'dotted'; color: string; label: string; hint: string }) {
  const dasharray =
    style === 'long-dash' ? '8 4'
    : style === 'dotted' ? '1 4'
    : undefined;
  const strokeWidth = style === 'dotted' ? 2 : 2.2;
  return (
    <div className="flex items-center gap-3">
      <svg width="28" height="6" className="flex-shrink-0">
        <line
          x1="0" y1="3" x2="28" y2="3"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={dasharray}
          strokeLinecap={style === 'dotted' ? 'round' : 'butt'}
        />
      </svg>
      <span className="font-sans text-sm text-foreground">{label}</span>
      <span className="font-mono text-xs text-muted-foreground">· {hint}</span>
    </div>
  );
}
