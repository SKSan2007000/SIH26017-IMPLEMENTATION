import { AppShell } from '@/components/layout/AppShell';
import { ProjectCreateForm } from '@/components/projects/ProjectCreateForm';

export default function NewProjectPage() {
  return (
    <AppShell>
      <div className="mb-2">
        <div className="font-display text-[20px] font-bold tracking-wide">Create Project</div>
        <div className="mt-0.5 text-[12.5px] text-txt-tertiary">Project creation → Route Planning → 2D GIS → 3D Twin → AI Delay Risk</div>
      </div>
      <ProjectCreateForm />
    </AppShell>
  );
}
