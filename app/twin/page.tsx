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
      Loading 3D Digital Twin…
    </div>
  ),
});

function TwinContent() {
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
          <div className="font-display text-[20px] font-bold tracking-wide">3D Digital Twin</div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            {activeProject?.name ?? 'Chennai-Bengaluru Industrial Corridor'} — 3D Infrastructure Twin
          </div>
        </div>
        <DemoFlag />
      </div>
      <CesiumTwin />
    </AppShell>
  );
}

export default function TwinPage() {
  return (
    <Suspense fallback={<div className="p-8 text-txt-tertiary font-mono text-xs">Loading 3D Twin...</div>}>
      <TwinContent />
    </Suspense>
  );
}
