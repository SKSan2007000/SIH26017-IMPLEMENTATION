'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import RoutePlanningPage from '@/app/route-planning/page';
import { useAppStore } from '@/lib/store/useAppStore';

function DesignsPageWrapper() {
  const searchParams = useSearchParams();
  const projectParam = searchParams.get('project');
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);

  React.useEffect(() => {
    if (projectParam && projectParam !== selectedProjectId) {
      setSelectedProject(projectParam);
    }
  }, [projectParam, selectedProjectId, setSelectedProject]);

  return <RoutePlanningPage />;
}

export default function DesignsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-txt-tertiary font-mono text-xs">Loading Multi-Design Studio...</div>}>
      <DesignsPageWrapper />
    </Suspense>
  );
}
