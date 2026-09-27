'use client';

import { useMemo } from 'react';
import clsx from 'clsx';
import { FlaskConical } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { WHAT_IF_LEVER_DEFS, simulateWhatIf, currentRiskFor } from '@/lib/simulation/whatIf';
import { Button } from '@/components/ui/Primitives';
import type { WhatIfLever } from '@/types';

export function WhatIfPanel({ projectId }: { projectId: string }) {
  const activeLevers = useAppStore((s) => s.activeLevers);
  const toggleLever = useAppStore((s) => s.toggleLever);
  const resetLevers = useAppStore((s) => s.resetLevers);
  const baseline = currentRiskFor(projectId);

  const results = useMemo(() => simulateWhatIf(projectId, activeLevers as WhatIfLever['id'][]), [projectId, activeLevers]);
  const finalRisk = results.length ? results[results.length - 1].resultingRiskPct : baseline;

  return (
    <div className="rounded-xl border border-hair bg-panel p-4">
      <div className="mb-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-[13.5px] font-bold">
          <FlaskConical className="h-4 w-4 text-cyan" /> What-If Simulation
        </div>
        <button onClick={resetLevers} className="font-mono text-[10.5px] text-txt-tertiary hover:text-txt-secondary">
          Reset
        </button>
      </div>

      <div className="mb-4 flex items-center gap-4 rounded-lg border border-hair bg-panel2 px-3.5 py-3">
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-wide text-txt-tertiary">Current Risk</div>
          <div className="font-display text-[22px] font-bold">{baseline}%</div>
        </div>
        <div className="text-txt-tertiary">→</div>
        <div>
          <div className="font-mono text-[9.5px] uppercase tracking-wide text-txt-tertiary">Simulated Risk</div>
          <div className="font-display text-[22px] font-bold text-cyan">{finalRisk}%</div>
        </div>
        <span className="ml-auto rounded-full border border-cyanline bg-cyan-glow px-2.5 py-1 font-mono text-[9.5px] text-cyan">SIMULATED ESTIMATE</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {WHAT_IF_LEVER_DEFS.map((lever) => {
          const active = activeLevers.includes(lever.id);
          return (
            <button
              key={lever.id}
              onClick={() => toggleLever(lever.id)}
              className={clsx(
                'rounded-lg border px-3 py-2 text-left text-[12px] transition-colors',
                active ? 'border-cyanline bg-cyan-glow text-cyan' : 'border-hair bg-panel2 text-txt-secondary hover:border-mid'
              )}
            >
              {lever.label}
            </button>
          );
        })}
      </div>

      {results.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {results.map((r, i) => (
            <div key={r.id} className="flex items-center justify-between text-[11.5px]">
              <span className="text-txt-tertiary">
                {i + 1}. {r.label}
              </span>
              <span className="font-mono font-semibold text-cyan">{r.resultingRiskPct}%</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex justify-end">
        <Button variant="primary">Select Recommended Action</Button>
      </div>
    </div>
  );
}
