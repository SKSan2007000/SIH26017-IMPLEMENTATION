'use client';

import { useState, type MutableRefObject } from 'react';
import { Box, Square, Satellite, Mountain, Grid2x2, Building2, TriangleAlert, Users, MapPin, Route } from 'lucide-react';
import clsx from 'clsx';

type ViewerRef = MutableRefObject<import('cesium').Viewer | null>;
type CesiumRef = MutableRefObject<typeof import('cesium') | null>;

const MODES = [
  { id: '3d', label: '3D Twin', icon: Box },
  { id: '2d', label: '2D Flat', icon: Square },
  { id: 'sat', label: 'Satellite', icon: Satellite },
] as const;

const LAYERS = [
  { id: 'corridor', label: 'Highway Corridor', icon: Route, prefix: 'twin-corridor-' },
  { id: 'parcels', label: 'Parcels', icon: Grid2x2, prefix: 'twin-parcel-' },
  { id: 'buildings', label: 'Buildings', icon: Building2, prefix: 'twin-building-' },
  { id: 'infrastructure', label: 'Infrastructure', icon: Building2, prefix: 'twin-infra-' },
  { id: 'risk', label: 'Risk Envelope', icon: TriangleAlert, prefix: 'twin-riskzone' },
  { id: 'stakeholders', label: 'Stakeholders', icon: Users, prefix: 'twin-stake-' },
  { id: 'field', label: 'Field Ops', icon: MapPin, prefix: 'twin-field-' },
  { id: 'terrain', label: 'Terrain', icon: Mountain, prefix: null },
] as const;

export function TwinToolbar({ viewerRef, cesiumRef, projectId }: { viewerRef: ViewerRef; cesiumRef: CesiumRef; projectId: string }) {
  const [mode, setMode] = useState<'3d' | '2d' | 'sat'>('3d');
  const [on, setOn] = useState<Record<string, boolean>>({
    corridor: true,
    parcels: true,
    buildings: true,
    infrastructure: true,
    risk: true,
    stakeholders: true,
    field: true,
    terrain: true,
  });

  function setModeAndMorph(next: '3d' | '2d' | 'sat') {
    setMode(next);
    const viewer = viewerRef.current;
    if (!viewer) return;
    if (next === '2d') viewer.scene.morphTo2D(1);
    if (next === '3d') viewer.scene.morphTo3D(1);
    if (next === 'sat') viewer.scene.morphTo3D(0.4);
  }

  function toggleLayer(id: (typeof LAYERS)[number]['id']) {
    const viewer = viewerRef.current;
    const next = !on[id];
    setOn((s) => ({ ...s, [id]: next }));
    if (!viewer) return;

    if (id === 'terrain') {
      viewer.scene.globe.show = next;
      return;
    }

    if (id === 'corridor') {
      viewer.entities.values.forEach((ent) => {
        const eid = String(ent.id);
        if (
          eid.startsWith('twin-viaduct-') ||
          eid.startsWith('twin-pier-') ||
          eid.startsWith('twin-corridor-') ||
          eid.startsWith('twin-route-') ||
          eid.startsWith('twin-feeder-road-')
        ) {
          ent.show = next;
        }
      });
      return;
    }

    if (id === 'buildings') {
      viewer.entities.values.forEach((ent) => {
        const eid = String(ent.id);
        if (eid.startsWith('twin-building-') || eid.startsWith('twin-roof-') || eid.startsWith('twin-mast-')) {
          ent.show = next;
        }
      });
      return;
    }

    const def = LAYERS.find((l) => l.id === id);
    if (!def?.prefix) return;

    if (def.prefix === 'twin-riskzone') {
      const ent = viewer.entities.getById('twin-riskzone');
      if (ent) ent.show = next;
      return;
    }

    viewer.entities.values.forEach((ent) => {
      if (String(ent.id).startsWith(def.prefix as string)) ent.show = next;
    });
  }

  return (
    <div className="absolute left-3 top-3 z-20 flex max-w-[80%] flex-wrap gap-1.5 backdrop-blur-md rounded-lg p-1 bg-void/60 border border-hair">
      <div className="flex gap-1 border-r border-hair pr-1.5 mr-0.5">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setModeAndMorph(m.id)}
            className={clsx(
              'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors',
              mode === m.id
                ? 'border-cyanline bg-cyan-glow text-cyan font-bold'
                : 'border-hair bg-void/85 text-txt-secondary hover:border-mid hover:text-txt-primary'
            )}
          >
            <m.icon className="h-3.5 w-3.5" /> {m.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            onClick={() => toggleLayer(l.id)}
            className={clsx(
              'flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 font-mono text-[11px] transition-colors',
              on[l.id]
                ? 'border-cyanline bg-cyan-glow text-cyan'
                : 'border-hair bg-void/85 text-txt-tertiary hover:border-mid hover:text-txt-secondary opacity-60'
            )}
          >
            <l.icon className="h-3.5 w-3.5" /> {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}

