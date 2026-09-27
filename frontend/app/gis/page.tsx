'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag } from '@/components/ui/Primitives';
import { useAppStore } from '@/lib/store/useAppStore';

const MapGis = dynamic(() => import('@/components/gis/MapGis').then((m) => m.MapGis), { ssr: false });

function GisContent() {
  const searchParams = useSearchParams();
  const projectParam = searchParams.get('project');
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const projects = useAppStore((s) => s.projects);

  React.useEffect(() => {
    if (projectParam && projectParam !== selectedProjectId) {
      setSelectedProject(projectParam);
    }
  }, [projectParam, selectedProjectId, setSelectedProject]);

  const activeProject = projects.find((p) => p.id === (projectParam || selectedProjectId));

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
              2D GIS COMMAND
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              {activeProject?.name || '2D GIS Parcel Geospatial Explorer'}
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Cadastral parcel intersection, corridor alignment buffer, risk clusters, and survey ground truth
          </div>
        </div>
        <DemoFlag />
      </div>
      <MapGis />
    </AppShell>
  );
}

export default function GisPage() {
  return (
    <Suspense fallback={<div className="p-8 text-txt-tertiary font-mono text-xs">Loading 2D GIS Map...</div>}>
      <GisContent />
    </Suspense>
  );
}
