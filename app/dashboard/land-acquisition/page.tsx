'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Layers,
  FileCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Upload,
  MessageSquare,
  ArrowUpRight,
  ShieldCheck,
  Plus,
  RotateCcw,
  Navigation,
  FileText,
  Map,
  Box,
  Compass,
  GitPullRequest,
  Check,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, GlassPanel, PanelHead, Button } from '@/components/ui/Primitives';
import { useAppStore } from '@/lib/store/useAppStore';
import { MOCK_PROJECTS, getMockProject } from '@/lib/mock/projects';
import { generateMockParcels } from '@/lib/mock/parcels';
import { MOCK_STAKEHOLDERS } from '@/lib/mock/stakeholders';
import { api } from '@/lib/api';
import type { Project, Parcel } from '@/types';
import clsx from 'clsx';

function LandAcquisitionOfficerContent() {
  const searchParams = useSearchParams();
  const requestedProjectId = searchParams.get('project');
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);

  const [allProjects, setAllProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [activeProject, setActiveProject] = useState<Project>(() => {
    if (requestedProjectId) {
      const found = getMockProject(requestedProjectId) || MOCK_PROJECTS.find(p => p.id === requestedProjectId);
      if (found) return found;
    }
    return MOCK_PROJECTS[0];
  });

  useEffect(() => {
    async function loadProjects() {
      try {
        const remote = await api.getProjects();
        if (remote && remote.length > 0) {
          setAllProjects(remote);
          if (requestedProjectId) {
            const m = remote.find((p: Project) => p.id === requestedProjectId);
            if (m) setActiveProject(m);
          }
        }
      } catch {}
    }
    loadProjects();
  }, [requestedProjectId]);

  useEffect(() => {
    if (requestedProjectId) {
      const found = allProjects.find(p => p.id === requestedProjectId) || getMockProject(requestedProjectId);
      if (found) setActiveProject(found);
    }
  }, [requestedProjectId, allProjects]);

  const parcels = useMemo(() => {
    return generateMockParcels(activeProject.id, activeProject.coords);
  }, [activeProject]);

  const [selectedParcelId, setSelectedParcelId] = useState<string>(parcels[0]?.id || 'P-001');

  useEffect(() => {
    if (parcels.length > 0 && !parcels.find((p: Parcel) => p.id === selectedParcelId)) {
      setSelectedParcelId(parcels[0].id);
    }
  }, [parcels, selectedParcelId]);

  const [remarks, setRemarks] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const activeParcel = parcels.find((p: Parcel) => p.id === selectedParcelId) || parcels[0] || {
    id: 'PAR-101',
    surveyNo: 'SF-104/1A',
    village: activeProject.district,
    areaAcres: 2.4,
    compensationCr: 0.65,
    riskBand: 'high',
    ownerRef: 'DEMO OWNER-01',
    landUse: 'Agricultural Patta',
  };

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleAction = (actionType: string) => {
    showNotification(`Action "${actionType}" recorded & SHA-256 audit event generated for parcel ${activeParcel.id}.`);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-2.5 border-b border-hair pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
              LAND ACQUISITION OFFICER
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              LAO Operational Workspace & Acquisition Pipeline
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Corridor acquisition dossiers, statutory Section 11/19 stages, awards calculation & objection hearings
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Project Selector */}
          <div className="flex items-center gap-1.5 rounded-lg border border-hair bg-panel px-2.5 py-1.5">
            <span className="text-[11px] font-mono text-txt-tertiary">PROJECT:</span>
            <select
              value={activeProject.id}
              onChange={(e) => {
                const found = allProjects.find(p => p.id === e.target.value);
                if (found) setActiveProject(found);
              }}
              className="bg-transparent text-[12px] font-bold text-amber-400 focus:outline-none cursor-pointer"
            >
              {allProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.id} • {p.name} ({p.district})
                </option>
              ))}
            </select>
          </div>

          <Link href={`/designs?project=${activeProject.id}`}>
            <button className="flex items-center gap-1 rounded-lg border border-purple-500/40 bg-purple-950/40 px-3 py-1.5 font-mono text-[11px] font-semibold text-purple-300 hover:bg-purple-900/50">
              <GitPullRequest className="h-3.5 w-3.5 text-purple-400" /> Multi-Design Studio
            </button>
          </Link>
          <DemoFlag />
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard label="Assigned Parcels" value={activeProject.parcelsCount.toString()} sub={activeProject.name} />
        <StatCard label="Sec 11 Notified" value={Math.round(activeProject.parcelsCount * 0.75).toString()} sub="Preliminary notice" />
        <StatCard label="Sec 19 Declared" value={Math.round(activeProject.parcelsCount * 0.5).toString()} sub="Declaration phase" />
        <StatCard label="Awards Computed" value={`₹${Math.round(activeProject.estimatedBudgetCr * 0.35)} Cr`} sub="LARR 2013 formula" />
        <StatCard label="Disputes Pending" value="6" sub="Hearing required" isAlert />
        <StatCard label="Verified Ground" value={Math.round(activeProject.parcelsCount * 0.65).toString()} sub="GPS confirmed" />
        <StatCard label="SLA Countdown" value="00:32" sub="Demo SLA: 45s" isWarning />
        <StatCard label="Audit Chained" value="100%" sub="SHA-256 verified" />
      </div>

      {/* Main Split: Parcel Queue & Selected Parcel Dossier */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Parcel Queue Table */}
        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-hair bg-panel">
            <div className="flex items-center justify-between border-b border-hair p-3.5 bg-panel2/60">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan" />
                <h3 className="font-display text-[14px] font-bold text-txt-primary">
                  Assigned Parcel Acquisition Queue ({parcels.length} Parcels)
                </h3>
              </div>
              <span className="font-mono text-[10.5px] text-txt-tertiary">Click parcel to manage</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-hair bg-raised/40 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                    <th className="px-3.5 py-2.5">Parcel ID</th>
                    <th className="px-3.5 py-2.5">Survey / Village</th>
                    <th className="px-3.5 py-2.5">Owner / Stakeholder</th>
                    <th className="px-3.5 py-2.5">Acquisition Stage</th>
                    <th className="px-3.5 py-2.5">Est. Award</th>
                    <th className="px-3.5 py-2.5">Risk Band</th>
                    <th className="px-3.5 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hair">
                  {parcels.slice(0, 12).map((p: Parcel) => {
                    const isSelected = p.id === activeParcel.id;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedParcelId(p.id)}
                        className={clsx(
                          'cursor-pointer transition-colors hover:bg-panel2/60',
                          isSelected && 'bg-cyan-glow/20'
                        )}
                      >
                        <td className="px-3.5 py-3">
                          <div className="font-mono font-bold text-cyan">{p.id}</div>
                          <div className="font-mono text-[10px] text-txt-tertiary">{p.areaAcres || 1.5} Acres</div>
                        </td>

                        <td className="px-3.5 py-3">
                          <div className="text-txt-primary font-medium">{p.surveyNo || 'SF-104/1A'}</div>
                          <div className="text-[11px] text-txt-secondary">{p.village || activeProject.district}</div>
                        </td>

                        <td className="px-3.5 py-3 text-txt-secondary">
                          <div className="font-medium text-txt-primary">{p.ownerRef}</div>
                          <div className="font-mono text-[10.5px] text-txt-tertiary">{p.landUse || p.landType}</div>
                        </td>

                        <td className="px-3.5 py-3">
                          <span className="rounded bg-panel2 border border-hair px-2 py-0.5 font-mono text-[10px] text-txt-secondary">
                            Section 19 Declaration
                          </span>
                        </td>

                        <td className="px-3.5 py-3 font-mono font-semibold text-txt-primary">
                          ₹{(p.compensationCr || 0.45).toFixed(2)} Cr
                        </td>

                        <td className="px-3.5 py-3">
                          <span
                            className={clsx(
                              'rounded px-2 py-0.5 font-mono text-[10px] font-bold',
                              p.riskBand === 'critical' ? 'bg-risk-critical/20 text-risk-critical' : 'bg-risk-high/20 text-risk-high'
                            )}
                          >
                            {(p.riskBand || 'HIGH').toUpperCase()}
                          </span>
                        </td>

                        <td className="px-3.5 py-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedParcelId(p.id);
                            }}
                            className="rounded border border-hair bg-panel2 px-2.5 py-1 font-mono text-[10.5px] text-txt-secondary hover:border-cyan hover:text-cyan"
                          >
                            Dossier
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Col: Officer Operational Dossier & Interactive Actions */}
        <div className="space-y-4">
          <GlassPanel className="p-4 space-y-3.5">
            <div className="border-b border-hair pb-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9.5px] uppercase tracking-wider text-txt-tertiary">Active Dossier</span>
                <span className="rounded bg-panel2 border border-hair px-2 py-0.5 font-mono text-[10px] text-cyan">
                  {(activeParcel.riskBand || 'HIGH').toUpperCase()} RISK
                </span>
              </div>
              <div className="mt-1 font-display text-[16px] font-bold text-txt-primary">{activeParcel.id}</div>
              <div className="font-mono text-[11px] text-txt-secondary">{activeParcel.surveyNo || 'SF-104/1A'} • {activeParcel.village || activeProject.district}</div>
            </div>

            <div className="space-y-2 rounded-lg border border-hair bg-panel2 p-3 text-[12px]">
              <div className="flex justify-between">
                <span className="text-txt-tertiary">Owner / Claimant:</span>
                <span className="font-medium text-txt-primary">{activeParcel.ownerRef}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-tertiary">Required Area:</span>
                <span className="font-mono text-txt-primary">{activeParcel.areaAcres || 1.5} Acres</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-tertiary">Computed Award:</span>
                <span className="font-mono font-bold text-risk-low">₹{(activeParcel.compensationCr || 0.45).toFixed(2)} Cr</span>
              </div>
              <div className="flex justify-between">
                <span className="text-txt-tertiary">Ground GPS Lock:</span>
                <span className="font-mono text-cyan">CONFIRMED (±0.4m)</span>
              </div>
            </div>

            {/* Officer Remarks Form */}
            <div>
              <label className="block font-mono text-[10px] uppercase text-txt-tertiary mb-1">LAO Case Remarks / Directives</label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter statutory notes, compensation adjustments or hearing remarks…"
                rows={2}
                className="w-full rounded-lg border border-hair bg-panel2 p-2 text-[12px] text-txt-primary outline-none focus:border-cyan"
              />
            </div>

            {/* Operational Action Buttons */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="primary" onClick={() => handleAction('Approve Section 19 Award')} className="text-[11px] py-2">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve Award
                </Button>
                <Button onClick={() => handleAction('Issue Section 11 Notice')} className="text-[11px] py-2">
                  <FileText className="h-3.5 w-3.5" /> Issue Notice
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button onClick={() => handleAction('Escalate Dispute to Collectorate')} className="text-[11px] py-2 text-risk-critical hover:border-risk-critical">
                  <AlertTriangle className="h-3.5 w-3.5" /> Escalate Dispute
                </Button>
                <Button onClick={() => handleAction('Resolve Bottleneck')} className="text-[11px] py-2 text-risk-low hover:border-risk-low">
                  <ShieldCheck className="h-3.5 w-3.5" /> Clear Bottleneck
                </Button>
              </div>

              <div className="flex gap-2 pt-1">
                <Link href={`/gis?project=${activeProject.id}`} onClick={() => setSelectedParcel(activeParcel.id)} className="flex-1">
                  <Button className="w-full text-[11px] py-1.5">
                    <Map className="h-3 w-3 text-cyan" /> 2D GIS
                  </Button>
                </Link>
                <Link href={`/twin?project=${activeProject.id}`} onClick={() => setSelectedParcel(activeParcel.id)} className="flex-1">
                  <Button className="w-full text-[11px] py-1.5">
                    <Box className="h-3 w-3 text-cyan" /> 3D Twin
                  </Button>
                </Link>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

export default function LandAcquisitionOfficerDashboard() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-cyan animate-pulse">Loading Land Acquisition Workspace...</div>}>
        <LandAcquisitionOfficerContent />
      </Suspense>
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
