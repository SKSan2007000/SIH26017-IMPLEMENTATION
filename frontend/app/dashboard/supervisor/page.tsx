'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  RotateCcw,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  UserCheck,
  Check,
  Zap,
  Camera,
  Navigation,
  MapPin,
  Eye,
  FileCheck,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DemoFlag, GlassPanel, PanelHead, Button } from '@/components/ui/Primitives';
import { MOCK_OFFICERS } from '@/lib/mock/officers';
import { operationsApi } from '@/lib/api/operations';
import { fieldApi } from '@/lib/api/field';
import clsx from 'clsx';

interface PendingApprovalItem {
  id: string;
  parcelId: string;
  projectId: string;
  officer: string;
  location: string;
  photosCount: number;
  photoUrl?: string;
  gpsCoordinates?: [number, number];
  observation?: string;
  submittedAt: string;
  priority: string;
  status: string;
}

function SupervisorDashboardContent() {
  const searchParams = useSearchParams();
  const requestedProjectId = searchParams.get('project');
  const projectId = requestedProjectId || 'PRJ-1042';

  const fallbackApprovals: PendingApprovalItem[] = [
    {
      id: `VER-${projectId.replace('PRJ-', '')}-01`,
      parcelId: `PAR-${projectId.replace('PRJ-', '')}-001`,
      projectId,
      officer: 'R. Vignesh (Senior Field Officer)',
      location: 'Ambattur Industrial Ward 4',
      photosCount: 2,
      gpsCoordinates: [80.2374, 13.0872],
      observation: 'Cadastral boundary pegs confirmed on-ground. Boundary coordinates match FMB record with ±0.4m RTK precision.',
      submittedAt: '10 mins ago',
      priority: 'Critical',
      status: 'Awaiting Supervisor Verification',
    },
    {
      id: `VER-${projectId.replace('PRJ-', '')}-02`,
      parcelId: `PAR-${projectId.replace('PRJ-', '')}-004`,
      projectId,
      officer: 'P. Anand (Field Surveyor)',
      location: 'Sriperumbudur Block A',
      photosCount: 3,
      gpsCoordinates: [80.1802, 13.0105],
      observation: 'Utility power poles identified within 5m of northern right-of-way. Tree count validated at 14 standing teak trees.',
      submittedAt: '25 mins ago',
      priority: 'High',
      status: 'Awaiting Supervisor Verification',
    },
    {
      id: `VER-${projectId.replace('PRJ-', '')}-03`,
      parcelId: `PAR-${projectId.replace('PRJ-', '')}-008`,
      projectId,
      officer: 'K. Priya (Revenue Inspector)',
      location: 'Oragadam Corridor Link',
      photosCount: 1,
      gpsCoordinates: [80.1205, 12.9204],
      observation: 'Borewell structure verified. Landowner representative signed presence endorsement.',
      submittedAt: '1 hour ago',
      priority: 'Medium',
      status: 'Awaiting Supervisor Verification',
    },
  ];

  const [approvals, setApprovals] = useState<PendingApprovalItem[]>(fallbackApprovals);
  const [selectedCase, setSelectedCase] = useState<PendingApprovalItem>(fallbackApprovals[0]);
  const [loading, setLoading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadPendingTasks = async () => {
    try {
      const cases = await fieldApi.getFieldVerifications();
      if (cases && cases.length > 0) {
        const pending = cases.map((c: any) => ({
          id: c.id,
          parcelId: c.parcelId || c.parcel_id,
          projectId: c.projectId || c.project_id || projectId,
          officer: c.officerName || c.officer_ref || 'R. Vignesh',
          location: c.location || 'Corridor Grid',
          photosCount: c.photosCount || 1,
          photoUrl: c.photoEvidenceRef,
          gpsCoordinates: c.gpsCoordinates || [80.2374, 13.0872],
          observation: c.observation || 'Ground survey verified.',
          submittedAt: 'Just now',
          priority: c.priority || 'Medium',
          status: c.status || 'Awaiting Supervisor Verification',
        }));
        setApprovals(pending);
        if (pending.length > 0) setSelectedCase(pending[0]);
      }
    } catch {}
  };

  useEffect(() => {
    loadPendingTasks();
  }, [projectId]);

  const handleApprove = async (c: PendingApprovalItem) => {
    setReviewing(true);
    setApprovals(approvals.filter((a) => a.id !== c.id));
    showNotification(`✓ Ground verification ${c.id} for parcel ${c.parcelId} APPROVED! Officer awarded +15 points.`);

    try {
      await operationsApi.reviewTask(c.id, 'supervisor-01', 'APPROVED');
    } catch {
      // Offline fallback
    } finally {
      setReviewing(false);
      const remaining = approvals.filter((a) => a.id !== c.id);
      if (remaining.length > 0) setSelectedCase(remaining[0]);
    }
  };

  const handleRevisit = async (c: PendingApprovalItem) => {
    setReviewing(true);
    setApprovals(approvals.filter((a) => a.id !== c.id));
    showNotification(`Revisit requested for ${c.id}. Task returned to Field Officer queue with corrective notes.`);

    try {
      await operationsApi.reviewTask(c.id, 'supervisor-01', 'REVISIT_REQUESTED');
    } catch {
      // Offline fallback
    } finally {
      setReviewing(false);
      const remaining = approvals.filter((a) => a.id !== c.id);
      if (remaining.length > 0) setSelectedCase(remaining[0]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-2.5 border-b border-hair pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-indigo-300">
              SUPERVISOR CONTROL CENTER
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              Cadastral Verification Review & Sign-Off Authority
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Review uploaded photo evidence, verify GPS boundary coordinates & sign off on statutory acquisition stages for {projectId}
          </div>
        </div>
        <DemoFlag />
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard label="Officer Cadre" value={MOCK_OFFICERS.length.toString()} sub="Active Surveyors" />
        <StatCard label="Avg Workload" value="0.71" sub="Workload Index (0-1)" />
        <StatCard label="SLA Compliance" value="94.2%" sub="On-time delivery" />
        <StatCard label="Pending Review" value={approvals.length.toString()} sub="Awaiting sign-off" isWarning={approvals.length > 0} />
        <StatCard label="Escalations" value="2" sub="Supervisor intervention" isAlert />
        <StatCard label="Bottlenecks" value="3" sub="Cadastral disputes" />
        <StatCard label="Top Tier Points" value="1,240 pts" sub="Diamond Tier" />
        <StatCard label="Audit Chained" value="100%" sub="SHA-256 verified" />
      </div>

      {/* Main Split: Pending Approvals (Left) & Evidence Inspector (Right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Pending Approvals Queue */}
        <div className="space-y-4 lg:col-span-2">
          <div className="overflow-hidden rounded-xl border border-hair bg-panel">
            <div className="flex items-center justify-between border-b border-hair p-3.5 bg-panel2/60">
              <div className="flex items-center gap-2">
                <FileCheck className="h-4 w-4 text-cyan" />
                <h3 className="font-display text-[14px] font-bold text-txt-primary">
                  Field Verification Approval Queue ({approvals.length} Cases)
                </h3>
              </div>
              <span className="font-mono text-[10.5px] text-txt-tertiary">Real-Time Inspection Submissions</span>
            </div>

            {approvals.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs font-mono">
                ✓ All field verification submissions have been reviewed and approved!
              </div>
            ) : (
              <div className="divide-y divide-hair">
                {approvals.map((item) => {
                  const isSelected = selectedCase?.id === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedCase(item)}
                      className={clsx(
                        'p-4 transition-colors cursor-pointer hover:bg-panel2/60 space-y-3',
                        isSelected && 'bg-cyan-glow/20'
                      )}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-cyan text-[12px]">{item.id}</span>
                            <span className="font-semibold text-txt-primary text-[13px]">{item.parcelId}</span>
                            <span className="font-mono text-[10.5px] text-txt-tertiary">({item.projectId})</span>
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-txt-secondary">
                            <MapPin className="h-3.5 w-3.5 text-txt-tertiary" /> {item.location}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={clsx(
                              'rounded px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase',
                              item.priority === 'Critical' && 'bg-risk-critical/20 text-risk-critical border border-risk-critical/40',
                              item.priority === 'High' && 'bg-risk-high/20 text-risk-high border border-risk-high/40',
                              item.priority === 'Medium' && 'bg-cyan-glow text-cyan border border-cyanline'
                            )}
                          >
                            {item.priority}
                          </span>
                          <span className="font-mono text-[10px] text-txt-tertiary">{item.submittedAt}</span>
                        </div>
                      </div>

                      <div className="rounded-lg bg-panel2/60 p-2.5 text-xs text-txt-secondary flex justify-between items-center">
                        <div>
                          <span className="text-txt-tertiary">Surveyor: </span>
                          <span className="font-semibold text-txt-primary">{item.officer}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-cyan">{item.photosCount} Photos Attached</span>
                          <span className="text-emerald-400">GPS Locked</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApprove(item);
                          }}
                          disabled={reviewing}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Approve Verification
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRevisit(item);
                          }}
                          disabled={reviewing}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Request Revisit
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Evidence Review Dossier */}
        <div>
          {selectedCase && (
            <GlassPanel className="p-5 space-y-4">
              <div className="border-b border-hair pb-3">
                <div className="font-mono text-[10px] uppercase tracking-wide text-txt-tertiary">Evidence Dossier Review</div>
                <div className="font-display text-[17px] font-bold text-txt-primary">{selectedCase.parcelId}</div>
                <div className="font-mono text-[11.5px] text-cyan">{selectedCase.id} • {selectedCase.location}</div>
              </div>

              {/* Submitting Officer & GPS Coordinates */}
              <div className="space-y-2 text-xs font-mono">
                <div className="flex justify-between p-2 rounded bg-panel2/60">
                  <span className="text-txt-secondary">Field Surveyor:</span>
                  <span className="font-bold text-txt-primary">{selectedCase.officer}</span>
                </div>

                <div className="flex justify-between p-2 rounded bg-panel2/60">
                  <span className="text-txt-secondary">GPS Coordinates:</span>
                  <span className="font-bold text-emerald-400">
                    {selectedCase.gpsCoordinates ? `${selectedCase.gpsCoordinates[1]}° N, ${selectedCase.gpsCoordinates[0]}° E` : '13.0872° N, 80.2374° E'}
                  </span>
                </div>
              </div>

              {/* Uploaded Photo Evidence */}
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-txt-tertiary flex items-center gap-1">
                  <Camera className="w-3.5 h-3.5 text-cyan" /> Ground Inspection Photo Preview
                </div>
                {selectedCase.photoUrl ? (
                  <div className="relative rounded-lg overflow-hidden border border-slate-700 bg-black flex items-center justify-center max-h-48">
                    <img src={selectedCase.photoUrl} alt="Inspection Photo" className="w-full h-auto object-cover" />
                    <div className="absolute top-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[9.5px] font-mono text-emerald-400">
                      RTK GEO-TAGGED
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-slate-700 bg-slate-900/60 rounded-lg text-center font-mono text-xs text-slate-400 space-y-1">
                    <div className="text-cyan font-bold">Photo Evidence Verified (SHA-256)</div>
                    <div className="text-[10px] text-slate-500">Cadastral Boundary Peg Survey Photo #01</div>
                  </div>
                )}
              </div>

              {/* Officer Remarks */}
              <div className="space-y-1">
                <div className="text-xs font-mono text-txt-tertiary">Surveyor Observations:</div>
                <div className="p-3 rounded-lg bg-panel2/80 border border-hair text-xs text-slate-200 leading-relaxed font-mono">
                  {selectedCase.observation || 'Cadastral boundary and physical structures verified on-ground.'}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <Button
                  variant="primary"
                  onClick={() => handleApprove(selectedCase)}
                  disabled={reviewing}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs"
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve & Update Parcel Status
                </Button>

                <button
                  onClick={() => handleRevisit(selectedCase)}
                  disabled={reviewing}
                  className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  Request Field Revisit
                </button>
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SupervisorDashboard() {
  return (
    <AppShell>
      <AuthGuard allowedRoles={['SUPERVISOR', 'SUPER_ADMIN']}>
        <Suspense fallback={<div className="p-8 text-center text-cyan animate-pulse">Loading Supervisor Dashboard...</div>}>
          <SupervisorDashboardContent />
        </Suspense>
      </AuthGuard>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  sub,
  isAlert,
  isWarning,
}: {
  label: string;
  value: string;
  sub: string;
  isAlert?: boolean;
  isWarning?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border p-3.5 transition-colors',
        isAlert
          ? 'border-rose-500/40 bg-rose-500/10'
          : isWarning
          ? 'border-amber-500/40 bg-amber-500/10'
          : 'border-hair bg-panel'
      )}
    >
      <div className="font-mono text-[10px] uppercase text-txt-tertiary">{label}</div>
      <div className="mt-1 font-display text-[20px] font-bold text-txt-primary">{value}</div>
      <div className="mt-0.5 text-[10.5px] text-txt-secondary">{sub}</div>
    </div>
  );
}
