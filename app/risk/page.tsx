'use client';

import { useState, useEffect } from 'react';
import clsx from 'clsx';
import { Sparkles, TrendingUp, RefreshCw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, GlassPanel } from '@/components/ui/Primitives';
import { WhatIfPanel } from '@/components/simulation/WhatIfPanel';
import { getMockProject } from '@/lib/mock/projects';
import { PROJECT_STAGES } from '@/types';
import { getMockRisk } from '@/lib/mock/risks';
import { useAppStore } from '@/lib/store/useAppStore';
import { api } from '@/lib/api';
import type { Project, RiskScore } from '@/types';

function bandColor(band: string) {
  return { critical: '#ef5b5b', high: '#f0a742', medium: '#e8d15c', low: '#4fbf7c' }[band] ?? '#38d3f0';
}
function bandTextClass(pct: number) {
  return pct >= 80 ? 'text-risk-critical' : pct >= 60 ? 'text-risk-high' : pct >= 40 ? 'text-risk-medium' : 'text-risk-low';
}

export default function RiskPage() {
  const projectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const [project, setProject] = useState<Project | null>(getMockProject(projectId) || null);
  const [risk, setRisk] = useState<RiskScore | null>(getMockRisk(projectId) || null);
  const [isRecalculating, setIsRecalculating] = useState(false);

  useEffect(() => {
    let mounted = true;
    api.getProject(projectId).then((p) => {
      if (mounted && p) setProject(p);
    });
    api.getProjectRisk(projectId).then((r) => {
      if (mounted && r) setRisk(r);
    });
    return () => {
      mounted = false;
    };
  }, [projectId]);

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const updated = await api.recalculateRisk(projectId);
      if (updated) setRisk(updated);
    } catch {
      // Keep existing state on error
    } finally {
      setIsRecalculating(false);
    }
  };

  if (!project || !risk) return null;
  const color = bandColor(risk.band);

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="font-display text-[20px] font-bold tracking-wide">AI Delay Risk</div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">{project.name} — explainable predictive risk</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className="flex items-center gap-1.5 rounded-lg border border-cyanline/40 bg-cyan-glow/20 px-3 py-1.5 font-mono text-[11px] text-cyan hover:bg-cyan-glow/40 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', isRecalculating && 'animate-spin')} />
            {isRecalculating ? 'Recalculating...' : 'Recalculate AI Risk'}
          </button>
          <DemoFlag />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <GlassPanel className="col-span-2 p-5">
          <div className="flex items-center gap-6">
            <div className="font-display text-[56px] font-bold leading-none" style={{ color }}>
              {risk.overallPct}%
            </div>
            <div>
              <div className="font-mono text-[13px] font-bold tracking-wide" style={{ color }}>
                {risk.band.toUpperCase()}
              </div>
              <div className="mt-1 text-[12.5px] text-txt-secondary">Predicted delay: {risk.predictedDelayLabel}</div>
              <div className="text-[12.5px] text-txt-secondary">Data confidence: {risk.confidencePct}%</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">Risk Trend</h4>
            <div className="flex h-16 items-end gap-2">
              {risk.trend.map((v, i) => (
                <div key={i} className="relative flex-1 rounded-t bg-gradient-to-b from-risk-high to-risk-high/20" style={{ height: `${(v / Math.max(...risk.trend)) * 100}%` }}>
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[10px] text-txt-tertiary">{v}%</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[12px] font-semibold text-risk-high">
              <TrendingUp className="h-3.5 w-3.5" /> {risk.trendStatus}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">Category Risk Breakdown</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {risk.categories.map((c) => (
                <div key={c.name}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="text-txt-secondary">{c.name}</span>
                    <span className={clsx('font-mono font-bold', bandTextClass(c.pct))}>{c.pct}%</span>
                  </div>
                  <div className="h-[5px] overflow-hidden rounded bg-white/[0.08]">
                    <div
                      className={clsx('h-full rounded', c.pct >= 80 ? 'bg-risk-critical' : c.pct >= 60 ? 'bg-risk-high' : c.pct >= 40 ? 'bg-risk-medium' : 'bg-risk-low')}
                      style={{ width: `${c.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h4 className="mb-2.5 font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">Why Is This Project At Risk?</h4>
            {risk.drivers.map((d) => (
              <div key={d.label} className="mb-2.5 flex items-center gap-3 last:mb-0">
                <div className="w-52 flex-shrink-0 text-[12px] text-txt-secondary">{d.label}</div>
                <div className="h-[7px] flex-1 overflow-hidden rounded bg-white/[0.08]">
                  <div className="h-full rounded bg-gradient-to-r from-cyan-dim to-cyan" style={{ width: `${d.contributionPct * 3}%` }} />
                </div>
                <div className="w-11 text-right font-mono text-[12px] font-bold text-cyan">+{d.contributionPct}%</div>
              </div>
            ))}
            <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-dashed border-cyanline bg-cyan-glow px-3 py-2 font-mono text-[10.5px] text-cyan">
              <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
              <span>
                <b className="text-txt-primary">AI PREDICTION</b> · HUMAN DECISION REQUIRED — calibrated multi-feature early warning model.
              </span>
            </div>
          </div>
        </GlassPanel>

        <div className="flex flex-col gap-4">
          <GlassPanel className="p-4">
            <h4 className="mb-3 font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">Delay Timeline</h4>
            <div className="mb-4 grid grid-cols-3 gap-2 text-center">
              <TimelineStat label="Original" value={`${risk.originalCompletionMonths} mo`} />
              <TimelineStat label="Predicted" value={`${risk.predictedCompletionMonths} mo`} accent />
              <TimelineStat label="Delay" value={`+${risk.predictedCompletionMonths - risk.originalCompletionMonths} mo`} accent="risk" />
            </div>
            <div className="flex flex-col">
              {PROJECT_STAGES.map((stage, i) => {
                const isBottleneck = i === project.bottleneckStageIndex;
                const isCurrent = i === project.currentStageIndex;
                const isDone = i < project.currentStageIndex;
                return (
                  <div key={stage} className="relative flex gap-2.5 pb-3 last:pb-0">
                    {i < PROJECT_STAGES.length - 1 && <span className="absolute left-[4px] top-3.5 bottom-[-2px] w-px bg-mid" />}
                    <span
                      className={clsx(
                        'z-10 mt-1 h-[9px] w-[9px] flex-shrink-0 rounded-full border-2',
                        isBottleneck ? 'border-risk-critical bg-risk-critical' : isCurrent ? 'border-cyan bg-cyan' : isDone ? 'border-cyan bg-cyan-dim' : 'border-mid bg-panel2'
                      )}
                    />
                    <div className="text-[11.5px]">
                      <div className={clsx('font-medium', isBottleneck && 'text-risk-critical')}>{stage}</div>
                      {isBottleneck && <div className="text-[10px] text-risk-critical">Predicted bottleneck</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </div>
      </div>

      <div className="mt-4">
        <WhatIfPanel projectId={project.id} />
      </div>
    </AppShell>
  );
}

function TimelineStat({ label, value, accent }: { label: string; value: string; accent?: boolean | 'risk' }) {
  return (
    <div className="rounded-lg border border-hair bg-panel2 px-2 py-2">
      <div className="font-mono text-[8.5px] uppercase tracking-wide text-txt-tertiary">{label}</div>
      <div className={clsx('mt-0.5 font-display text-[14px] font-bold', accent === true && 'text-cyan', accent === 'risk' && 'text-risk-high')}>{value}</div>
    </div>
  );
}
