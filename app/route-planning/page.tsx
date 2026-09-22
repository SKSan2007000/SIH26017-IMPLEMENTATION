'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Wand2, Box, CheckCircle2, SlidersHorizontal, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button } from '@/components/ui/Primitives';
import { RouteCard } from '@/components/routes/RouteCard';
import { RouteCompareTable } from '@/components/routes/RouteCompare';
import { DesignHub } from '@/components/designs/DesignHub';
import { getMockRoutes } from '@/lib/mock/routes';
import { getMockProject } from '@/lib/mock/projects';
import { useAppStore } from '@/lib/store/useAppStore';

const MapGis = dynamic(() => import('@/components/gis/MapGis').then((m) => m.MapGis), { ssr: false });

export default function RoutePlanningPage() {
  const projectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const selectedRouteId = useAppStore((s) => s.selectedRouteId);
  const setSelectedRoute = useAppStore((s) => s.setSelectedRoute);
  const project = getMockProject(projectId);
  const routes = getMockRoutes(projectId);

  const [activeMode, setActiveMode] = useState<'multi-design' | 'classic'>('multi-design');
  const [start, setStart] = useState(project?.startLocation ?? 'Chennai Port Junction (DEMO)');
  const [destination, setDestination] = useState(project?.destination ?? 'Ennore Industrial Belt (DEMO)');
  const [generating, setGenerating] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const activeRoute = routes.find((r) => r.id === selectedRouteId) ?? routes.find((r) => r.aiRecommended) ?? routes[0];

  function handleGenerateRoutes() {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      const best = routes.find((r) => r.aiRecommended) ?? routes[0];
      if (best) setSelectedRoute(best.id);
    }, 450);
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="font-display text-[20px] font-bold tracking-wide">Route Planning & Alignment Intelligence</div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            {project?.name ?? 'Select a project'} — Multi-design alternatives, version history & dynamic evaluation
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex rounded-lg border border-hair bg-panel p-0.5 text-xs">
            <button
              onClick={() => setActiveMode('multi-design')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'multi-design' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" /> Multi-Design Hub (Phase 6)
            </button>
            <button
              onClick={() => setActiveMode('classic')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                activeMode === 'classic' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" /> 4-Route Overview
            </button>
          </div>

          <Link href="/twin">
            <Button variant="primary" className="text-[12px]">
              <Box className="h-3.5 w-3.5" /> View Selected in 3D Twin
            </Button>
          </Link>
          <DemoFlag />
        </div>
      </div>

      {activeMode === 'multi-design' ? (
        <div className="space-y-6">
          <DesignHub />

          {/* 2D GIS Live Spatial Overlay */}
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                Live 2D Cadastral GIS Preview — corridor ribbon & regional road network connectivity
              </div>
              <Link href="/gis" className="flex items-center gap-1 font-mono text-[11px] text-cyan hover:underline">
                Open Full 2D GIS <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <MapGis />
          </div>
        </div>
      ) : (
        <>
          {/* Route Generator Bar */}
          <div className="mb-4 flex flex-wrap items-end gap-3 rounded-xl border border-hair bg-panel p-3.5">
            <LabeledInput label="Corridor Start Location" value={start} onChange={setStart} />
            <LabeledInput label="Corridor Destination" value={destination} onChange={setDestination} />
            <Button variant="primary" onClick={handleGenerateRoutes} disabled={generating}>
              <Wand2 className="h-3.5 w-3.5" /> {generating ? 'Computing 4 Routes…' : 'Generate 4 Routes'}
            </Button>
            <Button onClick={handleGenerateRoutes}>
              <RefreshCw className="h-3.5 w-3.5" /> Regenerate
            </Button>
            <Button onClick={() => setShowCompareModal(!showCompareModal)}>
              <SlidersHorizontal className="h-3.5 w-3.5" /> {showCompareModal ? 'Hide Comparison' : 'Compare All 4 Routes'}
            </Button>
          </div>

          {/* Active Route Selection Summary Bar */}
          {activeRoute && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-cyanline bg-cyan-glow/20 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan text-[#05131a]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wide text-cyan">Active Selected Alignment</div>
                  <div className="font-display text-[15px] font-bold text-txt-primary">
                    {activeRoute.label} — {activeRoute.strategy}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[12px]">
                <StatChip label="Affected Parcels" val={activeRoute.affectedParcels} />
                <StatChip label="Stakeholders" val={activeRoute.stakeholders} />
                <StatChip label="Est. Cost" val={`₹${activeRoute.estimatedCostCr} Cr`} />
                <StatChip label="Delay Risk" val={`${activeRoute.delayProbabilityPct}%`} accent={activeRoute.delayProbabilityPct >= 60 ? 'risk' : 'cyan'} />
                <StatChip label="Est. Delay" val={`+${activeRoute.estimatedDelayMonths} mo`} />
                <StatChip label="AI Score" val={`${activeRoute.overallScore}/100`} accent="cyan" />
              </div>
            </div>
          )}

          {/* 4 Route Cards */}
          <div className="mb-4 grid grid-cols-4 gap-3">
            {routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                selected={activeRoute?.id === route.id}
                onSelect={() => setSelectedRoute(route.id)}
              />
            ))}
          </div>

          {/* Comparison Table */}
          {showCompareModal && (
            <div className="mb-4">
              <RouteCompareTable routes={routes} />
            </div>
          )}

          {/* 2D GIS Preview */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                Live 2D Cadastral GIS Preview — selection updates highway corridor and affected parcel highlights
              </div>
              <Link href="/gis" className="flex items-center gap-1 font-mono text-[11px] text-cyan hover:underline">
                Open Full 2D GIS <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <MapGis />
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatChip({ label, val, accent }: { label: string; val: string | number; accent?: 'cyan' | 'risk' }) {
  return (
    <div className="rounded-md border border-hair bg-panel2 px-2.5 py-1">
      <span className="font-mono text-[9px] uppercase tracking-wide text-txt-tertiary block">{label}</span>
      <span className={`font-mono text-[13px] font-bold ${accent === 'cyan' ? 'text-cyan' : accent === 'risk' ? 'text-risk-high' : 'text-txt-primary'}`}>
        {val}
      </span>
    </div>
  );
}

function LabeledInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="flex-1 min-w-[180px]">
      <span className="mb-1 block font-mono text-[10px] uppercase tracking-wide text-txt-tertiary">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-mid bg-panel2 px-3 py-2 text-[12.5px] text-txt-primary outline-none focus:border-cyan"
      />
    </label>
  );
}
