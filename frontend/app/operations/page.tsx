'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Layers,
  Users,
  HardHat,
  GitPullRequest,
  Check,
  AlertOctagon,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, GlassPanel, PanelHead, Button } from '@/components/ui/Primitives';
import { useAppStore } from '@/lib/store/useAppStore';
import clsx from 'clsx';

interface InterventionRecord {
  id: string;
  project: string;
  action: string;
  riskBefore: number;
  riskAfter: number;
  delayBefore: string;
  delayAfter: string;
  improvement: string;
  timestamp: string;
}

const INTERVENTIONS: InterventionRecord[] = [
  { id: 'INT-1042-01', project: 'Chennai-Bengaluru (PRJ-1042)', action: 'Bypass Alignment Offset (Design D)', riskBefore: 78, riskAfter: 28, delayBefore: '8.4 Mo', delayAfter: '3.6 Mo', improvement: '-57% Risk / -4.8 Mo Delay', timestamp: '2026-08-30 14:22' },
  { id: 'INT-1088-02', project: 'Salem Outer Ring Road (PRJ-1088)', action: 'Auto-assigned 2 Additional Surveyors', riskBefore: 64, riskAfter: 35, delayBefore: '5.2 Mo', delayAfter: '2.1 Mo', improvement: '-45% Risk / -3.1 Mo Delay', timestamp: '2026-08-31 09:40' },
  { id: 'INT-1015-03', project: 'Coimbatore Logistics Belt (PRJ-1015)', action: 'Fast-Track RFCTLARR Section 19 Awards', riskBefore: 58, riskAfter: 22, delayBefore: '4.6 Mo', delayAfter: '1.4 Mo', improvement: '-62% Risk / -3.2 Mo Delay', timestamp: '2026-09-01 11:15' },
];

export default function DailyOperationsPage() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const [interventions, setInterventions] = useState<InterventionRecord[]>(INTERVENTIONS);
  const [activeOpsTab, setActiveOpsTab] = useState<'All' | 'Critical' | 'High' | 'Pending' | 'Overdue' | 'Completed'>('All');
  const [toast, setToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleTriggerIntervention = () => {
    const newInt: InterventionRecord = {
      id: `INT-1042-${Math.floor(10 + Math.random() * 90)}`,
      project: 'Chennai-Bengaluru (PRJ-1042)',
      action: 'Automated Cadastral Boundary Realignment & Priority Hearing',
      riskBefore: 72,
      riskAfter: 31,
      delayBefore: '6.8 Mo',
      delayAfter: '2.4 Mo',
      improvement: '-56% Risk / -4.4 Mo Delay',
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setInterventions([newInt, ...interventions]);
    showNotification('Closed-Loop AI Intervention Executed: Risk recalculated and updated across portfolio!');
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-glow border border-cyanline px-2 py-0.5 font-mono text-[10px] font-bold text-cyan">
              OPERATIONS COMMAND
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              Daily Operations Queue & Closed-Loop AI System
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Real-time daily operational directives, SLA escalation timers, and predictive closed-loop intervention loop
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-cyanline bg-cyan-glow/40 px-3 py-1 font-mono text-[11px] text-cyan">
            <Clock className="h-3 w-3" /> DEMO SLA: 45 SECONDS
          </div>
          <DemoFlag />
        </div>
      </div>

      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      {/* CLOSED-LOOP AI FLOW DIAGRAM (Prominent Differentiator) */}
      <div className="mb-5 rounded-2xl border border-cyanline/50 bg-gradient-to-r from-raised via-panel to-raised p-4 shadow-2xl backdrop-blur-md">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan" />
            <h3 className="font-display text-[14.5px] font-bold text-white tracking-wide">
              Closed-Loop AI Decision & Autonomous Recalculation Loop
            </h3>
          </div>
          <button
            onClick={handleTriggerIntervention}
            className="flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-cyan to-cyan-dim px-3 py-1 font-mono text-[11px] font-bold text-[#05131a] shadow-glow hover:opacity-90"
          >
            <Zap className="h-3.5 w-3.5" /> Trigger Closed-Loop Intervention
          </button>
        </div>

        {/* 9-Stage Connected Sequence */}
        <div className="flex flex-wrap items-center justify-between gap-1 rounded-xl border border-hair bg-panel2/60 p-2.5 text-center text-[10.5px] font-mono">
          <FlowStep label="PREDICT" sub="ML Model" color="text-cyan" />
          <span className="text-txt-tertiary">→</span>
          <FlowStep label="ALERT" sub="Risk Spike" color="text-risk-critical" />
          <span className="text-txt-tertiary">→</span>
          <FlowStep label="ASSIGN" sub="Auto-Officer" color="text-risk-high" />
          <span className="text-txt-tertiary">→</span>
          <FlowStep label="ACT" sub="Intervene" color="text-txt-primary" />
          <span className="text-txt-tertiary">→</span>
          <FlowStep label="VERIFY" sub="GPS Ground" color="text-risk-low" />
          <span className="text-txt-tertiary">→</span>
          <FlowStep label="UPDATE" sub="PostGIS DB" color="text-cyan" />
          <span className="text-txt-tertiary">→</span>
          <FlowStep label="RECALCULATE" sub="AI Score" color="text-amber-300" />
          <span className="text-txt-tertiary">→</span>
          <FlowStep label="MEASURE" sub="Net Saved" color="text-risk-low font-bold" />
        </div>
      </div>

      {/* KPI Stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard label="Critical Actions" value="4" sub="Immediate action" isAlert />
        <StatCard label="High Priority" value="9" sub="Due today" isWarning />
        <StatCard label="SLA Breaches" value="2" sub="Escalated to DO" isAlert />
        <StatCard label="Officer Auto-Assign" value="18" sub="Optimized by load" />
        <StatCard label="Grievances Filed" value="3" sub="Hearing queued" />
        <StatCard label="Contractor Delays" value="1" sub="KM 18 Clashes" />
        <StatCard label="Design Changes" value="2" sub="v1 → v2 pending" />
        <StatCard label="Avg Risk Reduction" value="-48%" sub="Post-intervention" />
      </div>

      {/* Main Grid: Left 2 Cols (Today's Priority Queue), Right Col (Intervention History) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Daily Operations Queue */}
        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-hair bg-panel">
            <div className="flex items-center justify-between border-b border-hair p-3.5 bg-panel2/60">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-cyan" />
                <h3 className="font-display text-[14px] font-bold text-txt-primary">
                  Today&apos;s Priority Operational Actions
                </h3>
              </div>
              <span className="font-mono text-[10.5px] text-txt-tertiary">Daily Queue • 2026-09-02</span>
            </div>

            <div className="divide-y divide-hair">
              {/* Item 1 */}
              <div className="p-4 space-y-2 hover:bg-panel2/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-risk-critical/20 text-risk-critical border border-risk-critical/40 px-2 py-0.5 font-mono text-[10px] font-bold">
                      CRITICAL • 00:18 SLA LEFT
                    </span>
                    <span className="font-mono text-[12px] text-cyan font-bold">PAR-1042-004</span>
                  </div>
                  <span className="font-mono text-[11px] text-txt-tertiary">Chennai-Bengaluru</span>
                </div>
                <div className="font-semibold text-txt-primary text-[13px]">
                  Commercial Structure Obstruction on KM 14.2 Right-of-Way
                </div>
                <div className="text-[12px] text-txt-secondary leading-relaxed">
                  Automated Officer Assignment: R. Vignesh dispatched for joint revenue spot-inspection. Re-alignment simulation indicates 32m ROW reduces commercial demolition by 80%.
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href="/field">
                    <button className="rounded border border-cyanline bg-cyan-glow/30 px-3 py-1 font-mono text-[11px] text-cyan hover:bg-cyan hover:text-[#05131a]">
                      Dispatch Officer
                    </button>
                  </Link>
                  <Link href="/route-planning">
                    <button className="rounded border border-hair bg-panel2 px-3 py-1 font-mono text-[11px] text-txt-secondary hover:border-mid hover:text-white">
                      Simulate 32m ROW Offset
                    </button>
                  </Link>
                </div>
              </div>

              {/* Item 2 */}
              <div className="p-4 space-y-2 hover:bg-panel2/40 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-risk-high/20 text-risk-high border border-risk-high/40 px-2 py-0.5 font-mono text-[10px] font-bold">
                      HIGH • 00:39 SLA LEFT
                    </span>
                    <span className="font-mono text-[12px] text-cyan font-bold">PRJ-1088-RT-A</span>
                  </div>
                  <span className="font-mono text-[11px] text-txt-tertiary">Salem Outer Ring Road</span>
                </div>
                <div className="font-semibold text-txt-primary text-[13px]">
                  Section 11(1) Preliminary Notification Statutory Expiry
                </div>
                <div className="text-[12px] text-txt-secondary leading-relaxed">
                  36 parcels in Omalur Taluk reaching 60-day inquiry deadline. Fast-track award draft generation required to prevent procedural lapse.
                </div>
                <div className="flex gap-2 pt-1">
                  <Link href="/dashboard/land-acquisition">
                    <button className="rounded border border-hair bg-panel2 px-3 py-1 font-mono text-[11px] text-txt-secondary hover:border-cyan hover:text-cyan">
                      Open LAO Workspace
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Intervention History & Escalation Hierarchy */}
        <div className="space-y-4">
          {/* Closed-Loop Intervention History */}
          <GlassPanel className="p-4 space-y-3">
            <PanelHead title="Recent AI Interventions & Verified Gain" sub="Impact Audit" />

            <div className="space-y-2.5">
              {interventions.map((rec) => (
                <div key={rec.id} className="rounded-xl border border-hair bg-panel2 p-3 space-y-2 text-[12px]">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan text-[11.5px]">{rec.id}</span>
                    <span className="font-mono text-[10px] text-txt-tertiary">{rec.timestamp}</span>
                  </div>
                  <div className="font-semibold text-txt-primary">{rec.action}</div>
                  <div className="grid grid-cols-2 gap-2 rounded-lg bg-raised p-2 font-mono text-[11px]">
                    <div>
                      <span className="text-txt-tertiary">Risk: </span>
                      <span className="text-risk-critical">{rec.riskBefore}</span> → <span className="text-risk-low font-bold">{rec.riskAfter}</span>
                    </div>
                    <div>
                      <span className="text-txt-tertiary">Delay: </span>
                      <span className="text-risk-high">{rec.delayBefore}</span> → <span className="text-risk-low font-bold">{rec.delayAfter}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-mono text-[11px] font-bold text-risk-low">
                    <TrendingDown className="h-3.5 w-3.5 text-risk-low" /> {rec.improvement}
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>

          {/* 4-Tier Escalation Hierarchy */}
          <GlassPanel className="p-4 space-y-2.5">
            <PanelHead title="Escalation Hierarchy & Timers" sub="Automatic SLA Trigger" />
            <div className="space-y-2 text-[12px]">
              <div className="flex items-center justify-between rounded-lg border border-hair bg-panel2 p-2">
                <span className="font-medium text-txt-primary">1. Field Surveyor</span>
                <span className="font-mono text-[10.5px] text-cyan">SLA: 45s (Demo)</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-hair bg-panel2 p-2">
                <span className="font-medium text-txt-primary">2. Cadastral Supervisor</span>
                <span className="font-mono text-[10.5px] text-amber-400">Escalate @ +1m</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-hair bg-panel2 p-2">
                <span className="font-medium text-txt-primary">3. District Officer (DO)</span>
                <span className="font-mono text-[10.5px] text-risk-high">Escalate @ +2m</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-hair bg-panel2 p-2">
                <span className="font-medium text-txt-primary">4. Project Head / Director</span>
                <span className="font-mono text-[10.5px] text-risk-critical font-bold">Cabinet Flag</span>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </AppShell>
  );
}

function FlowStep({ label, sub, color }: { label: string; sub: string; color: string }) {
  return (
    <div className="px-1.5 py-1">
      <div className={clsx('font-bold text-[11px]', color)}>{label}</div>
      <div className="text-[9px] text-txt-tertiary">{sub}</div>
    </div>
  );
}

function StatCard({ label, value, sub, isAlert, isWarning }: { label: string; value: string; sub: string; isAlert?: boolean; isWarning?: boolean }) {
  return (
    <div className={clsx(
      'rounded-xl border bg-panel p-3',
      isAlert ? 'border-risk-critical/40 bg-risk-critical/10' : isWarning ? 'border-risk-high/40 bg-risk-high/10' : 'border-hair'
    )}>
      <div className="font-mono text-[9px] uppercase tracking-wider text-txt-tertiary">{label}</div>
      <div className={clsx(
        'mt-1 font-display text-[18px] font-bold',
        isAlert ? 'text-risk-critical' : isWarning ? 'text-risk-high' : 'text-txt-primary'
      )}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-txt-tertiary truncate">{sub}</div>
    </div>
  );
}
