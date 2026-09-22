'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Camera,
  Video,
  Navigation,
  Map,
  Box,
  Filter,
  RotateCcw,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button, GlassPanel } from '@/components/ui/Primitives';
import { getMockProject } from '@/lib/mock/projects';
import { useAppStore } from '@/lib/store/useAppStore';
import type { VerificationCase } from '@/types';
import clsx from 'clsx';

const AVAILABLE_OFFICERS = [
  'OFC-Anand-R',
  'OFC-Priya-S',
  'OFC-Mohan-K',
  'OFC-Divya-N',
  'OFC-Karthik-V',
  'OFC-Lakshmi-T',
];

export default function FieldPage() {
  const projectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const project = getMockProject(projectId);
  const fieldCases = useAppStore((s) => s.fieldCases.filter((c) => c.projectId === projectId));
  const assignOfficer = useAppStore((s) => s.assignOfficer);
  const updateCaseStatus = useAppStore((s) => s.updateCaseStatus);
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);

  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<VerificationCase | null>(null);
  const [assignee, setAssignee] = useState(AVAILABLE_OFFICERS[0]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filtered = fieldCases.filter((c) => {
    const matchesSearch =
      c.id.toLowerCase().includes(query.toLowerCase()) ||
      c.parcelId.toLowerCase().includes(query.toLowerCase()) ||
      c.officerRef.toLowerCase().includes(query.toLowerCase()) ||
      c.location.toLowerCase().includes(query.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const verifiedCount = fieldCases.filter((c) => c.status === 'Verified').length;
  const inProgressCount = fieldCases.filter((c) => c.status === 'In Progress' || c.status === 'Assigned').length;
  const awaitingCount = fieldCases.filter((c) => c.status === 'Awaiting Supervisor Verification').length;
  const revisitCount = fieldCases.filter((c) => c.status === 'Revisit Requested').length;

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleAssign(caseId: string) {
    assignOfficer(caseId, assignee);
    showToast(`Assigned ${caseId} to ${assignee}`);
  }

  function handleStatusChange(caseId: string, status: VerificationCase['status']) {
    updateCaseStatus(caseId, status);
    if (selectedCase && selectedCase.id === caseId) {
      setSelectedCase({ ...selectedCase, status });
    }
    showToast(`Updated ${caseId} status to "${status}"`);
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="font-display text-[20px] font-bold tracking-wide">Field Verification & Cadastral Ground Truth</div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            {project?.name} — Geo-tagged boundary verification, GPS accuracy confirmation, and site inspections
          </div>
        </div>
        <DemoFlag />
      </div>

      {toastMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> {toastMessage}
        </div>
      )}

      {/* KPI Stats */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <StatCard label="Total Field Tasks" value={fieldCases.length} sub="Ground inspections" icon={<ClipboardCheck className="h-4 w-4 text-cyan" />} />
        <StatCard label="Supervisor Verified" value={verifiedCount} sub={`${Math.round((verifiedCount / (fieldCases.length || 1)) * 100)}% verified`} icon={<CheckCircle2 className="h-4 w-4 text-risk-low" />} />
        <StatCard label="In Progress / Assigned" value={inProgressCount} sub="Active field tasks" icon={<Clock className="h-4 w-4 text-risk-medium" />} />
        <StatCard label="Revisit / Awaiting" value={awaitingCount + revisitCount} sub="Action required" icon={<AlertTriangle className="h-4 w-4 text-risk-critical" />} />
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair bg-panel p-3">
        <div className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-hair bg-panel2 px-3 py-1.5 text-txt-tertiary">
          <Search className="h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search task ID, parcel ID, officer, location…"
            className="w-full bg-transparent text-[12.5px] text-txt-primary outline-none placeholder:text-txt-tertiary"
          />
        </div>

        <div className="flex items-center gap-3 text-[12px]">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-txt-tertiary" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary outline-none"
            >
              <option value="all">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Awaiting Supervisor Verification">Awaiting Supervisor</option>
            <option value="Verified">Verified</option>
            <option value="Revisit Requested">Revisit Requested</option>
          </select>
        </div>
      </div>

      {/* Main Table & Details Drawer Split */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 overflow-hidden rounded-xl border border-hair bg-panel">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-hair bg-panel2 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                  <th className="px-3.5 py-3">Task / Parcel</th>
                  <th className="px-3.5 py-3">Location</th>
                  <th className="px-3.5 py-3">Priority</th>
                  <th className="px-3.5 py-3">Assigned Officer</th>
                  <th className="px-3.5 py-3">Status</th>
                  <th className="px-3.5 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const isSelected = selectedCase?.id === c.id;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCase(c)}
                      className={clsx(
                        'border-b border-hair/60 transition-colors cursor-pointer hover:bg-panel2/60',
                        isSelected && 'bg-cyan-glow/20'
                      )}
                    >
                      <td className="px-3.5 py-3">
                        <div className="font-mono font-bold text-txt-primary">{c.id}</div>
                        <div className="font-mono text-[11px] text-cyan">{c.parcelId}</div>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="text-txt-primary flex items-center gap-1">
                          <Navigation className="h-3 w-3 text-txt-tertiary" /> {c.location}
                        </div>
                        <div className="font-mono text-[10.5px] text-txt-tertiary">Due {c.deadline}</div>
                      </td>

                      <td className="px-3.5 py-3">
                        <span
                          className={clsx(
                            'rounded px-2 py-0.5 font-mono text-[10px] font-bold',
                            c.priority === 'Critical'
                              ? 'bg-risk-critical/20 text-risk-critical'
                              : c.priority === 'High'
                              ? 'bg-risk-high/20 text-risk-high'
                              : c.priority === 'Medium'
                              ? 'bg-risk-medium/20 text-risk-medium'
                              : 'bg-risk-low/20 text-risk-low'
                          )}
                        >
                          {c.priority}
                        </span>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="font-mono text-[11.5px] text-txt-secondary">{c.officerRef}</div>
                      </td>

                      <td className="px-3.5 py-3">
                        <span
                          className={clsx(
                            'rounded-full px-2 py-0.5 font-mono text-[10px]',
                            c.status === 'Verified'
                              ? 'bg-risk-low/15 text-risk-low border border-risk-low/30'
                              : c.status === 'Revisit Requested'
                              ? 'bg-risk-critical/15 text-risk-critical border border-risk-critical/30'
                              : c.status === 'Awaiting Supervisor Verification'
                              ? 'bg-cyan-glow text-cyan border border-cyanline'
                              : 'bg-risk-medium/15 text-risk-medium border border-risk-medium/30'
                          )}
                        >
                          {c.status}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        {c.status === 'Awaiting Supervisor Verification' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(c.id, 'Verified');
                            }}
                            className="rounded bg-cyan-glow border border-cyanline px-2.5 py-1 font-mono text-[10.5px] text-cyan hover:bg-cyan hover:text-[#05131a]"
                          >
                            Approve
                          </button>
                        ) : c.status === 'Assigned' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(c.id, 'In Progress');
                            }}
                            className="rounded border border-hair bg-panel2 px-2.5 py-1 font-mono text-[10.5px] text-txt-secondary hover:border-cyanline hover:text-cyan"
                          >
                            Start
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCase(c);
                            }}
                            className="rounded border border-hair bg-panel2 px-2.5 py-1 font-mono text-[10.5px] text-txt-secondary hover:border-mid"
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Field Case Inspector */}
        <div>
          {selectedCase ? (
            <GlassPanel className="p-4 space-y-4">
              <div className="border-b border-hair pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wide text-txt-tertiary">Inspection Dossier</span>
                  <span className="rounded bg-panel2 border border-hair px-1.5 py-0.5 font-mono text-[9.5px] text-txt-secondary">
                    {selectedCase.priority} Priority
                  </span>
                </div>
                <div className="mt-1 font-display text-[16px] font-bold text-txt-primary">{selectedCase.id}</div>
                <div className="font-mono text-[12px] text-cyan">{selectedCase.parcelId}</div>
              </div>

              <div className="rounded-lg border border-hair bg-panel2 p-3 space-y-2 text-[12px]">
                <div className="flex justify-between">
                  <span className="text-txt-tertiary">Target Location:</span>
                  <span className="font-medium text-txt-primary">{selectedCase.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-tertiary">GPS Ground Lock:</span>
                  <span className={selectedCase.gpsCaptured ? 'text-risk-low font-bold font-mono' : 'text-risk-critical font-bold font-mono'}>
                    {selectedCase.gpsCaptured ? 'LOCKED (±0.4m)' : 'NOT CAPTURED'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-tertiary">Photo Evidence:</span>
                  <span className="font-mono flex items-center gap-1">
                    <Camera className="h-3 w-3 text-cyan" /> {selectedCase.photosCount} photos
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-txt-tertiary">Video Evidence:</span>
                  <span className="font-mono flex items-center gap-1">
                    <Video className="h-3 w-3 text-cyan" /> {selectedCase.videosCount} clips
                  </span>
                </div>
              </div>

              {selectedCase.observation && (
                <div className="rounded-lg border border-hair bg-panel2 p-3">
                  <div className="font-mono text-[9.5px] uppercase tracking-wide text-txt-tertiary mb-1">Field Observation Note</div>
                  <p className="text-[12px] text-txt-secondary leading-relaxed">{selectedCase.observation}</p>
                </div>
              )}

              {/* Re-assign Officer Form */}
              <div className="rounded-lg border border-hair bg-panel2 p-3 space-y-2">
                <div className="font-mono text-[10px] uppercase tracking-wide text-txt-tertiary">Assign / Transfer Task</div>
                <div className="flex gap-2">
                  <select
                    value={assignee}
                    onChange={(e) => setAssignee(e.target.value)}
                    className="flex-1 rounded-lg border border-hair bg-base px-2.5 py-1.5 font-mono text-[11px] text-txt-primary outline-none"
                  >
                    {AVAILABLE_OFFICERS.map((ofc) => (
                      <option key={ofc} value={ofc}>
                        {ofc}
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => handleAssign(selectedCase.id)} className="text-[11px] px-3 py-1.5">
                    Assign
                  </Button>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    className="text-[11px] py-2"
                    onClick={() => handleStatusChange(selectedCase.id, 'Verified')}
                  >
                    <CheckCircle2 className="h-3 w-3" /> Approve & Verify
                  </Button>
                  <Button
                    className="text-[11px] py-2 text-risk-critical hover:border-risk-critical"
                    onClick={() => handleStatusChange(selectedCase.id, 'Revisit Requested')}
                  >
                    <RotateCcw className="h-3 w-3" /> Request Revisit
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Link href="/gis" onClick={() => setSelectedParcel(selectedCase.parcelId)} className="flex-1">
                    <Button className="w-full text-[11px] py-1.5">
                      <Map className="h-3 w-3" /> 2D Map
                    </Button>
                  </Link>
                  <Link href="/twin" onClick={() => setSelectedParcel(selectedCase.parcelId)} className="flex-1">
                    <Button className="w-full text-[11px] py-1.5">
                      <Box className="h-3 w-3" /> 3D Twin
                    </Button>
                  </Link>
                </div>
              </div>
            </GlassPanel>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-hair p-6 text-center text-txt-tertiary">
              <ClipboardCheck className="mb-2 h-8 w-8 text-txt-tertiary" />
              <p className="text-[12.5px]">Select an inspection task to review GPS coordinates, survey photos, and submit verification approvals.</p>
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

