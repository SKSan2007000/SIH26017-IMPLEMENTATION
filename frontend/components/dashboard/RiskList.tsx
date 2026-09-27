'use client';

import { MOCK_PROJECTS } from '@/lib/mock/projects';
import { MOCK_RISKS } from '@/lib/mock/risks';
import { RiskPct } from '@/components/ui/Primitives';
import clsx from 'clsx';

export function RiskList({ onSelect }: { onSelect: (projectId: string) => void }) {
  const rows = [...MOCK_PROJECTS]
    .map((p) => ({ project: p, risk: MOCK_RISKS[p.id] }))
    .filter((r) => r.risk)
    .sort((a, b) => b.risk.overallPct - a.risk.overallPct)
    .slice(0, 10);

  return (
    <div className="flex max-h-full flex-col gap-2 overflow-y-auto p-2.5">
      {rows.map(({ project, risk }) => (
        <button
          key={project.id}
          onClick={() => onSelect(project.id)}
          className="rounded-lg border border-hair p-2.5 text-left transition-colors hover:border-mid hover:bg-white/[0.03]"
        >
          <div className="flex items-center justify-between">
            <div className="text-[12px] font-semibold">{project.name}</div>
            <RiskPct pct={risk.overallPct} band={risk.band} />
          </div>
          <div className="mt-0.5 text-[10.5px] text-txt-tertiary">
            {project.status} · {project.parcelsCount} parcels · {risk.predictedDelayLabel}
          </div>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
            <div
              className={clsx(
                'h-full rounded-full',
                risk.band === 'critical' ? 'bg-risk-critical' : risk.band === 'high' ? 'bg-risk-high' : risk.band === 'medium' ? 'bg-risk-medium' : 'bg-risk-low'
              )}
              style={{ width: `${risk.overallPct}%` }}
            />
          </div>
        </button>
      ))}
    </div>
  );
}
