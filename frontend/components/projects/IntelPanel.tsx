'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X, Sparkles, TrendingUp, Box, Route, ClipboardCheck } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { getMockProject } from '@/lib/mock/projects';
import { PROJECT_STAGES } from '@/types';
import { getMockRisk } from '@/lib/mock/risks';
import { useAppStore } from '@/lib/store/useAppStore';
import { Button } from '@/components/ui/Primitives';

function bandColor(band: string) {
  return { critical: '#ef5b5b', high: '#f0a742', medium: '#e8d15c', low: '#4fbf7c' }[band] ?? '#38d3f0';
}
function bandTextClass(pct: number) {
  return pct >= 80 ? 'text-risk-critical' : pct >= 60 ? 'text-risk-high' : pct >= 40 ? 'text-risk-medium' : 'text-risk-low';
}

export function IntelPanel() {
  const projectId = useAppStore((s) => s.selectedProjectId);
  const intelPanelOpen = useAppStore((s) => s.intelPanelOpen);
  const setIntelPanelOpen = useAppStore((s) => s.setIntelPanelOpen);
  const project = projectId ? getMockProject(projectId) : null;
  const risk = projectId ? getMockRisk(projectId) : null;
  const open = Boolean(intelPanelOpen && project && risk);
  const color = risk ? bandColor(risk.band) : '#38d3f0';

  return (
    <AnimatePresence>
      {open && project && risk && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-[#03060a]/55 backdrop-blur-[2px]"
            onClick={() => setIntelPanelOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed bottom-0 right-0 top-0 z-40 w-[460px] max-w-[92vw] overflow-y-auto border-l border-mid bg-gradient-to-b from-raised to-base shadow-2xl"
          >
            <div className="sticky top-0 z-10 border-b border-hair bg-raised px-5 pb-3.5 pt-[18px]">
              <button onClick={() => setIntelPanelOpen(false)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-panel2 text-txt-secondary hover:text-txt-primary">
                <X className="h-4 w-4" />
              </button>
              <div className="font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">Project · {project.id}</div>
              <div className="mt-1 pr-8 font-display text-[19px] font-bold">{project.name}</div>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-hair bg-panel2 px-2.5 py-1 text-[11px] text-txt-secondary">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                {project.status}
              </div>
            </div>

            <Section title="Overall Delay Risk">
              <div className="flex items-center gap-4">
                <div className="font-display text-[38px] font-bold leading-none" style={{ color }}>
                  {risk.overallPct}%
                </div>
                <div className="flex-1">
                  <div className="mb-1.5 font-mono text-[10.5px] tracking-wide" style={{ color }}>
                    {risk.band.toUpperCase()}
                  </div>
                  <div className="h-1.5 overflow-hidden rounded bg-white/10">
                    <div className="h-full rounded" style={{ width: `${risk.overallPct}%`, background: color }} />
                  </div>
                </div>
              </div>
              <div className="mt-3.5 grid grid-cols-2 gap-2.5">
                <Kpi label="Predicted Delay" value={risk.predictedDelayLabel} />
                <Kpi label="Data Confidence" value={`${risk.confidencePct}%`} />
              </div>
            </Section>

            <Section title="Risk Trend">
              <div className="mt-1.5 flex items-end gap-1.5" style={{ height: 52 }}>
                {risk.trend.map((v, i) => (
                  <div key={i} className="relative flex-1 rounded-t bg-gradient-to-b from-risk-high to-risk-high/20" style={{ height: `${(v / Math.max(...risk.trend)) * 100}%` }}>
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 font-mono text-[9px] text-txt-tertiary">{v}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-[11.5px] font-semibold text-risk-high">
                <TrendingUp className="h-3.5 w-3.5" /> {risk.trendStatus}
              </div>
            </Section>

            <Section title="Category Risk Breakdown">
              {risk.categories.map((c) => (
                <div key={c.name} className="mb-2.5 last:mb-0">
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
            </Section>

            <Section title="Why Is This Project At Risk?">
              {risk.drivers.map((d) => (
                <div key={d.label} className="mb-2.5 flex items-center gap-2.5 last:mb-0">
                  <div className="flex-1 text-[12px] text-txt-secondary">{d.label}</div>
                  <div className="h-[7px] flex-[1.4] overflow-hidden rounded bg-white/[0.08]">
                    <div className="h-full rounded bg-gradient-to-r from-cyan-dim to-cyan" style={{ width: `${d.contributionPct * 3}%` }} />
                  </div>
                  <div className="w-11 text-right font-mono text-[12px] font-bold text-cyan">+{d.contributionPct}%</div>
                </div>
              ))}
              <div className="mt-3.5 flex items-center gap-2 rounded-lg border border-dashed border-cyanline bg-cyan-glow px-2.5 py-2 font-mono text-[10px] text-cyan">
                <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                <span>
                  <b className="text-txt-primary">AI PREDICTION</b> · HUMAN DECISION REQUIRED — demo estimates, not automated determinations.
                </span>
              </div>
            </Section>

            <Section title="Project Timeline" noBorder>
              <div className="flex flex-col">
                {PROJECT_STAGES.map((stage, i) => {
                  const isBottleneck = i === project.bottleneckStageIndex;
                  const isCurrent = i === project.currentStageIndex;
                  const isDone = i < project.currentStageIndex;
                  return (
                    <div key={stage} className="relative flex gap-3 pb-4 last:pb-0">
                      {i < PROJECT_STAGES.length - 1 && <span className="absolute left-[5px] top-4 bottom-[-4px] w-px bg-mid" />}
                      <span
                        className={clsx(
                          'z-10 mt-0.5 h-[11px] w-[11px] flex-shrink-0 rounded-full border-2',
                          isBottleneck ? 'border-risk-critical bg-risk-critical shadow-[0_0_0_4px_rgba(239,91,91,0.18)]' : isCurrent ? 'border-cyan bg-cyan shadow-[0_0_0_4px_rgba(56,211,240,0.16)]' : isDone ? 'border-cyan bg-cyan-dim' : 'border-mid bg-panel2'
                        )}
                      />
                      <div>
                        <div className="text-[12.5px] font-semibold">{stage}</div>
                        {isBottleneck && <div className="mt-0.5 text-[10.5px] text-risk-critical">Predicted bottleneck</div>}
                        {!isBottleneck && isCurrent && <div className="mt-0.5 text-[10.5px] text-txt-tertiary">Current stage</div>}
                        {!isBottleneck && isDone && <div className="mt-0.5 text-[10.5px] text-txt-tertiary">Complete</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            <div className="flex flex-col gap-2 px-5 pb-6 pt-4">
              <Link href="/twin" onClick={() => {}}>
                <Button variant="primary" className="w-full">
                  <Box className="h-3.5 w-3.5" /> View in 3D Project Twin
                </Button>
              </Link>
              <Link href="/route-planning">
                <Button className="w-full">
                  <Route className="h-3.5 w-3.5" /> Open Route Comparison
                </Button>
              </Link>
              <Link href="/risk">
                <Button className="w-full">
                  <ClipboardCheck className="h-3.5 w-3.5" /> Open Full AI Delay Risk + What-If
                </Button>
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ title, children, noBorder }: { title: string; children: React.ReactNode; noBorder?: boolean }) {
  return (
    <div className={clsx('px-5 py-4', !noBorder && 'border-b border-hair')}>
      <h4 className="mb-3 font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">{title}</h4>
      {children}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-hair bg-panel2 px-2.5 py-2">
      <div className="font-mono text-[9.5px] uppercase tracking-wide text-txt-tertiary">{label}</div>
      <div className="mt-0.5 font-display font-mono text-[16px] font-bold">{value}</div>
    </div>
  );
}
