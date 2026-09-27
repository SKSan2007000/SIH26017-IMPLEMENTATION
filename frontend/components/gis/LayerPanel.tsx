'use client';

import { useAppStore, type MapLayerKey } from '@/lib/store/useAppStore';
import { Switch } from '@/components/ui/Primitives';

const LAYER_LABELS: { key: MapLayerKey; label: string }[] = [
  { key: 'projects', label: 'Projects' },
  { key: 'routes', label: 'Candidate Routes' },
  { key: 'corridorRibbon', label: 'Highway Corridor' },
  { key: 'roadNetwork', label: 'Regional Network' },
  { key: 'connectivityGaps', label: 'Connectivity Gaps' },
  { key: 'parcels', label: 'Land Parcels' },
  { key: 'buildings', label: 'Building Footprints' },
  { key: 'risk', label: 'Risk Envelope' },
  { key: 'stakeholders', label: 'Stakeholders' },
  { key: 'infrastructure', label: 'Infrastructure' },
  { key: 'fieldOfficers', label: 'Field Tasks' },
  { key: 'verification', label: 'Verification Status' },
];

export function LayerPanel({ view }: { view: 'command' | 'gis' | 'twin' }) {
  const layers = useAppStore((s) => s.layers[view]);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  return (
    <div className="absolute right-3 top-3 z-10 w-[168px] rounded-lg border border-hair bg-void/90 p-2.5 backdrop-blur-md">
      <div className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">Layers</div>
      {LAYER_LABELS.map(({ key, label }) => (
        <div key={key} className="flex items-center justify-between py-1 text-[11.5px] text-txt-secondary">
          <span>{label}</span>
          <Switch on={layers[key]} onToggle={() => toggleLayer(view, key)} />
        </div>
      ))}
    </div>
  );
}
