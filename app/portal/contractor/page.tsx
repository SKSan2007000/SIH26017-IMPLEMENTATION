'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  HardHat,
  FolderKanban,
  TrendingUp,
  AlertTriangle,
  Upload,
  Camera,
  Video,
  FileCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  GitPullRequest,
  Layers,
  ArrowRight,
  ShieldCheck,
  Download,
  Compass,
  FileText,
  Sliders,
  Maximize2,
  MapPin,
  Check,
  HelpCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DemoFlag, GlassPanel, PanelHead, Button } from '@/components/ui/Primitives';
import { ChangeRequestModal } from '@/components/designs/ChangeRequestModal';
import { DesignPackageModal } from '@/components/designs/DesignPackageModal';
import { MOCK_PROJECTS, getMockProject } from '@/lib/mock/projects';
import { generateMockParcels } from '@/lib/mock/parcels';
import { api } from '@/lib/api';
import { downloadGeoJsonAlignment, downloadCsvSummary, generateAndDownloadPdfReport } from '@/lib/utils/designPackageExport';
import type { Project, Parcel, DesignPackage } from '@/types';
import clsx from 'clsx';

interface WorkPackage {
  id: string;
  name: string;
  chainage: string;
  progressPct: number;
  plannedPct: number;
  status: 'On Schedule' | 'Delayed' | 'Critical Path';
  landHandoverPct: number;
}

interface DesignAlternativeRow {
  id: string;
  name: string;
  strategy: string;
  version: string;
  lengthKm: number;
  landImpactAcres: number;
  affectedParcels: number;
  costCr: number;
  durationMonths: number;
  delayRiskPct: number;
  score: number;
  status: 'APPROVED' | 'EVALUATED' | 'UNDER REVIEW' | 'DRAFT';
}

function ContractorPortalContent() {
  const searchParams = useSearchParams();
  const requestedProjectId = searchParams.get('project');

  // Active Project Context
  const [activeProject, setActiveProject] = useState<Project>(() => {
    if (requestedProjectId) {
      const found = getMockProject(requestedProjectId) || MOCK_PROJECTS.find(p => p.id === requestedProjectId);
      if (found) return found;
    }
    return MOCK_PROJECTS[0];
  });

  const [allProjects, setAllProjects] = useState<Project[]>(MOCK_PROJECTS);

  // Load project from API or fallback
  useEffect(() => {
    async function loadData() {
      try {
        const remoteProjects = await api.getProjects();
        if (remoteProjects && remoteProjects.length > 0) {
          setAllProjects(remoteProjects);
          if (requestedProjectId) {
            const match = remoteProjects.find((p: Project) => p.id === requestedProjectId);
            if (match) setActiveProject(match);
          } else {
            setActiveProject(remoteProjects[0]);
          }
        }
      } catch (err) {
        console.warn('Using local project database for contractor portal:', err);
      }
    }
    loadData();
  }, [requestedProjectId]);

  // Sync project when searchParam changes
  useEffect(() => {
    if (requestedProjectId) {
      const p = allProjects.find(item => item.id === requestedProjectId) || getMockProject(requestedProjectId);
      if (p) setActiveProject(p);
    }
  }, [requestedProjectId, allProjects]);

  // Dynamic Parcels for the active project
  const parcels = useMemo(() => {
    return generateMockParcels(activeProject.id, activeProject.coords);
  }, [activeProject]);

  // Work Packages
  const [packages, setPackages] = useState<WorkPackage[]>([
    { id: `PKG-${activeProject.id.replace('PRJ-', '')}-A`, name: 'Package 1: Elevated Viaduct & Pier Foundation', chainage: 'KM 0.00 to KM 14.50', progressPct: 62, plannedPct: 68, status: 'On Schedule', landHandoverPct: 92 },
    { id: `PKG-${activeProject.id.replace('PRJ-', '')}-B`, name: 'Package 2: Six-Lane Grade Roadway & Embankment', chainage: 'KM 14.50 to KM 32.00', progressPct: 41, plannedPct: 55, status: 'Delayed', landHandoverPct: 68 },
    { id: `PKG-${activeProject.id.replace('PRJ-', '')}-C`, name: 'Package 3: Major Interchange & Underpass Structures', chainage: 'KM 32.00 to KM 48.20', progressPct: 28, plannedPct: 40, status: 'Critical Path', landHandoverPct: 54 },
  ]);

  // UI States
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Interactive Alignment Modification Simulation
  const [offsetMeters, setOffsetMeters] = useState<number>(35);
  const [avoidWaterbody, setAvoidWaterbody] = useState<boolean>(true);
  const [curveOptimization, setCurveOptimization] = useState<number>(15);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4500);
  };

  const handleUploadEvidence = (pkgId: string) => {
    showNotification(`Progress drone orthomosaic & geo-tagged survey photos successfully uploaded for ${pkgId}. Synced with 3D Digital Twin.`);
  };

  // 4 Design Alternatives
  const designAlternatives: DesignAlternativeRow[] = useMemo(() => [
    {
      id: `DSG-${activeProject.id}-A`,
      name: 'Alternative A: Minimum Land Impact',
      strategy: 'Minimum Land Impact',
      version: 'v1.2 (Active Approved)',
      lengthKm: +(activeProject.corridorLengthKm || (activeProject.requiredLandAreaAcres * 0.22)).toFixed(1),
      landImpactAcres: activeProject.requiredLandAreaAcres,
      affectedParcels: activeProject.parcelsCount,
      costCr: activeProject.estimatedBudgetCr,
      durationMonths: 24,
      delayRiskPct: activeProject.riskScore || 18,
      score: 92,
      status: 'APPROVED',
    },
    {
      id: `DSG-${activeProject.id}-B`,
      name: 'Alternative B: Minimum Civil Cost',
      strategy: 'Minimum Cost',
      version: 'v1.0 (Evaluated)',
      lengthKm: +((activeProject.corridorLengthKm || (activeProject.requiredLandAreaAcres * 0.22)) * 0.95).toFixed(1),
      landImpactAcres: Math.round(activeProject.requiredLandAreaAcres * 1.25),
      affectedParcels: Math.round(activeProject.parcelsCount * 1.3),
      costCr: Math.round(activeProject.estimatedBudgetCr * 0.88),
      durationMonths: 28,
      delayRiskPct: 38,
      score: 79,
      status: 'EVALUATED',
    },
    {
      id: `DSG-${activeProject.id}-C`,
      name: 'Alternative C: Maximum Connectivity',
      strategy: 'Maximum Connectivity',
      version: 'v1.0 (Evaluated)',
      lengthKm: +((activeProject.corridorLengthKm || (activeProject.requiredLandAreaAcres * 0.22)) * 1.1).toFixed(1),
      landImpactAcres: Math.round(activeProject.requiredLandAreaAcres * 1.35),
      affectedParcels: Math.round(activeProject.parcelsCount * 1.45),
      costCr: Math.round(activeProject.estimatedBudgetCr * 1.15),
      durationMonths: 26,
      delayRiskPct: 29,
      score: 84,
      status: 'EVALUATED',
    },
    {
      id: `DSG-${activeProject.id}-D`,
      name: 'Alternative D: Bypass Geotechnical Optimization',
      strategy: 'Geotechnical Optimization',
      version: 'v1.1 (Under Review)',
      lengthKm: +((activeProject.corridorLengthKm || (activeProject.requiredLandAreaAcres * 0.22)) * 1.02).toFixed(1),
      landImpactAcres: Math.round(activeProject.requiredLandAreaAcres * 0.95),
      affectedParcels: Math.round(activeProject.parcelsCount * 0.9),
      costCr: Math.round(activeProject.estimatedBudgetCr * 0.98),
      durationMonths: 22,
      delayRiskPct: 15,
      score: 94,
      status: 'UNDER REVIEW',
    },
  ], [activeProject]);

  // Active Design Package Object for Downloads
  const activeDpkg: DesignPackage = useMemo(() => ({
    id: `DPKG-${activeProject.id}-v1`,
    projectId: activeProject.id,
    designId: `DSG-${activeProject.id}-A`,
    versionId: 'VER-1.2',
    packageNumber: `DPKG-${activeProject.id}-APPROVED`,
    title: `${activeProject.name} — Phase 1 Construction Directive`,
    approvedBy: 'Special Land Acquisition Officer (LAO-HQ)',
    approvedAt: new Date().toISOString(),
    specs: {
      designName: 'Alternative A: Minimum Land Impact',
      strategy: 'Minimum Land Impact',
      version: 1.2,
      lengthKm: +(activeProject.corridorLengthKm || 48.2).toFixed(1),
      landImpactAcres: activeProject.requiredLandAreaAcres,
      affectedParcelsCount: activeProject.parcelsCount,
      stakeholdersCount: activeProject.stakeholdersCount,
      estimatedCostCr: activeProject.estimatedBudgetCr,
      estimatedDurationMonths: 24,
      delayRiskPct: activeProject.riskScore || 18,
      connectivityScore: 92,
      corridorWidthMeters: 32.0,
      lanes: 6,
    },
    officerInstructions: `1. Maintain strict 32.0m Right of Way (RoW) boundary.
2. Zero encroachment into surveyed private plots SF-104/1A and SF-112/2 without LAO possession certificate.
3. Install seismic telemetry on Pier foundations 40 through 62.
4. Upload weekly drone survey orthophotos to LandGuard AI cloud repository.`,
    documentsCount: 6,
    disclaimer: 'OFFICIAL SIMULATION SPECIFICATION — LANDGUARD AI INFRASTRUCTURE CADRE',
    accessLog: [],
  }), [activeProject]);

  // Recalculated dynamic metrics for Version 2 (interactive simulation)
  const modifiedMetrics = useMemo(() => {
    const costDelta = avoidWaterbody ? -14.2 : +8.5;
    const landAreaDelta = -Math.round(offsetMeters * 0.12);
    const parcelDelta = avoidWaterbody ? -4 : +2;
    const riskDelta = -6 - Math.round(curveOptimization * 0.2);

    return {
      costDelta,
      newCost: activeProject.estimatedBudgetCr + costDelta,
      landAreaDelta,
      newLandArea: Math.max(10, activeProject.requiredLandAreaAcres + landAreaDelta),
      parcelDelta,
      newParcels: Math.max(5, activeProject.parcelsCount + parcelDelta),
      riskDelta,
      newRisk: Math.max(5, (activeProject.riskScore || 18) + riskDelta),
    };
  }, [offsetMeters, avoidWaterbody, curveOptimization, activeProject]);

  return (
    <div className="space-y-5">
      {/* Top Header & Project Switcher */}
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-hair pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-orange-500/20 border border-orange-500/40 px-2 py-0.5 font-mono text-[11px] font-bold text-orange-300 flex items-center gap-1.5">
              <HardHat className="h-3.5 w-3.5" /> EPC CONTRACTOR PORTAL
            </span>
            <div className="font-display text-[22px] font-bold tracking-wide text-txt-primary">
              Highway Construction & Engineering Intelligence
            </div>
          </div>
          <div className="mt-1 text-[13px] text-txt-tertiary">
            Work package progress, Right-of-Way handover status, official DPKG downloads, and AI design change workflow
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
              className="bg-transparent text-[12px] font-bold text-cyan focus:outline-none cursor-pointer"
            >
              {allProjects.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.id} • {p.name} ({p.district})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowPackageModal(true)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 font-mono text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900/50 transition-colors"
          >
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> View Approved DPKG
          </button>
          <DemoFlag />
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-3 font-mono text-[12.5px] text-cyan shadow-glow animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard label="Contract Value" value={`₹${activeProject.estimatedBudgetCr} Cr`} sub={activeProject.name} />
        <StatCard label="Work Packages" value="3" sub="Active Construction" />
        <StatCard label="Physical Progress" value="43.6%" sub="Planned: 54.3%" isWarning />
        <StatCard label="Land Handover" value="71.3%" sub={`${Math.round(activeProject.requiredLandAreaAcres * 0.71)} / ${activeProject.requiredLandAreaAcres} Ac`} />
        <StatCard label="Change Requests" value="2" sub="1 Approved, 1 Pending" />
        <StatCard label="Predicted Delay" value={`${activeProject.riskScore || 18}%`} sub="AI Risk Level" isAlert={activeProject.riskScore ? activeProject.riskScore > 40 : false} />
        <StatCard label="Approved DPKG" value="v1.2" sub={`DPKG-${activeProject.id}`} />
        <StatCard label="Audit Seal" value="SHA-256" sub="Cryptographic Log" />
      </div>

      {/* Corridor Alignment Schematic Display */}
      <div className="rounded-xl border border-hair bg-panel p-4 overflow-hidden relative">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-cyan" />
            <h3 className="font-display text-[14px] font-bold text-txt-primary">
              Corridor Alignment & Engineering Chainage Profile
            </h3>
          </div>
          <span className="font-mono text-[11px] text-txt-tertiary">
            RoW Width: <strong className="text-cyan">32.0 Meters</strong> • Standard: <strong className="text-txt-primary">6-Lane Divided Expressway</strong>
          </span>
        </div>

        {/* Visual Corridor Bar */}
        <div className="rounded-lg border border-slate-700/60 bg-slate-950/80 p-4 font-mono text-[12px]">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-center">
            {/* Start Terminus */}
            <div className="p-2.5 rounded-lg border border-cyan/40 bg-cyan-dim/20 text-left shrink-0">
              <div className="text-[10px] uppercase text-cyan font-bold flex items-center gap-1">
                <MapPin className="h-3 w-3" /> START TERMINUS (CH. 0.00 KM)
              </div>
              <div className="font-bold text-white text-[13px]">{activeProject.startLocation || 'Sulur Junction (NH-544)'}</div>
              <div className="text-[10.5px] text-txt-tertiary">Elevation: 412m • Chainage 0+000</div>
            </div>

            {/* Connecting Corridor Line */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 border-y md:border-y-0 md:border-x border-slate-800">
              <div className="w-full flex items-center justify-between text-[11px] text-txt-secondary mb-1">
                <span>Pkg 1: Viaduct Pier 1-42</span>
                <span className="font-bold text-cyan">{activeProject.corridorLengthKm || 48.2} KM DUAL 6-LANE CARRIAGEWAY</span>
                <span>Pkg 3: Major Flyover</span>
              </div>
              <div className="h-3 w-full bg-slate-800 rounded-full relative overflow-hidden border border-slate-700">
                <div className="h-full bg-gradient-to-r from-cyan via-emerald-400 to-cyan-bright animate-pulse" style={{ width: '100%' }} />
              </div>
              <div className="w-full flex items-center justify-between text-[10px] text-txt-tertiary mt-1">
                <span>Ch. 0.00 km</span>
                <span className="text-emerald-400 font-semibold">92% Land Handover in Sector 1</span>
                <span>Ch. {activeProject.corridorLengthKm || 48.2} km</span>
              </div>
            </div>

            {/* End Terminus */}
            <div className="p-2.5 rounded-lg border border-purple-500/40 bg-purple-950/30 text-left shrink-0">
              <div className="text-[10px] uppercase text-purple-300 font-bold flex items-center gap-1">
                <MapPin className="h-3 w-3" /> END TERMINUS (CH. {activeProject.corridorLengthKm || 48.2} KM)
              </div>
              <div className="font-bold text-white text-[13px]">{activeProject.destination || 'Avinashi Bypass Interchange'}</div>
              <div className="text-[10.5px] text-txt-tertiary">Elevation: 388m • Grade Separated</div>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Version Design Comparison Matrix */}
      <div className="rounded-xl border border-hair bg-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair p-4 bg-panel2/60">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan" />
            <div>
              <h3 className="font-display text-[14px] font-bold text-txt-primary">
                Multi-Design Alternative Comparison Matrix
              </h3>
              <p className="text-[11.5px] text-txt-tertiary">
                Simulated AI alternatives with real length, land impact, budget, and delay risk metrics
              </p>
            </div>
          </div>

          {/* Direct Downloads Button Group */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                downloadGeoJsonAlignment(activeDpkg, {
                  projectName: activeProject.name,
                  projectId: activeProject.id,
                  district: activeProject.district,
                  state: activeProject.state,
                  coordinates: [
                    [activeProject.coords[0], activeProject.coords[1]],
                    [activeProject.coords[0] + 0.05, activeProject.coords[1] + 0.03],
                    [activeProject.coords[0] + 0.11, activeProject.coords[1] + 0.07],
                    [activeProject.coords[0] + 0.16, activeProject.coords[1] + 0.09],
                  ],
                  parcels,
                  startLocation: activeProject.startLocation,
                  destination: activeProject.destination,
                });
                showNotification('OGC standard GeoJSON alignment exported successfully.');
              }}
              className="flex items-center gap-1 rounded-lg border border-cyan/40 bg-cyan-dim/20 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-cyan hover:bg-cyan-dim/40 transition-colors"
            >
              <Compass className="h-3.5 w-3.5" /> GeoJSON
            </button>

            <button
              onClick={() => {
                downloadCsvSummary(activeDpkg, {
                  projectName: activeProject.name,
                  projectId: activeProject.id,
                  district: activeProject.district,
                  state: activeProject.state,
                  parcels,
                });
                showNotification('CSV Specifications & Parcel Schedule downloaded.');
              }}
              className="flex items-center gap-1 rounded-lg border border-hair bg-panel2 px-2.5 py-1.5 font-mono text-[11px] font-semibold text-txt-secondary hover:border-cyan hover:text-cyan transition-colors"
            >
              <FileText className="h-3.5 w-3.5" /> CSV Schedule
            </button>

            <button
              onClick={() => {
                generateAndDownloadPdfReport(activeDpkg, {
                  projectName: activeProject.name,
                  projectId: activeProject.id,
                  district: activeProject.district,
                  state: activeProject.state,
                  coordinates: [
                    [activeProject.coords[0], activeProject.coords[1]],
                    [activeProject.coords[0] + 0.05, activeProject.coords[1] + 0.03],
                    [activeProject.coords[0] + 0.11, activeProject.coords[1] + 0.07],
                    [activeProject.coords[0] + 0.16, activeProject.coords[1] + 0.09],
                  ],
                  parcels,
                  startLocation: activeProject.startLocation,
                  destination: activeProject.destination,
                });
                showNotification('Official Printable PDF Engineering Report opened.');
              }}
              className="flex items-center gap-1 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 font-mono text-[11px] font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
            >
              <Download className="h-3.5 w-3.5" /> Printable PDF Report
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="bg-panel2/40 text-[11px] uppercase font-mono text-txt-tertiary border-b border-hair">
              <tr>
                <th className="p-3">Design Alternative</th>
                <th className="p-3">Strategy</th>
                <th className="p-3 text-right">Length (km)</th>
                <th className="p-3 text-right">Land Area</th>
                <th className="p-3 text-right">Parcels</th>
                <th className="p-3 text-right">Budget (INR)</th>
                <th className="p-3 text-right">Delay Risk</th>
                <th className="p-3 text-center">AI Score</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-hair">
              {designAlternatives.map((alt) => (
                <tr key={alt.id} className={clsx('hover:bg-panel2/50 transition-colors', alt.status === 'APPROVED' && 'bg-emerald-950/15')}>
                  <td className="p-3 font-semibold text-txt-primary flex items-center gap-2">
                    {alt.status === 'APPROVED' && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                    <div>
                      <div>{alt.name}</div>
                      <div className="text-[10px] text-txt-tertiary font-mono">{alt.version}</div>
                    </div>
                  </td>
                  <td className="p-3 font-mono text-txt-secondary">{alt.strategy}</td>
                  <td className="p-3 text-right font-mono font-bold text-cyan">{alt.lengthKm} km</td>
                  <td className="p-3 text-right font-mono text-amber-300">{alt.landImpactAcres} Ac</td>
                  <td className="p-3 text-right font-mono text-txt-primary">{alt.affectedParcels}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">₹{alt.costCr} Cr</td>
                  <td className="p-3 text-right font-mono">
                    <span className={clsx(
                      'font-bold',
                      alt.delayRiskPct < 25 ? 'text-emerald-400' : alt.delayRiskPct < 35 ? 'text-amber-400' : 'text-rose-400'
                    )}>
                      {alt.delayRiskPct}%
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-cyan-bright">{alt.score}/100</td>
                  <td className="p-3 text-center">
                    <span className={clsx(
                      'rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase',
                      alt.status === 'APPROVED' && 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
                      alt.status === 'EVALUATED' && 'bg-slate-700/40 text-slate-300 border border-slate-600',
                      alt.status === 'UNDER REVIEW' && 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    )}>
                      {alt.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Design Modification & Metric Recalculation Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Work Packages Physical Tracking */}
        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-hair bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair p-3.5 bg-panel2/60">
              <div className="flex items-center gap-2">
                <HardHat className="h-4 w-4 text-orange-400" />
                <h3 className="font-display text-[14px] font-bold text-txt-primary">
                  Assigned Construction Work Packages
                </h3>
              </div>

              <button
                onClick={() => setShowChangeModal(true)}
                className="flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1.5 font-mono text-[11px] font-bold text-white shadow-glow hover:opacity-90 transition-opacity"
              >
                <GitPullRequest className="h-3.5 w-3.5" /> Submit Design Change Request
              </button>
            </div>

            <div className="divide-y divide-hair">
              {packages.map((pkg) => (
                <div key={pkg.id} className="p-4 space-y-3 hover:bg-panel2/40 transition-colors">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan text-[12px]">{pkg.id}</span>
                        <span className="font-semibold text-txt-primary text-[13px]">{pkg.name}</span>
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-txt-tertiary font-mono">{pkg.chainage}</div>
                    </div>

                    <span
                      className={clsx(
                        'rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase',
                        pkg.status === 'On Schedule' && 'bg-risk-low/15 text-risk-low border border-risk-low/30',
                        pkg.status === 'Delayed' && 'bg-risk-high/15 text-risk-high border border-risk-high/30',
                        pkg.status === 'Critical Path' && 'bg-risk-critical/15 text-risk-critical border border-risk-critical/30'
                      )}
                    >
                      {pkg.status}
                    </span>
                  </div>

                  {/* Progress Bars: Physical vs Planned & Land Handover */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11.5px]">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-txt-secondary">Physical Construction Progress:</span>
                        <span className="font-mono font-bold text-txt-primary">
                          {pkg.progressPct}% <span className="text-txt-tertiary">(Planned: {pkg.plannedPct}%)</span>
                        </span>
                      </div>
                      <div className="h-2 w-full bg-raised rounded-full overflow-hidden border border-hair">
                        <div
                          className="h-full bg-gradient-to-r from-cyan to-cyan-bright"
                          style={{ width: `${pkg.progressPct}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-txt-secondary">Right-of-Way Land Handed Over:</span>
                        <span className="font-mono font-bold text-emerald-400">{pkg.landHandoverPct}%</span>
                      </div>
                      <div className="h-2 w-full bg-raised rounded-full overflow-hidden border border-hair">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${pkg.landHandoverPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions & Evidence */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-hair/50">
                    <span className="text-[11px] text-txt-tertiary">
                      Last survey lock: 2026-09-18 • 16 inspection logs verified
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUploadEvidence(pkg.id)}
                        className="flex items-center gap-1 rounded border border-hair bg-panel2 px-2.5 py-1 font-mono text-[10.5px] text-txt-secondary hover:border-cyan hover:text-cyan transition-colors"
                      >
                        <Camera className="h-3 w-3 text-cyan" /> Upload Drone / Photo Evidence
                      </button>

                      <Link href={`/twin?project=${activeProject.id}`}>
                        <button className="flex items-center gap-1 rounded border border-hair bg-panel2 px-2.5 py-1 font-mono text-[10.5px] text-txt-secondary hover:border-cyan hover:text-cyan transition-colors">
                          <span>Inspect 3D Twin</span>
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Interactive Design Recalculation & Variation Studio */}
        <div className="space-y-4">
          <GlassPanel className="p-4 space-y-3.5">
            <PanelHead title="Alignment Variation & Recalculation" sub="Version 1 vs Version 2 Engine" />
            <p className="text-[12px] text-txt-secondary leading-relaxed">
              Adjust engineering parameters to simulate real-time AI impact on costs, acreage, parcel intersections, and delay risks.
            </p>

            {/* Controls */}
            <div className="space-y-3 rounded-lg border border-hair bg-panel2 p-3 text-[12px]">
              <div>
                <div className="flex justify-between text-[11px] text-txt-secondary mb-1">
                  <span>Alignment Northern Shift Offset:</span>
                  <span className="font-mono font-bold text-cyan">+{offsetMeters} Meters</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="80"
                  step="5"
                  value={offsetMeters}
                  onChange={(e) => setOffsetMeters(+e.target.value)}
                  className="w-full accent-cyan h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11.5px] text-txt-secondary">Avoid Wetland / Waterbody Canal:</span>
                <button
                  onClick={() => setAvoidWaterbody(!avoidWaterbody)}
                  className={clsx(
                    'rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-bold transition-colors',
                    avoidWaterbody ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-slate-800 text-slate-400 border border-slate-700'
                  )}
                >
                  {avoidWaterbody ? 'ACTIVE (AVOID)' : 'DISABLED'}
                </button>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-txt-secondary mb-1">
                  <span>Horizontal Curve Smoothing Radius:</span>
                  <span className="font-mono font-bold text-purple-400">R = {500 + curveOptimization * 20}m</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="5"
                  value={curveOptimization}
                  onChange={(e) => setCurveOptimization(+e.target.value)}
                  className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Delta Comparison Box */}
            <div className="rounded-lg border border-purple-500/40 bg-purple-950/20 p-3 space-y-2 text-[12px]">
              <div className="flex items-center justify-between text-xs font-bold text-purple-300">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                  RECALCULATED VERSION 2 DELTA:
                </span>
                <span className="font-mono text-[10px] text-purple-400 bg-purple-900/40 px-1.5 py-0.5 rounded">
                  AI SIMULATED
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11.5px] pt-1">
                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-txt-tertiary uppercase">Budget Delta</div>
                  <div className="font-mono font-bold text-emerald-400">
                    {modifiedMetrics.costDelta < 0 ? `-₹${Math.abs(modifiedMetrics.costDelta)} Cr` : `+₹${modifiedMetrics.costDelta} Cr`}
                  </div>
                  <div className="text-[10px] text-txt-secondary">New: ₹{modifiedMetrics.newCost} Cr</div>
                </div>

                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-txt-tertiary uppercase">Land Area Delta</div>
                  <div className="font-mono font-bold text-emerald-400">
                    {modifiedMetrics.landAreaDelta} Acres
                  </div>
                  <div className="text-[10px] text-txt-secondary">New: {modifiedMetrics.newLandArea} Ac</div>
                </div>

                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-txt-tertiary uppercase">Affected Parcels</div>
                  <div className="font-mono font-bold text-cyan">
                    {modifiedMetrics.parcelDelta} Parcels
                  </div>
                  <div className="text-[10px] text-txt-secondary">New: {modifiedMetrics.newParcels} Intersected</div>
                </div>

                <div className="p-2 rounded bg-slate-900/80 border border-slate-800">
                  <div className="text-[10px] text-txt-tertiary uppercase">Delay Risk Delta</div>
                  <div className="font-mono font-bold text-emerald-400">
                    {modifiedMetrics.riskDelta}%
                  </div>
                  <div className="text-[10px] text-txt-secondary">New: {modifiedMetrics.newRisk}%</div>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={() => setShowChangeModal(true)}
              className="w-full py-2.5 text-[12px] bg-gradient-to-r from-purple-600 to-indigo-600 border-none"
            >
              <GitPullRequest className="h-4 w-4" /> Submit Proposed v2.0 Change Request
            </Button>
          </GlassPanel>
        </div>
      </div>

      {/* MODALS */}
      {showChangeModal && (
        <ChangeRequestModal
          projectId={activeProject.id}
          designId={`DSG-${activeProject.id}-A`}
          onClose={() => setShowChangeModal(false)}
          onSuccess={() => {
            setShowChangeModal(false);
            showNotification(`Design Change Request for ${activeProject.id} submitted to Superintending Engineer & LAO for review.`);
          }}
        />
      )}

      {showPackageModal && (
        <DesignPackageModal
          designId={`DSG-${activeProject.id}-A`}
          onClose={() => setShowPackageModal(false)}
        />
      )}
    </div>
  );
}

export default function ContractorPortalPage() {
  return (
    <AppShell>
      <AuthGuard allowedRoles={['CONTRACTOR', 'SUPER_ADMIN']}>
        <Suspense fallback={<div className="p-8 text-center text-cyan animate-pulse">Loading Contractor Intelligence Portal...</div>}>
          <ContractorPortalContent />
        </Suspense>
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
        'mt-1 font-display text-[17px] font-bold truncate',
        isAlert ? 'text-risk-critical' : isWarning ? 'text-risk-high' : 'text-txt-primary'
      )}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-txt-tertiary truncate">{sub}</div>
    </div>
  );
}
