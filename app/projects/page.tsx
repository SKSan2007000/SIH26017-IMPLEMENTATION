'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  Search,
  Route,
  Map,
  Box,
  TrendingUp,
  AlertTriangle,
  Clock,
  Filter,
  Users,
  ShieldCheck,
  Building,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button } from '@/components/ui/Primitives';
import { useAppStore } from '@/lib/store/useAppStore';
import { api } from '@/lib/api';
import type { PortfolioSummary, OfficerWorkload } from '@/types';
import { MOCK_RISKS } from '@/lib/mock/risks';
import clsx from 'clsx';

export default function ProjectsPage() {
  const projects = useAppStore((s) => s.projects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);

  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [officerWorkload, setOfficerWorkload] = useState<OfficerWorkload[]>([]);
  const [activeTab, setActiveTab] = useState<'directory' | 'workload' | 'portfolio'>('directory');
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);

  // Assignment Form State
  const [assignTargetProject, setAssignTargetProject] = useState(selectedProjectId || 'PRJ-1042');
  const [assignUserName, setAssignUserName] = useState('R. Vignesh (DEMO)');
  const [assignRole, setAssignRole] = useState('FIELD_OFFICER');
  const [assignDesignation, setAssignDesignation] = useState('Senior Field Surveyor');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  useEffect(() => {
    async function loadPortfolioData() {
      try {
        const [sum, officers] = await Promise.all([
          api.getPortfolioSummary(),
          api.getOfficerCrossProjectWorkload(),
        ]);
        setSummary(sum);
        setOfficerWorkload(officers);
      } catch (err) {
        console.error(err);
      }
    }
    loadPortfolioData();
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase().includes(query.toLowerCase()) ||
      p.state.toLowerCase().includes(query.toLowerCase()) ||
      p.district.toLowerCase().includes(query.toLowerCase());
    const matchesStage = stageFilter === 'all' || p.stage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssigning(true);
    try {
      await api.createProjectAssignment(assignTargetProject, {
        userId: `usr-${Date.now().toString().slice(-4)}`,
        userName: assignUserName,
        role: assignRole,
        designation: assignDesignation,
      });
      setAssignSuccess(true);
      setTimeout(() => {
        setAssignSuccess(false);
        setAssignmentModalOpen(false);
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="font-display text-[20px] font-bold tracking-wide">
            Multi-Project Portfolio & Workload Command Center
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Manage multi-corridor state infrastructure, officer assignments, contractor packages, and regional alignment planning
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setAssignmentModalOpen(true)} className="text-[12px]">
            <Users className="h-3.5 w-3.5" /> Assign Officer / Contractor
          </Button>
          <Link href="/projects/new">
            <Button className="text-[12px]">
              <Plus className="h-3.5 w-3.5" /> Create New Project
            </Button>
          </Link>
          <DemoFlag />
        </div>
      </div>

      {/* Portfolio Aggregate KPI Bar */}
      {summary && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Projects</span>
            <span className="text-xl font-bold text-white font-mono mt-0.5 block">{summary.totalProjects} Active</span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Portfolio Budget</span>
            <span className="text-xl font-bold text-emerald-400 font-mono mt-0.5 block">₹{summary.totalEstimatedBudgetCr.toLocaleString()} Cr</span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Target Land Area</span>
            <span className="text-xl font-bold text-amber-400 font-mono mt-0.5 block">{summary.totalLandImpactAcres.toLocaleString()} Ac</span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Affected Cadastrals</span>
            <span className="text-xl font-bold text-cyan-400 font-mono mt-0.5 block">{summary.totalAffectedParcels} Parcels</span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Stakeholders</span>
            <span className="text-xl font-bold text-purple-400 font-mono mt-0.5 block">{summary.totalStakeholders} Identified</span>
          </div>
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Portfolio Risk Index</span>
            <span className="text-xl font-bold text-cyan-300 font-mono mt-0.5 block">{summary.overallPortfolioRiskPct}% (MODERATE)</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-4 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('directory')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'directory' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FolderKanban className="w-4 h-4" /> All Projects Directory ({filtered.length})
          </button>
          <button
            onClick={() => setActiveTab('workload')}
            className={`pb-2 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'workload' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Officer Cross-Project Workload ({officerWorkload.length})
          </button>
        </div>
      </div>

      {activeTab === 'directory' ? (
        <>
          {/* Filter & Search */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair bg-panel p-3">
            <div className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-hair bg-panel2 px-3 py-1.5 text-txt-tertiary">
              <Search className="h-3.5 w-3.5" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search project name, ID, district…"
                className="w-full bg-transparent text-[12.5px] text-txt-primary outline-none placeholder:text-txt-tertiary"
              />
            </div>

            <div className="flex items-center gap-2 text-[12px]">
              <Filter className="h-3.5 w-3.5 text-txt-tertiary" />
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary outline-none"
              >
                <option value="all">All Stages</option>
                <option value="Planning">Planning</option>
                <option value="Survey">Survey</option>
                <option value="Notification">Notification</option>
                <option value="Award">Award</option>
              </select>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p) => {
              const risk = MOCK_RISKS[p.id];
              const isSelected = selectedProjectId === p.id;
              const riskPct = risk?.overallPct ?? 65;

              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProject(p.id)}
                  className={clsx(
                    'flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 cursor-pointer',
                    isSelected
                      ? 'border-cyan-500 bg-slate-800/90 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-850'
                  )}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-[11px] font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-0.5 rounded">
                        {p.id}
                      </span>
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 font-mono text-[9.5px] font-bold',
                          riskPct >= 75
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : riskPct >= 50
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        )}
                      >
                        {riskPct}% DELAY RISK
                      </span>
                    </div>

                    <h3 className="mt-2.5 font-display text-[15px] font-bold text-txt-primary leading-snug">{p.name}</h3>
                    <div className="mt-1 text-[11.5px] text-txt-tertiary">
                      {p.district}, {p.state} • {p.type}
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                        <span className="text-[9.5px] text-slate-500 block">Budget</span>
                        <span className="font-mono font-bold text-emerald-400">{p.budget}</span>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                        <span className="text-[9.5px] text-slate-500 block">Target Land</span>
                        <span className="font-mono font-bold text-amber-400">{p.landAreaAcres} acres</span>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                        <span className="text-[9.5px] text-slate-500 block">Workflow Stage</span>
                        <span className="font-mono font-bold text-cyan-300">{p.stage}</span>
                      </div>
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                        <span className="text-[9.5px] text-slate-500 block">Multi-Designs</span>
                        <span className="font-mono font-bold text-purple-300">4 Alternatives</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2 border-t border-slate-800/80 pt-3">
                    <Link href="/route-planning" onClick={() => setSelectedProject(p.id)} className="flex-1">
                      <Button variant="primary" className="w-full text-[11px] py-1.5 flex items-center justify-center gap-1.5">
                        <Route className="h-3.5 w-3.5" /> Multi-Design
                      </Button>
                    </Link>
                    <Link href="/gis" onClick={() => setSelectedProject(p.id)} className="flex-1">
                      <Button className="w-full text-[11px] py-1.5 flex items-center justify-center gap-1.5">
                        <Map className="h-3.5 w-3.5" /> 2D GIS
                      </Button>
                    </Link>
                    <Link href="/twin" onClick={() => setSelectedProject(p.id)} className="flex-1">
                      <Button className="w-full text-[11px] py-1.5 flex items-center justify-center gap-1.5">
                        <Box className="h-3.5 w-3.5" /> 3D Twin
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Officer Cross-Project Workload Table */
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 overflow-hidden backdrop-blur-md">
          <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Cross-Project Officer Workload & Allocation Index</h3>
              <p className="text-xs text-slate-400">
                Automated balancing prevents overburdening field surveyors across concurrent project corridors.
              </p>
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-500/30 px-2 py-1 rounded">
              AI SMART DISPATCH ENABLED
            </span>
          </div>

          <div className="overflow-x-auto p-4">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                  <th className="py-2.5 px-3">Officer Name & Role</th>
                  <th className="py-2.5 px-3">Assigned Projects</th>
                  <th className="py-2.5 px-3">Pending Tasks</th>
                  <th className="py-2.5 px-3">Critical Tasks</th>
                  <th className="py-2.5 px-3">Overdue</th>
                  <th className="py-2.5 px-3">SLA Compliance</th>
                  <th className="py-2.5 px-3">Workload Index</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {officerWorkload.map((o) => (
                  <tr key={o.officerId} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-bold text-white block">{o.officerName}</span>
                      <span className="text-slate-500 text-[10px]">{o.role}</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1">
                        {o.activeProjects.map((ap) => (
                          <span key={ap.projectId} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">
                            {ap.projectId} ({ap.taskCount})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold">{o.totalPendingTasks}</td>
                    <td className="py-3 px-3 font-mono text-rose-400 font-bold">{o.totalCriticalTasks}</td>
                    <td className="py-3 px-3 font-mono text-amber-400">{o.totalOverdueTasks}</td>
                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">{o.slaCompliancePct}%</td>
                    <td className="py-3 px-3 font-mono font-bold text-cyan-400">{o.crossProjectWorkloadIndex}</td>
                    <td className="py-3 px-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          o.availabilityStatus === 'Available'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : o.availabilityStatus === 'Moderate Load'
                            ? 'bg-cyan-500/20 text-cyan-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {o.availabilityStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Assignment Modal */}
      {assignmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-cyan-400" />
              Assign Officer or Contractor to Project
            </h3>
            <p className="text-xs text-slate-400">
              Project-specific role delegation with full audit logging and workload protection.
            </p>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Project</label>
                <select
                  value={assignTargetProject}
                  onChange={(e) => setAssignTargetProject(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">User Full Name</label>
                <input
                  type="text"
                  value={assignUserName}
                  onChange={(e) => setAssignUserName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Role</label>
                  <select
                    value={assignRole}
                    onChange={(e) => setAssignRole(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  >
                    <option value="FIELD_OFFICER">Field Officer / Surveyor</option>
                    <option value="DISTRICT_OFFICER">District Collector / LAO</option>
                    <option value="PROJECT_HEAD">Project Director</option>
                    <option value="CONTRACTOR">EPC Contractor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Designation</label>
                  <input
                    type="text"
                    value={assignDesignation}
                    onChange={(e) => setAssignDesignation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignmentModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigning}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  {assignSuccess ? 'Assigned Successfully!' : assigning ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
