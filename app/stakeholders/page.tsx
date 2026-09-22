'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Send,
  MapPin,
  Box,
  Map,
  FileText,
  Phone,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button, GlassPanel } from '@/components/ui/Primitives';
import { getMockStakeholdersByProject } from '@/lib/mock/stakeholders';
import { getMockProject } from '@/lib/mock/projects';
import { useAppStore } from '@/lib/store/useAppStore';
import type { Stakeholder } from '@/types';
import clsx from 'clsx';

export default function StakeholdersPage() {
  const projectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const project = getMockProject(projectId);
  const stakeholders = useAppStore((s) => s.stakeholders.filter((sh) => sh.projectId === projectId));
  const sendStakeholderNotification = useAppStore((s) => s.sendStakeholderNotification);
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedStakeholder, setSelectedStakeholder] = useState<Stakeholder | null>(null);
  const [noticeSentToast, setNoticeSentToast] = useState<string | null>(null);

  const filtered = stakeholders.filter((s) => {
    const matchesSearch =
      s.ref.toLowerCase().includes(query.toLowerCase()) ||
      (s.name && s.name.toLowerCase().includes(query.toLowerCase())) ||
      s.parcelIds.some((p) => p.toLowerCase().includes(query.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || s.responseStatus === statusFilter || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const verifiedCount = stakeholders.filter((s) => s.status === 'Verified' || s.responseStatus === 'RECEIVED').length;
  const pendingCount = stakeholders.filter((s) => s.status === 'Pending' || s.responseStatus === 'PENDING').length;
  const disputedCount = stakeholders.filter((s) => s.status === 'Disputed' || s.responseStatus === 'DISPUTED').length;

  function handleSendNotice(id: string, ref: string) {
    sendStakeholderNotification(id);
    setNoticeSentToast(`Official Section 4 Notice successfully dispatched to ${ref}`);
    setTimeout(() => setNoticeSentToast(null), 3000);
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="font-display text-[20px] font-bold tracking-wide">Stakeholder Intelligence & Communications</div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            {project?.name} — Fictional landowner identification, response tracking, and notification pipeline
          </div>
        </div>
        <DemoFlag />
      </div>

      {noticeSentToast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> {noticeSentToast}
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <StatCard label="Total Stakeholders" value={stakeholders.length} sub="Project Corridor" icon={<Users className="h-4 w-4 text-cyan" />} />
        <StatCard label="Verified Responses" value={verifiedCount} sub={`${Math.round((verifiedCount / (stakeholders.length || 1)) * 100)}% acknowledged`} icon={<CheckCircle2 className="h-4 w-4 text-risk-low" />} />
        <StatCard label="Pending Notices" value={pendingCount} sub="Awaiting response" icon={<Clock className="h-4 w-4 text-risk-medium" />} />
        <StatCard label="Disputed Holdings" value={disputedCount} sub="High delay factor" icon={<AlertTriangle className="h-4 w-4 text-risk-critical" />} />
      </div>

      {/* Filter & Search Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair bg-panel p-3">
        <div className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-hair bg-panel2 px-3 py-1.5 text-txt-tertiary">
          <Search className="h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stakeholder ID, owner name, parcel ID…"
            className="w-full bg-transparent text-[12.5px] text-txt-primary outline-none placeholder:text-txt-tertiary"
          />
        </div>

        <div className="flex items-center gap-2 text-[12px]">
          <Filter className="h-3.5 w-3.5 text-txt-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="RECEIVED">Response: Received</option>
            <option value="PENDING">Response: Pending</option>
            <option value="UNRESPONSIVE">Response: Unresponsive</option>
            <option value="DISPUTED">Status: Disputed</option>
          </select>
        </div>
      </div>

      {/* Stakeholder Table & Detail Split */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 overflow-hidden rounded-xl border border-hair bg-panel">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-hair bg-panel2 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                  <th className="px-3.5 py-3">Stakeholder ID</th>
                  <th className="px-3.5 py-3">Affected Parcels</th>
                  <th className="px-3.5 py-3">Response Status</th>
                  <th className="px-3.5 py-3">Notice Status</th>
                  <th className="px-3.5 py-3">Documents</th>
                  <th className="px-3.5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const isSelected = selectedStakeholder?.id === s.id;
                  return (
                    <tr
                      key={s.id}
                      onClick={() => setSelectedStakeholder(s)}
                      className={clsx(
                        'border-b border-hair/60 transition-colors cursor-pointer hover:bg-panel2/60',
                        isSelected && 'bg-cyan-glow/20'
                      )}
                    >
                      <td className="px-3.5 py-3">
                        <div className="font-display font-bold text-txt-primary">{s.ref}</div>
                        <div className="text-[11px] text-txt-tertiary">{s.name}</div>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.parcelIds.map((pid) => (
                            <span key={pid} className="rounded bg-panel2 border border-hair px-1.5 py-0.5 font-mono text-[10px] text-txt-secondary">
                              {pid}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-3.5 py-3">
                        <span
                          className={clsx(
                            'rounded-full px-2 py-0.5 font-mono text-[10px]',
                            s.responseStatus === 'RECEIVED'
                              ? 'bg-risk-low/15 text-risk-low border border-risk-low/30'
                              : s.responseStatus === 'DISPUTED'
                              ? 'bg-risk-critical/15 text-risk-critical border border-risk-critical/30'
                              : s.responseStatus === 'UNRESPONSIVE'
                              ? 'bg-risk-high/15 text-risk-high border border-risk-high/30'
                              : 'bg-risk-medium/15 text-risk-medium border border-risk-medium/30'
                          )}
                        >
                          {s.responseStatus}
                        </span>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="font-mono text-[11px] text-txt-secondary">{s.notificationStatus}</span>
                      </td>

                      <td className="px-3.5 py-3 font-mono">
                        {s.documentsCount} / {s.documentsRequired}
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSendNotice(s.id, s.ref);
                          }}
                          className="rounded border border-hair bg-panel2 px-2.5 py-1 font-mono text-[10.5px] text-txt-secondary hover:border-cyanline hover:text-cyan"
                        >
                          Send Notice
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Stakeholder Detail Drawer */}
        <div>
          {selectedStakeholder ? (
            <GlassPanel className="p-4 space-y-4">
              <div className="border-b border-hair pb-3">
                <div className="font-mono text-[9px] uppercase tracking-wide text-txt-tertiary">Stakeholder Profile</div>
                <div className="mt-1 font-display text-[16px] font-bold text-txt-primary">{selectedStakeholder.ref}</div>
                <div className="text-[12px] text-txt-secondary">{selectedStakeholder.name}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                <div className="rounded-lg border border-hair bg-panel2 p-2.5">
                  <span className="text-[10px] text-txt-tertiary block">Contact Reference</span>
                  <span className="font-mono text-txt-primary flex items-center gap-1 mt-0.5">
                    <Phone className="h-3 w-3 text-cyan" /> {selectedStakeholder.contactRef}
                  </span>
                </div>
                <div className="rounded-lg border border-hair bg-panel2 p-2.5">
                  <span className="text-[10px] text-txt-tertiary block">Preferred Language</span>
                  <span className="font-mono text-txt-primary mt-0.5 block">{selectedStakeholder.preferredLanguage ?? 'Tamil'}</span>
                </div>
              </div>

              <div className="rounded-lg border border-hair bg-panel2 p-3 space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-wide text-txt-tertiary">Acquisition & Compensation</div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-txt-tertiary">Compensation Status:</span>
                  <span className="font-semibold text-cyan">{selectedStakeholder.compensationStatus}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-txt-tertiary">Document Completion:</span>
                  <span className="font-semibold">{selectedStakeholder.documentsCount} / {selectedStakeholder.documentsRequired}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-txt-tertiary">Last Contact Date:</span>
                  <span className="font-mono text-txt-secondary">{selectedStakeholder.lastContact}</span>
                </div>
              </div>

              {/* Connected Parcels */}
              <div>
                <div className="mb-1.5 font-mono text-[10.5px] uppercase tracking-wide text-txt-tertiary">Connected Land Parcels</div>
                <div className="space-y-1.5">
                  {selectedStakeholder.parcelIds.map((pid) => (
                    <div key={pid} className="flex items-center justify-between rounded-lg border border-hair bg-panel2 px-3 py-2 text-[12px]">
                      <span className="font-mono font-bold text-txt-primary">{pid}</span>
                      <div className="flex items-center gap-1.5">
                        <Link href="/gis" onClick={() => setSelectedParcel(pid)}>
                          <Button className="px-2 py-1 text-[10.5px]">
                            <Map className="h-3 w-3" /> 2D GIS
                          </Button>
                        </Link>
                        <Link href="/twin" onClick={() => setSelectedParcel(pid)}>
                          <Button variant="primary" className="px-2 py-1 text-[10.5px]">
                            <Box className="h-3 w-3" /> 3D Twin
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  variant="primary"
                  className="w-full text-[12px]"
                  onClick={() => handleSendNotice(selectedStakeholder.id, selectedStakeholder.ref)}
                >
                  <Send className="h-3.5 w-3.5" /> Dispatch Acquisition Notice
                </Button>
              </div>
            </GlassPanel>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-hair p-6 text-center text-txt-tertiary">
              <Users className="mb-2 h-8 w-8 text-txt-tertiary" />
              <p className="text-[12.5px]">Select a stakeholder from the directory to inspect affected parcels, verification history, and communications.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: number | string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-hair bg-panel p-3.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">{label}</span>
        {icon}
      </div>
      <div className="mt-1.5 font-display text-[24px] font-bold text-txt-primary">{value}</div>
      <div className="mt-0.5 text-[11px] text-txt-tertiary">{sub}</div>
    </div>
  );
}

