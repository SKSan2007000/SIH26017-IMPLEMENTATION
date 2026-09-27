'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  FolderKanban,
  AlertTriangle,
  Clock,
  TrendingUp,
  Map,
  Box,
  Layers,
  ShieldAlert,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  FileSpreadsheet,
  Activity,
  Award,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DemoFlag, GlassPanel, PanelHead, Button } from '@/components/ui/Primitives';
import { useAppStore } from '@/lib/store/useAppStore';
import { MOCK_PROJECTS } from '@/lib/mock/projects';
import clsx from 'clsx';

const MapCommand = dynamic(() => import('@/components/gis/MapCommand').then((m) => m.MapCommand), { ssr: false });

export default function ProjectHeadDashboard() {
  const router = useRouter();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);

  const selectedProject = MOCK_PROJECTS.find((p) => p.id === selectedProjectId) || MOCK_PROJECTS[0];

  const handleSelectProject = (id: string) => {
    setSelectedProject(id);
  };

  return (
    <AppShell>
      <AuthGuard allowedRoles={['PROJECT_HEAD', 'SUPER_ADMIN']}>
        {/* Top Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-glow border border-cyanline px-2 py-0.5 font-mono text-[10px] font-bold text-cyan">
              PROJECT HEAD
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              National Infrastructure Portfolio & AI Delay Forecast
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Executive oversight of 10 national highway, freight, and expressway corridors across Tamil Nadu
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reports">
            <button className="flex items-center gap-1.5 rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary hover:border-cyan hover:text-cyan">
              <FileSpreadsheet className="h-3.5 w-3.5" /> Export Portfolio Report
            </button>
          </Link>
          <DemoFlag />
        </div>
      </div>

      {/* Top 8 Executive KPI Cards */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard label="Portfolio Value" value="₹34,800 Cr" sub="10 Active Corridors" />
        <StatCard label="Active Projects" value="10" sub="Tamil Nadu Grid" />
        <StatCard label="Critical Risk" value="3" sub="Delay > 6 months" isAlert />
        <StatCard label="High Risk" value="4" sub="Intervention needed" isWarning />
        <StatCard label="Avg Acquisition Delay" value="4.2 Mo" sub="AI predictive forecast" />
        <StatCard label="Land Required" value="2,410 Ac" sub="84% notified" />
        <StatCard label="Pending Comp." value="₹680 Cr" sub="Disbursement stage" />
        <StatCard label="Bottlenecks" value="5" sub="Active escalations" isAlert />
      </div>

      {/* Main Grid: Left 2 Cols (Portfolio & Risk), Right Col (Mini GIS & Delay Intelligence) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols */}
        <div className="space-y-4 lg:col-span-2">
          {/* Project Portfolio Table */}
          <div className="overflow-hidden rounded-xl border border-hair bg-panel">
            <div className="flex items-center justify-between border-b border-hair p-3.5 bg-panel2/60">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-cyan" />
                <h3 className="font-display text-[14px] font-bold text-txt-primary">
                  Corridor Portfolio Matrix ({MOCK_PROJECTS.length} Projects)
                </h3>
              </div>
              <span className="font-mono text-[10px] text-txt-tertiary">Click row to inspect</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-hair bg-raised/40 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                    <th className="px-3.5 py-2.5">Corridor / Code</th>
                    <th className="px-3.5 py-2.5">District</th>
                    <th className="px-3.5 py-2.5">Budget</th>
                    <th className="px-3.5 py-2.5">Land Area</th>
                    <th className="px-3.5 py-2.5">Stage</th>
                    <th className="px-3.5 py-2.5">AI Delay Risk</th>
                    <th className="px-3.5 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PROJECTS.map((p) => {
                    const isSelected = p.id === selectedProjectId;
                    const isCritical = p.riskBand === 'critical';
                    const isHigh = p.riskBand === 'high';
                    return (
                      <tr
                        key={p.id}
                        onClick={() => handleSelectProject(p.id)}
                        className={clsx(
                          'border-b border-hair/60 cursor-pointer transition-colors hover:bg-panel2/70',
                          isSelected && 'bg-cyan-glow/20'
                        )}
                      >
                        <td className="px-3.5 py-3">
                          <div className="font-medium text-txt-primary">{p.name}</div>
                          <div className="font-mono text-[10.5px] text-cyan">{p.id}</div>
                        </td>

                        <td className="px-3.5 py-3 text-txt-secondary">{p.district}</td>

                        <td className="px-3.5 py-3 font-mono font-medium text-txt-primary">
                          ₹{p.estimatedBudgetCr} Cr
                        </td>

                        <td className="px-3.5 py-3 font-mono text-txt-secondary">
                          {p.requiredLandAreaAcres} Ac
                        </td>

                        <td className="px-3.5 py-3">
                          <span className="rounded bg-panel2 border border-hair px-2 py-0.5 font-mono text-[10px] text-txt-secondary">
                            {p.status}
                          </span>
                        </td>

                        <td className="px-3.5 py-3">
                          <span
                            className={clsx(
                              'rounded px-2 py-0.5 font-mono text-[10.5px] font-bold',
                              isCritical && 'bg-risk-critical/20 text-risk-critical border border-risk-critical/40',
                              isHigh && 'bg-risk-high/20 text-risk-high border border-risk-high/40',
                              !isCritical && !isHigh && 'bg-risk-low/20 text-risk-low border border-risk-low/40'
                            )}
                          >
                            {p.riskScore || 50}/100 • {(p.riskBand || 'HIGH').toUpperCase()}
                          </span>
                        </td>

                        <td className="px-3.5 py-3 text-right">
                          <Link href="/route-planning" onClick={() => handleSelectProject(p.id)}>
                            <button className="flex items-center gap-1 rounded border border-hair bg-panel2 px-2 py-1 font-mono text-[10px] text-txt-secondary hover:border-cyan hover:text-cyan">
                              <span>Analyze</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Risk & Route Alternatives Section */}
          <div className="grid grid-cols-2 gap-4">
            <GlassPanel className="p-4">
              <PanelHead title="AI Risk Drivers & Explainability" sub={selectedProject.name} />
              <div className="mt-3 space-y-2.5 text-[12px]">
                <div className="flex items-center justify-between rounded-lg border border-hair bg-panel2 p-2.5">
                  <span className="text-txt-secondary">Title & Legal Disputes</span>
                  <span className="font-mono font-bold text-risk-critical">+32% Risk Weight</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-hair bg-panel2 p-2.5">
                  <span className="text-txt-secondary">Commercial Displacement</span>
                  <span className="font-mono font-bold text-risk-high">+24% Risk Weight</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-hair bg-panel2 p-2.5">
                  <span className="text-txt-secondary">SLA Verification Breaches</span>
                  <span className="font-mono font-bold text-risk-medium">+18% Risk Weight</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-hair bg-panel2 p-2.5">
                  <span className="text-txt-secondary">Environmental / Water Body Crossing</span>
                  <span className="font-mono font-bold text-cyan">+12% Risk Weight</span>
                </div>
              </div>
            </GlassPanel>

            <GlassPanel className="p-4">
              <PanelHead title="Executive Action Recommendations" sub="Closed-loop decisions" />
              <div className="mt-3 space-y-2 text-[12px]">
                <div className="rounded-lg border border-cyanline/40 bg-cyan-glow/20 p-2.5">
                  <div className="font-semibold text-cyan">Re-align around Kanchipuram bypass</div>
                  <div className="text-[11px] text-txt-secondary mt-0.5">
                    Estimated 4.8 months saved and 42 fewer legal disputes.
                  </div>
                </div>
                <div className="rounded-lg border border-hair bg-panel2 p-2.5">
                  <div className="font-semibold text-txt-primary">Fast-track Section 11 Notices for Salem ORR</div>
                  <div className="text-[11px] text-txt-secondary mt-0.5">
                    Prevents 60-day delay in compensation disbursement.
                  </div>
                </div>
                <div className="rounded-lg border border-hair bg-panel2 p-2.5">
                  <div className="font-semibold text-txt-primary">Deploy 2 Additional Field Surveyors in Madurai</div>
                  <div className="text-[11px] text-txt-secondary mt-0.5">
                    Clears 86 pending ground verifications within 7 days.
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>

        {/* Right Col: Mini GIS & Quick Navigation */}
        <div className="space-y-4">
          <GlassPanel className="p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-display text-[13.5px] font-bold">Regional GIS Command</div>
              <span className="font-mono text-[10px] text-cyan">LIVE 2D/3D SYNC</span>
            </div>
            <div className="h-64 overflow-hidden rounded-lg border border-hair">
              <MapCommand onSelectProject={handleSelectProject} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/gis">
                <Button className="w-full text-[11px] py-1.5">
                  <Map className="h-3.5 w-3.5 text-cyan" /> 2D GIS Map
                </Button>
              </Link>
              <Link href="/twin">
                <Button className="w-full text-[11px] py-1.5">
                  <Box className="h-3.5 w-3.5 text-cyan" /> 3D Digital Twin
                </Button>
              </Link>
            </div>
          </GlassPanel>

          {/* Selected Project Intelligence Card */}
          <GlassPanel className="p-4 space-y-3">
            <div className="border-b border-hair pb-2.5">
              <div className="font-mono text-[9px] uppercase tracking-wider text-txt-tertiary">Selected Corridor</div>
              <div className="font-display text-[15px] font-bold text-txt-primary">{selectedProject.name}</div>
              <div className="font-mono text-[11px] text-cyan">{selectedProject.id}</div>
            </div>

            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-txt-tertiary">Target Completion:</span>
                <span className="font-mono font-medium text-txt-primary">{selectedProject.targetCompletion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-tertiary">Required Land Area:</span>
                <span className="font-mono font-medium text-txt-primary">{selectedProject.requiredLandAreaAcres} Acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-tertiary">Estimated Budget:</span>
                <span className="font-mono font-medium text-txt-primary">₹{selectedProject.estimatedBudgetCr} Cr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-tertiary">Current Stage:</span>
                <span className="font-medium text-txt-primary">{selectedProject.status}</span>
              </div>
            </div>

            <div className="pt-2">
              <Link href="/route-planning">
                <Button variant="primary" className="w-full text-[12px] py-2">
                  <Sparkles className="h-3.5 w-3.5" /> Open Multi-Design Studio
                </Button>
              </Link>
            </div>
          </GlassPanel>
        </div>
      </div>
      </AuthGuard>
    </AppShell>
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
