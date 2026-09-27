import clsx from 'clsx';

interface Stat {
  label: string;
  value: string | number;
  foot: string;
  accent?: 'cyan' | 'risk' | 'critical';
}

const STATS: Stat[] = [
  { label: 'Active Projects', value: 24, foot: '+2 this month' },
  { label: 'Projects at Risk', value: 7, foot: 'risk score ≥ 60%', accent: 'risk' },
  { label: 'Critical Delays', value: 3, foot: 'risk score ≥ 85%', accent: 'critical' },
  { label: 'Affected Parcels', value: '1,284', foot: 'across 6 districts' },
  { label: 'Pending Verification', value: 247, foot: '86 field tasks open' },
  { label: 'Pending Documents', value: 163, foot: '40 awaiting OCR review' },
  { label: 'Field Tasks', value: 86, foot: '18 officers deployed' },
];

export function StatGrid() {
  return (
    <div className="mb-4 grid grid-cols-4 gap-3 xl:grid-cols-7">
      {STATS.map((s) => (
        <div key={s.label} className="relative overflow-hidden rounded-[10px] border border-hair bg-panel px-3.5 py-3">
          <span
            className={clsx(
              'absolute bottom-0 left-0 top-0 w-[2px] opacity-70',
              s.accent === 'critical' ? 'bg-risk-critical' : s.accent === 'risk' ? 'bg-risk-high' : 'bg-cyan'
            )}
          />
          <div className="font-mono text-[10px] uppercase tracking-wide text-txt-tertiary">{s.label}</div>
          <div className="mt-1.5 font-display font-mono text-[23px] font-bold">{s.value}</div>
          <div className="mt-1 text-[10.5px] text-txt-tertiary">{s.foot}</div>
        </div>
      ))}
    </div>
  );
}
