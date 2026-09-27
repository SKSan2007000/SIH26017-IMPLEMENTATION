'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag } from '@/components/ui/Primitives';
import { useAppStore } from '@/lib/store/useAppStore';

const CesiumTwin = dynamic(() => import('@/components/threeD/CesiumTwin').then((m) => m.CesiumTwin), {
  ssr: false,
  loading: () => (
    <div className="flex h-[calc(100vh-150px)] items-center justify-center rounded-xl border border-hair font-mono text-[12px] text-txt-tertiary">
      Loading 3D Digital Twin Infrastructure Corridor…
    </div>
  ),
});

function DigitalTwinContent() {
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
            <span className="rounded bg-indigo-500/10 border border-indigo-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-400">
              3D DIGITAL TWIN
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              {activeProject?.name || 'Infrastructure Corridor 3D Twin'}
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Volumetric cadastral parcels, elevated viaduct structures, alignment gradients, and Right-of-Way envelopes
          </div>
        </div>
        <DemoFlag />
      </div>
      <CesiumTwin />
    </AppShell>
  );
}

export default function DigitalTwinPage() {
  return (
    <Suspense fallback={<div className="p-8 text-txt-tertiary font-mono text-xs">Loading 3D Scene...</div>}>
      <DigitalTwinContent />
    </Suspense>
  );
}
