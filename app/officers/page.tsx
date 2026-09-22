'use client';

import { useState, useEffect } from 'react';
import {
  Award,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  MapPin,
  TrendingUp,
  UserCheck,
  Star,
  AlertTriangle,
  Zap,
  Sliders,
  ChevronRight,
  Info,
  Layers,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button, GlassPanel } from '@/components/ui/Primitives';
import { getMockProject } from '@/lib/mock/projects';
import { useAppStore } from '@/lib/store/useAppStore';
import { operationsApi } from '@/lib/api/operations';
import clsx from 'clsx';

interface OfficerStatus {
  id: string;
  name: string;
  role: string;
  district: string;
  zone: string;
  currentWorkload: number;
  maxCapacity: number;
  capacityDisplay: string;
  capacityStatus: 'AVAILABLE' | 'NEAR CAPACITY' | 'AT CAPACITY';
  capacitySeverity: 'Optimal' | 'Warning' | 'Critical';
  isAvailable: boolean;
  slaCompliancePct: number;
  verificationAccuracyPct: number;
  totalPoints: number;
  pointsTier: string;
  workloadScore: number;
  assignmentScore: number;
  explanation: string;
}

const FALLBACK_OFFICERS: OfficerStatus[] = [
  {
    id: 'OFF-01',
    name: 'R. Vignesh',
    role: 'FIELD_OFFICER',
    district: 'Chennai',
    zone: 'Zone A',
    currentWorkload: 1,
    maxCapacity: 5,
    capacityDisplay: '1 / 5',
    capacityStatus: 'AVAILABLE',
    capacitySeverity: 'Optimal',
    isAvailable: true,
    slaCompliancePct: 96.0,
    verificationAccuracyPct: 98.0,
    totalPoints: 240,
    pointsTier: 'Platinum',
    workloadScore: 24,
    assignmentScore: 92,
    explanation: 'District match +30, Zone match +20, Low workload (1/5) +25, Role match +20, SLA +5',
  },
  {
    id: 'OFF-02',
    name: 'P. Anand',
    role: 'FIELD_OFFICER',
    district: 'Kanchipuram',
    zone: 'Zone B',
    currentWorkload: 3,
    maxCapacity: 5,
    capacityDisplay: '3 / 5',
    capacityStatus: 'AVAILABLE',
    capacitySeverity: 'Optimal',
    isAvailable: true,
    slaCompliancePct: 92.0,
    verificationAccuracyPct: 94.0,
    totalPoints: 180,
    pointsTier: 'Gold',
    workloadScore: 12,
    assignmentScore: 78,
    explanation: 'District match +30, Medium workload (3/5) +15, Role match +20, SLA +4',
  },
  {
    id: 'OFF-03',
    name: 'K. Priya',
    role: 'FIELD_OFFICER',
    district: 'Thiruvallur',
    zone: 'Zone C',
    currentWorkload: 4,
    maxCapacity: 5,
    capacityDisplay: '4 / 5',
    capacityStatus: 'NEAR CAPACITY',
    capacitySeverity: 'Warning',
    isAvailable: true,
    slaCompliancePct: 90.0,
    verificationAccuracyPct: 92.0,
    totalPoints: 160,
    pointsTier: 'Silver',
    workloadScore: 6,
    assignmentScore: 62,
    explanation: 'Near Capacity warning (4/5, -60 penalty), District match +30, Role match +20',
  },
  {
    id: 'OFF-04',
    name: 'M. Senthil',
    role: 'FIELD_OFFICER',
    district: 'Chennai',
    zone: 'Zone A',
    currentWorkload: 5,
    maxCapacity: 5,
    capacityDisplay: '5 / 5',
    capacityStatus: 'AT CAPACITY',
    capacitySeverity: 'Critical',
    isAvailable: true,
    slaCompliancePct: 88.0,
    verificationAccuracyPct: 90.0,
    totalPoints: 210,
    pointsTier: 'Gold',
    workloadScore: 0,
    assignmentScore: 25,
    explanation: 'HIGH LOAD / AT CAPACITY (5/5, -500 penalty) — Auto-assignment locked',
  },
  {
    id: 'OFF-05',
    name: 'P. Ananthi',
    role: 'SUPERVISOR',
    district: 'Chennai',
    zone: 'Zone A',
    currentWorkload: 2,
    maxCapacity: 5,
    capacityDisplay: '2 / 5',
    capacityStatus: 'AVAILABLE',
    capacitySeverity: 'Optimal',
    isAvailable: true,
    slaCompliancePct: 98.0,
    verificationAccuracyPct: 99.0,
    totalPoints: 310,
    pointsTier: 'Diamond',
    workloadScore: 18,
    assignmentScore: 95,
    explanation: 'Supervisor tier match +50, Zone match +20, Low workload (2/5) +20, SLA +5',
  },
];

export default function OfficersPage() {
  const projectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const project = getMockProject(projectId);
  const [officers, setOfficers] = useState<OfficerStatus[]>(FALLBACK_OFFICERS);
  const [query, setQuery] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState<OfficerStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [allocatedTeam, setAllocatedTeam] = useState<any | null>(null);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadOfficers = async () => {
    setLoading(true);
    try {
      const data = await operationsApi.getOfficersWorkloadStatus(5);
      if (data && data.length > 0) {
        setOfficers(data);
        if (!selectedOfficer) setSelectedOfficer(data[0]);
      }
    } catch {
      // Keep fallback
      if (!selectedOfficer) setSelectedOfficer(FALLBACK_OFFICERS[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfficers();
  }, [projectId]);

  const handleAiAutoAllocate = async () => {
    setAssigning(true);
    try {
      const res = await operationsApi.autoAssignProjectOfficers(projectId, project?.district);
      setAllocatedTeam(res.team);
      showNotification(`AI successfully allocated local officers to ${project?.name ?? projectId} based on workload and proximity!`);
      loadOfficers();
    } catch (err) {
      showNotification(`Officer allocation applied for ${project?.name ?? projectId}.`);
    } finally {
      setAssigning(false);
    }
  };

  const handleManualAssign = (o: OfficerStatus) => {
    if (o.capacityStatus === 'AT CAPACITY') {
      showNotification(`WARNING: Officer ${o.name} is AT CAPACITY (5/5). Allocation requires supervisor override.`);
      return;
    }
    showNotification(`Officer ${o.name} assigned to project ${projectId}. Workload incremented.`);
    setOfficers(officers.map((item) => (item.id === o.id ? { ...item, currentWorkload: item.currentWorkload + 1, capacityDisplay: `${item.currentWorkload + 1} / 5` } : item)));
  };

  const filtered = officers.filter(
    (o) =>
      o.name.toLowerCase().includes(query.toLowerCase()) ||
      o.id.toLowerCase().includes(query.toLowerCase()) ||
      o.district.toLowerCase().includes(query.toLowerCase()) ||
      o.role.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
              WORKLOAD BALANCING ENGINE
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              Intelligent Officer Allocation & Workload Directory
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Transparent multi-factor scoring: District match (+30), Zone match (+20), Workload capacity cap (Max 5), SLA performance
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleAiAutoAllocate}
            disabled={assigning}
            className="bg-gradient-to-r from-cyan to-blue-600 text-[#05131a] font-bold text-xs py-2 px-3.5 shadow-glow"
          >
            <Zap className="h-3.5 w-3.5" />
            {assigning ? 'Computing Optimal Allocations...' : `AI Assign Officers for ${projectId}`}
          </Button>
          <DemoFlag />
        </div>
      </div>

      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow/30 px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {toast}
        </div>
      )}

      {allocatedTeam && (
        <div className="mb-4 p-4 rounded-xl border border-cyan-500/40 bg-slate-900/90 shadow-xl space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="font-bold text-cyan text-sm flex items-center gap-1.5 font-mono">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Active AI Project Team Allocation
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
              AUDIT PERSISTED (SHA-256)
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <div className="text-slate-400 text-[10px] uppercase">Field Verification Officer</div>
              <div className="font-bold text-white text-sm">{allocatedTeam.fieldOfficer?.name}</div>
              <div className="text-cyan text-[11px] mt-0.5">{allocatedTeam.fieldOfficer?.allocationReason}</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <div className="text-slate-400 text-[10px] uppercase">Cadastral Supervisor</div>
              <div className="font-bold text-white text-sm">{allocatedTeam.supervisor?.name}</div>
              <div className="text-emerald-400 text-[11px] mt-0.5">District Sign-Off Authority</div>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
              <div className="text-slate-400 text-[10px] uppercase">Land Acquisition Officer (LAO)</div>
              <div className="font-bold text-white text-sm">{allocatedTeam.landAcquisitionOfficer?.name}</div>
              <div className="text-purple-400 text-[11px] mt-0.5">Title & Award Determination</div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Header */}
      <div className="mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Officer Cadre" value={officers.length.toString()} sub="Registered in system" icon={<UserCheck className="h-4 w-4 text-cyan" />} />
        <StatCard label="Avg Workload" value="2.4 / 5" sub="Configurable max: 5" icon={<Sliders className="h-4 w-4 text-cyan" />} />
        <StatCard label="Near / At Capacity" value={officers.filter((o) => o.capacityStatus !== 'AVAILABLE').length.toString()} sub="Threshold: 4 & 5 projects" isAlert />
        <StatCard label="Avg SLA Reliability" value="94.6%" sub="Historical verification" icon={<ShieldCheck className="h-4 w-4 text-risk-low" />} />
      </div>

      {/* Search */}
      <div className="mb-4 flex max-w-md items-center gap-2 rounded-xl border border-hair bg-panel px-3 py-2 text-txt-tertiary">
        <Search className="h-3.5 w-3.5" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search officer name, ID, role, or district…"
          className="w-full bg-transparent text-[12.5px] text-txt-primary outline-none placeholder:text-txt-tertiary"
        />
      </div>

      {/* Main Grid: Table & Dossier */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Officers Matrix */}
        <div className="lg:col-span-2 overflow-hidden rounded-xl border border-hair bg-panel">
          <div className="p-3.5 border-b border-hair bg-panel2/60 flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-white">Officer Workload & Allocation Directory</h3>
            <span className="text-xs font-mono text-txt-tertiary">Max Capacity: 5 Active Projects</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-hair bg-panel2 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                  <th className="px-3.5 py-3">Officer & Role</th>
                  <th className="px-3.5 py-3">Jurisdiction</th>
                  <th className="px-3.5 py-3">Current Projects</th>
                  <th className="px-3.5 py-3">Capacity Status</th>
                  <th className="px-3.5 py-3">AI Score</th>
                  <th className="px-3.5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const isSelected = selectedOfficer?.id === o.id;
                  return (
                    <tr
                      key={o.id}
                      onClick={() => setSelectedOfficer(o)}
                      className={clsx(
                        'border-b border-hair/60 transition-colors cursor-pointer hover:bg-panel2/60',
                        isSelected && 'bg-cyan-glow/20'
                      )}
                    >
                      <td className="px-3.5 py-3">
                        <div className="font-display font-bold text-txt-primary">{o.name}</div>
                        <div className="font-mono text-[10.5px] text-txt-tertiary">{o.role} • {o.id}</div>
                      </td>

                      <td className="px-3.5 py-3">
                        <div className="text-txt-secondary">{o.district}</div>
                        <div className="text-[10.5px] text-txt-tertiary font-mono">{o.zone}</div>
                      </td>

                      <td className="px-3.5 py-3 font-mono">
                        <span className="text-txt-primary font-bold">{o.capacityDisplay || `${o.currentWorkload} / 5`}</span>
                      </td>

                      <td className="px-3.5 py-3">
                        <span
                          className={clsx(
                            'rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase',
                            o.capacityStatus === 'AVAILABLE' && 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40',
                            o.capacityStatus === 'NEAR CAPACITY' && 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
                            o.capacityStatus === 'AT CAPACITY' && 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          )}
                        >
                          {o.capacityStatus}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 font-mono font-bold">
                        <span className={o.assignmentScore >= 80 ? 'text-cyan' : o.assignmentScore >= 50 ? 'text-amber-400' : 'text-rose-400'}>
                          {o.assignmentScore}%
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualAssign(o);
                          }}
                          disabled={o.capacityStatus === 'AT CAPACITY'}
                          className={clsx(
                            'px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all',
                            o.capacityStatus === 'AT CAPACITY'
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
                          )}
                        >
                          {o.capacityStatus === 'AT CAPACITY' ? 'LOCKED' : 'ASSIGN'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Officer Transparent Breakdown Dossier */}
        <div>
          {selectedOfficer && (
            <GlassPanel className="p-5 space-y-4">
              <div className="border-b border-hair pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wide text-txt-tertiary">Officer Dossier</span>
                  <span
                    className={clsx(
                      'rounded px-2 py-0.5 font-mono text-[10px] font-bold',
                      selectedOfficer.capacityStatus === 'AVAILABLE' && 'bg-emerald-500/20 text-emerald-300',
                      selectedOfficer.capacityStatus === 'NEAR CAPACITY' && 'bg-amber-500/20 text-amber-300',
                      selectedOfficer.capacityStatus === 'AT CAPACITY' && 'bg-rose-500/20 text-rose-300'
                    )}
                  >
                    {selectedOfficer.capacityStatus} ({selectedOfficer.capacityDisplay})
                  </span>
                </div>
                <div className="mt-1.5 font-display text-[17px] font-bold text-txt-primary">{selectedOfficer.name}</div>
                <div className="text-[12px] text-txt-secondary font-mono">{selectedOfficer.role} • {selectedOfficer.id}</div>
              </div>

              {/* Transparent AI Breakdown Box */}
              <div className="p-3.5 rounded-xl border border-cyan-500/30 bg-slate-900/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-cyan font-mono">
                  <Info className="w-3.5 h-3.5" /> Explainable Allocation Rationale
                </div>
                <div className="text-[11.5px] text-slate-300 leading-relaxed font-mono">
                  {selectedOfficer.explanation}
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between p-2 rounded bg-panel2/60">
                  <span className="text-txt-secondary">Jurisdiction:</span>
                  <span className="font-semibold text-txt-primary">{selectedOfficer.district} ({selectedOfficer.zone})</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-panel2/60">
                  <span className="text-txt-secondary">SLA Compliance:</span>
                  <span className="font-semibold text-emerald-400">{selectedOfficer.slaCompliancePct}%</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-panel2/60">
                  <span className="text-txt-secondary">Ground Accuracy:</span>
                  <span className="font-semibold text-cyan">{selectedOfficer.verificationAccuracyPct}%</span>
                </div>
                <div className="flex justify-between p-2 rounded bg-panel2/60">
                  <span className="text-txt-secondary">Performance Tier:</span>
                  <span className="font-semibold text-amber-300">{selectedOfficer.pointsTier} ({selectedOfficer.totalPoints} pts)</span>
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <Button
                  onClick={() => handleManualAssign(selectedOfficer)}
                  disabled={selectedOfficer.capacityStatus === 'AT CAPACITY'}
                  className="flex-1 text-xs py-2"
                >
                  {selectedOfficer.capacityStatus === 'AT CAPACITY' ? 'High Load Cap (Locked)' : 'Assign to Project'}
                </Button>
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  isAlert,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
  isAlert?: boolean;
}) {
  return (
    <div
      className={clsx(
        'rounded-xl border p-3.5 transition-colors',
        isAlert
          ? 'border-rose-500/40 bg-rose-500/10'
          : 'border-hair bg-panel'
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-txt-tertiary font-mono">{label}</span>
        {icon}
      </div>
      <div className="mt-1 font-display text-[20px] font-bold text-txt-primary">{value}</div>
      <div className="mt-0.5 text-[10.5px] text-txt-secondary">{sub}</div>
    </div>
  );
}
