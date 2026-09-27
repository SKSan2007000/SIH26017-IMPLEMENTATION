'use client';

import clsx from 'clsx';
import { Sparkles } from 'lucide-react';
import type { Route } from '@/types';
import { Button } from '@/components/ui/Primitives';

export function RouteCard({ route, selected, onSelect }: { route: Route; selected: boolean; onSelect: () => void }) {
  return (
    <div
      className={clsx(
        'relative flex flex-col gap-3 rounded-xl border p-4 transition-colors',
        route.aiRecommended ? 'border-cyanline bg-cyan-glow/40' : 'border-hair bg-panel',
        selected && 'ring-1 ring-cyan'
      )}
    >
      {route.aiRecommended && (
        <div className="absolute -top-2.5 right-4 flex items-center gap-1 rounded-full border border-cyanline bg-base px-2 py-0.5 font-mono text-[9.5px] text-cyan">
          <Sparkles className="h-2.5 w-2.5" /> AI-SUGGESTED OPTION
        </div>
      )}
      <div>
        <div className="font-display text-[15px] font-bold">{route.label}</div>
        <div className="text-[11.5px] text-txt-tertiary">{route.strategy}</div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11.5px]">
        <Stat label="Distance" value={`${route.distanceKm} km`} />
        <Stat label="Affected Parcels" value={route.affectedParcels} />
        <Stat label="Stakeholders" value={route.stakeholders} />
        <Stat label="Est. Cost" value={`₹${route.estimatedCostCr} Cr`} />
        <Stat label="Est. Delay" value={`${route.estimatedDelayMonths} mo`} />
        <Stat label="Delay Probability" value={`${route.delayProbabilityPct}%`} accent={route.delayProbabilityPct >= 60 ? 'risk' : undefined} />
        <Stat label="Infra Impact" value={route.infrastructureImpact} />
        <Stat label="Overall Score" value={`${route.overallScore}/100`} accent="cyan" />
      </div>

      <div className="mt-1 flex gap-2">
        <Button variant={selected ? 'primary' : 'default'} className="flex-1" onClick={onSelect}>
          {selected ? 'Selected' : 'Select'}
        </Button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string | number; accent?: 'cyan' | 'risk' }) {
  return (
    <div className="rounded-lg border border-hair bg-panel2 px-2.5 py-1.5">
      <div className="font-mono text-[9px] uppercase tracking-wide text-txt-tertiary">{label}</div>
      <div className={clsx('mt-0.5 font-mono text-[13px] font-bold', accent === 'cyan' && 'text-cyan', accent === 'risk' && 'text-risk-high')}>{value}</div>
    </div>
  );
}
