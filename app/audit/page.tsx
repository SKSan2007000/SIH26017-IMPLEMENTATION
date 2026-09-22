'use client';

import { useState } from 'react';
import {
  History,
  Search,
  ShieldCheck,
  Clock,
  Filter,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button } from '@/components/ui/Primitives';
import { getMockProject } from '@/lib/mock/projects';
import { MOCK_AUDIT_EVENTS } from '@/lib/mock/auditEvents';
import { useAppStore } from '@/lib/store/useAppStore';
import clsx from 'clsx';

export default function AuditPage() {
  const projectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const project = getMockProject(projectId);
  const [query, setQuery] = useState('');
  const [catFilter, setCatFilter] = useState<string>('all');

  const events = MOCK_AUDIT_EVENTS.filter((e) => e.projectId === projectId);
  const filtered = events.filter((e) => {
    const matchesSearch =
      e.label.toLowerCase().includes(query.toLowerCase()) ||
      e.actor?.toLowerCase().includes(query.toLowerCase()) ||
      e.id.toLowerCase().includes(query.toLowerCase());
    const matchesCat = catFilter === 'all' || e.category === catFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="font-display text-[20px] font-bold tracking-wide">Immutable Audit Trail & Compliance Log</div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            {project?.name} — Tamper-evident chronological activity log for all corridor decisions, approvals, and AI inferences
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-cyanline bg-cyan-glow/40 px-3 py-1 font-mono text-[11px] text-cyan">
            <Lock className="h-3 w-3" /> SHA-256 SIGNED LOG
          </div>
          <DemoFlag />
        </div>
      </div>

      {/* Filter & Search */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair bg-panel p-3">
        <div className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-hair bg-panel2 px-3 py-1.5 text-txt-tertiary">
          <Search className="h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search action, actor, event ID…"
            className="w-full bg-transparent text-[12.5px] text-txt-primary outline-none placeholder:text-txt-tertiary"
          />
        </div>

        <div className="flex items-center gap-2 text-[12px]">
          <Filter className="h-3.5 w-3.5 text-txt-tertiary" />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary outline-none"
          >
            <option value="all">All Event Categories</option>
            <option value="System">System Intake</option>
            <option value="Route Selection">Route Selection</option>
            <option value="Risk Assessment">Risk Assessment</option>
            <option value="Verification">Field Verification</option>
            <option value="Compensation">Compensation & Notices</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      <div className="overflow-hidden rounded-xl border border-hair bg-panel">
        <div className="p-4">
          <div className="relative border-l-2 border-hair ml-4 pl-6 space-y-6">
            {filtered.map((e) => (
              <div key={e.id} className="relative group">
                {/* Dot */}
                <div className="absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full border-2 border-cyan bg-base" />

                <div className="rounded-lg border border-hair bg-panel2 p-3.5 transition-colors group-hover:border-mid">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-cyan font-bold">{e.id}</span>
                      <span className="rounded bg-base border border-hair px-2 py-0.5 font-mono text-[9.5px] text-txt-secondary">
                        {e.category ?? 'Activity'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-txt-tertiary">
                      <Clock className="h-3 w-3" />
                      <span>{e.date ?? '2026-08-30'}</span>
                      <span className="text-cyan">{e.time}</span>
                    </div>
                  </div>

                  <div className="mt-2 font-display text-[13.5px] font-semibold text-txt-primary">
                    {e.label}
                  </div>

                  {e.actor && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-txt-tertiary">
                      <ShieldCheck className="h-3.5 w-3.5 text-cyan" />
                      <span>Authorized Actor:</span>
                      <span className="font-mono text-txt-secondary">{e.actor}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

