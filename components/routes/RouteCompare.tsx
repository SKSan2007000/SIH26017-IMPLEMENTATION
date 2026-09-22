import clsx from 'clsx';
import type { Route } from '@/types';

export function RouteCompareTable({ routes }: { routes: Route[] }) {
  const rows: { label: string; get: (r: Route) => string | number }[] = [
    { label: 'Strategy', get: (r) => r.strategy },
    { label: 'Distance', get: (r) => `${r.distanceKm} km` },
    { label: 'Affected Parcels', get: (r) => r.affectedParcels },
    { label: 'Stakeholders', get: (r) => r.stakeholders },
    { label: 'Est. Cost', get: (r) => `₹${r.estimatedCostCr} Cr` },
    { label: 'Est. Delay', get: (r) => `${r.estimatedDelayMonths} mo` },
    { label: 'Delay Probability', get: (r) => `${r.delayProbabilityPct}%` },
    { label: 'Infra Impact', get: (r) => r.infrastructureImpact },
    { label: 'Overall Score', get: (r) => `${r.overallScore}/100` },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-hair">
      <table className="w-full border-collapse text-[12px]">
        <thead>
          <tr className="border-b border-hair bg-panel2">
            <th className="px-3.5 py-2.5 text-left font-mono text-[10px] uppercase tracking-wide text-txt-tertiary">Metric</th>
            {routes.map((r) => (
              <th key={r.id} className={clsx('px-3.5 py-2.5 text-left', r.aiRecommended && 'bg-cyan-glow')}>
                <div className="font-display text-[13px] font-bold">{r.label}</div>
                {r.aiRecommended && <div className="font-mono text-[9.5px] text-cyan">AI-SUGGESTED</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-hair last:border-0">
              <td className="px-3.5 py-2 font-mono text-[10.5px] text-txt-tertiary">{row.label}</td>
              {routes.map((r) => (
                <td key={r.id} className={clsx('px-3.5 py-2 font-medium', r.aiRecommended && 'bg-cyan-glow/30 text-cyan')}>
                  {row.get(r)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="border-t border-hair bg-panel2 px-3.5 py-2 font-mono text-[10px] text-txt-tertiary">
        HUMAN DECISION REQUIRED — Route C is AI-suggested based on lowest predicted delay; final selection remains with the project officer.
      </div>
    </div>
  );
}
