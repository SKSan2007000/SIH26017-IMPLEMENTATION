'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  ShieldCheck,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Activity,
  Layers,
  FileText,
  Lock,
  Plus,
  MapPin,
  Compass,
  ArrowRight,
  ExternalLink,
  Sparkles,
  HardHat,
  Award,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DemoFlag, GlassPanel, PanelHead, Button } from '@/components/ui/Primitives';
import { authApi, UserProfile, AdminStats } from '@/lib/api/auth';
import { projectsApi } from '@/lib/api/projects';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useAppStore } from '@/lib/store/useAppStore';
import { CreateProjectModal } from '@/components/projects/CreateProjectModal';
import { AssignmentResultCard } from '@/components/projects/AssignmentResultCard';
import type { Project } from '@/types';
import clsx from 'clsx';

const ALL_ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'PROJECT_HEAD', label: 'Project Head' },
  { value: 'DISTRICT_OFFICER', label: 'District Officer' },
  { value: 'LAND_ACQUISITION_OFFICER', label: 'Land Acquisition Officer' },
  { value: 'FIELD_OFFICER', label: 'Field Officer' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'CITIZEN', label: 'Citizen' },
  { value: 'CONTRACTOR', label: 'Contractor' },
];

export default function AdminPage() {
  const currentUser = useAuthStore((s) => s.user);
  const addProjectToStore = useAppStore((s) => s.addProject);
  const setSelectedProjectInStore = useAppStore((s) => s.setSelectedProject);

  const [activeTab, setActiveTab] = useState<'users' | 'projects' | 'rbac'>('users');
  const [stats, setStats] = useState<AdminStats>({
    total_users: 8,
    active_users: 8,
    total_projects: 10,
    high_risk_projects: 3,
    critical_parcels: 18,
    pending_approvals: 12,
    open_incidents: 6,
    system_alerts: 5,
  });
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  // Project Creation & Team Assignment State
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [lastCreatedProject, setLastCreatedProject] = useState<Project | null>(null);

  // User Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    password: 'LandGuard@2026',
    role: 'FIELD_OFFICER',
    district: 'Chennai',
    phone: '+91 94440-12345',
    isActive: true,
  });
  const [resetPassValue, setResetPassValue] = useState('LandGuard@2026');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, usersData, projectsData] = await Promise.all([
        authApi.getAdminStats(),
        authApi.listUsers({ search, role: roleFilter }),
        projectsApi.getProjects(),
      ]);
      setStats({
        ...statsData,
        total_projects: projectsData.length || statsData.total_projects,
      });
      setUsers(usersData);
      setProjects(projectsData);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleProjectCreated = (newProj: Project) => {
    addProjectToStore(newProj);
    setSelectedProjectInStore(newProj.id);
    setLastCreatedProject(newProj);
    setShowCreateProjectModal(false);
    showNotification(`🎉 Project "${newProj.name}" created and operational team auto-assigned!`);
    loadData();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.createUser({
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
        role: formData.role,
        designation: formData.role.replace('_', ' '),
        department: formData.district,
        phone: formData.phone,
        isActive: formData.isActive,
      });
      showNotification(`User ${formData.email} created successfully in database.`);
      setShowCreateModal(false);
      setFormData({
        email: '',
        fullName: '',
        password: 'LandGuard@2026',
        role: 'FIELD_OFFICER',
        district: 'Chennai',
        phone: '+91 94440-12345',
        isActive: true,
      });
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await authApi.updateUser(selectedUser.id, {
        fullName: selectedUser.fullName,
        role: selectedUser.role,
        department: selectedUser.department,
        phone: selectedUser.phone,
        isActive: selectedUser.isActive,
      });
      showNotification(`User ${selectedUser.email} updated.`);
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update user');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await authApi.resetPassword(selectedUser.id, resetPassValue);
      showNotification(`Password reset for ${selectedUser.email}.`);
      setShowResetModal(false);
    } catch (err: any) {
      alert(err?.message || 'Failed to reset password');
    }
  };

  const handleToggleStatus = async (u: UserProfile) => {
    try {
      await authApi.updateUser(u.id, { isActive: !u.isActive });
      showNotification(`User ${u.email} status set to ${!u.isActive ? 'Active' : 'Disabled'}.`);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (!confirm(`Are you sure you want to remove ${u.email}?`)) return;
    try {
      await authApi.deleteUser(u.id);
      showNotification(`User ${u.email} removed.`);
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to delete user');
    }
  };

  return (
    <AppShell>
      <AuthGuard allowedRoles={['SUPER_ADMIN']}>
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-glow border border-cyanline px-2 py-0.5 font-mono text-[10px] font-bold text-cyan">
                SUPER ADMIN
              </span>
              <div className="font-display text-[20px] font-bold tracking-wide">
                Admin Control Center & Infrastructure Portfolio
              </div>
            </div>
            <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
              Project provisioning, intelligent cadre allocation, user administration, and platform security controls
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowCreateProjectModal(true)}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3.5 py-1.5 font-mono text-[11.5px] font-bold text-white shadow-lg shadow-emerald-950/40 transition-all hover:scale-105 border border-emerald-400/40"
            >
              <Plus className="h-4 w-4" /> + CREATE PROJECT
            </button>
            <Link href="/admin/audit">
              <button className="flex items-center gap-1.5 rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary hover:border-cyan hover:text-cyan">
                <Lock className="h-3.5 w-3.5" /> View Audit Trail
              </button>
            </Link>
            <DemoFlag />
          </div>
        </div>

        {toast && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
            <CheckCircle2 className="h-4 w-4" /> {toast}
          </div>
        )}

        {/* Top 8 Summary Metric Cards */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <SummaryCard label="Total Users" value={stats.total_users} icon={<Users className="h-4 w-4 text-cyan" />} />
          <SummaryCard label="Active Users" value={stats.active_users} icon={<CheckCircle2 className="h-4 w-4 text-risk-low" />} />
          <SummaryCard label="Projects" value={stats.total_projects} icon={<FolderKanban className="h-4 w-4 text-txt-primary" />} />
          <SummaryCard label="High Risk" value={stats.high_risk_projects} icon={<AlertTriangle className="h-4 w-4 text-risk-high" />} />
          <SummaryCard label="Critical Parcels" value={stats.critical_parcels} icon={<Layers className="h-4 w-4 text-risk-critical" />} />
          <SummaryCard label="Pending SLA" value={stats.pending_approvals} icon={<Activity className="h-4 w-4 text-cyan" />} />
          <SummaryCard label="Open Incidents" value={stats.open_incidents} icon={<FileText className="h-4 w-4 text-risk-medium" />} />
          <SummaryCard label="System Alerts" value={stats.system_alerts} icon={<ShieldCheck className="h-4 w-4 text-cyan" />} />
        </div>

        {/* Newly Assigned Project Card (If created in this session) */}
        {lastCreatedProject && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <AssignmentResultCard
              project={lastCreatedProject}
              onClose={() => setLastCreatedProject(null)}
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-4 flex items-center gap-2 border-b border-hair pb-2">
          <button
            onClick={() => setActiveTab('users')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[12px] font-semibold transition-all',
              activeTab === 'users'
                ? 'bg-cyan-glow text-cyan border border-cyanline'
                : 'text-txt-tertiary hover:text-txt-primary hover:bg-panel2'
            )}
          >
            <Users className="h-4 w-4" />
            User Management & Directory ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[12px] font-semibold transition-all',
              activeTab === 'projects'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-txt-tertiary hover:text-txt-primary hover:bg-panel2'
            )}
          >
            <FolderKanban className="h-4 w-4" />
            Projects & Cadre Directory ({projects.length})
          </button>

          <button
            onClick={() => setActiveTab('rbac')}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-[12px] font-semibold transition-all',
              activeTab === 'rbac'
                ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                : 'text-txt-tertiary hover:text-txt-primary hover:bg-panel2'
            )}
          >
            <ShieldCheck className="h-4 w-4" />
            Security & RBAC Matrix
          </button>
        </div>

        {/* TAB 1: USER MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="overflow-hidden rounded-xl border border-hair bg-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair p-3.5 bg-panel2/60">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-cyan" />
                <h2 className="font-display text-[15px] font-bold text-txt-primary">User Management & Role Directory</h2>
                <span className="rounded-full bg-raised border border-hair px-2 py-0.5 font-mono text-[10.5px] text-txt-tertiary">
                  {users.length} Users
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                {/* Search Input */}
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5 rounded-lg border border-hair bg-raised px-2.5 py-1 text-txt-tertiary">
                  <Search className="h-3.5 w-3.5" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search name, email…"
                    className="w-40 bg-transparent text-[12px] text-txt-primary outline-none placeholder:text-txt-tertiary"
                  />
                </form>

                {/* Role Filter */}
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-txt-tertiary" />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="rounded-lg border border-hair bg-raised px-2.5 py-1 font-mono text-[11px] text-txt-secondary outline-none"
                  >
                    <option value="all">All Roles</option>
                    {ALL_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={loadData}
                  title="Refresh"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-raised text-txt-secondary hover:border-cyan hover:text-cyan"
                >
                  <RefreshCw className={clsx('h-3.5 w-3.5', loading && 'animate-spin')} />
                </button>

                {/* Create User Button */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-cyan to-cyan-dim px-3 py-1.5 font-mono text-[11.5px] font-bold text-[#05131a] shadow-glow hover:opacity-90"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  Create User
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-hair bg-raised/40 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                    <th className="px-4 py-3">Name / Email</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">District / Department</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-hair/60 transition-colors hover:bg-panel2/50">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-txt-primary">{u.fullName}</div>
                        <div className="font-mono text-[11px] text-txt-tertiary">{u.email}</div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            'rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase',
                            u.role === 'SUPER_ADMIN' && 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
                            u.role === 'PROJECT_HEAD' && 'bg-cyan-glow text-cyan border border-cyanline',
                            u.role === 'DISTRICT_OFFICER' && 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
                            u.role === 'LAND_ACQUISITION_OFFICER' && 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                            u.role === 'FIELD_OFFICER' && 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
                            u.role === 'SUPERVISOR' && 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
                            u.role === 'CITIZEN' && 'bg-teal-500/20 text-teal-300 border border-teal-500/30',
                            u.role === 'CONTRACTOR' && 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          )}
                        >
                          {u.role.replace(/_/g, ' ')}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-txt-secondary">
                        <div>{u.department || 'Central Administration'}</div>
                        <div className="font-mono text-[10.5px] text-txt-tertiary">{u.designation}</div>
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-txt-secondary">
                        {u.phone || '—'}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={clsx(
                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px]',
                            u.isActive
                              ? 'bg-risk-low/15 text-risk-low border border-risk-low/30'
                              : 'bg-risk-critical/15 text-risk-critical border border-risk-critical/30'
                          )}
                        >
                          <span className={clsx('h-1.5 w-1.5 rounded-full', u.isActive ? 'bg-risk-low' : 'bg-risk-critical')} />
                          {u.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowEditModal(true);
                            }}
                            title="Edit User"
                            className="rounded border border-hair bg-panel2 p-1 text-txt-secondary hover:border-cyan hover:text-cyan"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setShowResetModal(true);
                            }}
                            title="Reset Password"
                            className="rounded border border-hair bg-panel2 p-1 text-txt-secondary hover:border-amber-400 hover:text-amber-400"
                          >
                            <KeyRound className="h-3 w-3" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.isActive ? 'Disable User' : 'Enable User'}
                            className="rounded border border-hair bg-panel2 p-1 text-txt-secondary hover:border-mid"
                          >
                            {u.isActive ? <XCircle className="h-3 w-3 text-risk-high" /> : <CheckCircle2 className="h-3 w-3 text-risk-low" />}
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            title="Delete User"
                            className="rounded border border-hair bg-panel2 p-1 text-txt-secondary hover:border-risk-critical hover:text-risk-critical"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PROJECTS & CADRE DIRECTORY */}
        {activeTab === 'projects' && (
          <div className="overflow-hidden rounded-xl border border-hair bg-panel space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair p-3.5 bg-panel2/60">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-emerald-400" />
                <h2 className="font-display text-[15px] font-bold text-txt-primary">National Infrastructure Projects & Cadre Allocation</h2>
                <span className="rounded-full bg-raised border border-hair px-2 py-0.5 font-mono text-[10.5px] text-txt-tertiary">
                  {projects.length} Active Corridors
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadData}
                  title="Refresh Projects"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-raised text-txt-secondary hover:border-emerald-400 hover:text-emerald-400"
                >
                  <RefreshCw className={clsx('h-3.5 w-3.5', loading && 'animate-spin')} />
                </button>
                <button
                  onClick={() => setShowCreateProjectModal(true)}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 font-mono text-[11px] font-bold text-white shadow-lg transition-all"
                >
                  <Plus className="h-3.5 w-3.5" />
                  + Create New Project
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-hair bg-raised/40 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                    <th className="px-4 py-3">Project Code / Name</th>
                    <th className="px-4 py-3">District & State</th>
                    <th className="px-4 py-3">Type & Priority</th>
                    <th className="px-4 py-3">Budget & Land</th>
                    <th className="px-4 py-3">Assigned Cadre Team</th>
                    <th className="px-4 py-3">Workflow State</th>
                    <th className="px-4 py-3 text-right">Quick Navigation</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b border-hair/60 transition-colors hover:bg-panel2/50">
                      <td className="px-4 py-3">
                        <div className="font-mono text-xs font-bold text-emerald-400">{p.id}</div>
                        <div className="font-semibold text-txt-primary mt-0.5">{p.name}</div>
                        <div className="text-[11px] text-txt-tertiary truncate max-w-xs">{p.startLocation} → {p.destination}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-txt-primary">{p.district}</div>
                        <div className="font-mono text-[11px] text-txt-tertiary">{p.state}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-[11.5px] text-txt-secondary">{p.type}</div>
                        <span className={clsx(
                          'inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase',
                          p.priority === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        )}>
                          {p.priority || 'HIGH'}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono">
                        <div className="text-amber-300 font-bold">₹{p.estimatedBudgetCr || 850} Cr</div>
                        <div className="text-[11px] text-txt-tertiary">{p.requiredLandAreaAcres || 150} Acres</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 text-[11px]">
                          <span className="flex items-center gap-1 text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                            Head: <strong className="text-purple-300 font-normal">{p.projectHeadId || 'Dr. A. Sundaram'}</strong>
                          </span>
                          <span className="flex items-center gap-1 text-slate-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            FO: <strong className="text-emerald-300 font-normal">{p.fieldOfficerId || 'P. Murugan'}</strong>
                          </span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {p.status || 'Active'}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Link
                            href={`/gis?project=${encodeURIComponent(p.id)}`}
                            className="p-1.5 rounded border border-hair bg-panel2 hover:border-emerald-400 hover:text-emerald-400 text-txt-secondary transition-colors"
                            title="Open 2D GIS Map"
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/digital-twin?project=${encodeURIComponent(p.id)}`}
                            className="p-1.5 rounded border border-hair bg-panel2 hover:border-indigo-400 hover:text-indigo-400 text-txt-secondary transition-colors"
                            title="Open 3D Digital Twin"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/designs?project=${encodeURIComponent(p.id)}`}
                            className="p-1.5 rounded border border-hair bg-panel2 hover:border-cyan hover:text-cyan text-txt-secondary transition-colors"
                            title="Open Multi-Design Studio"
                          >
                            <Compass className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: RBAC MATRIX */}
        {activeTab === 'rbac' && (
          <div className="rounded-xl border border-hair bg-panel p-6 space-y-4">
            <div className="flex items-center gap-2 text-cyan font-bold font-display text-base">
              <ShieldCheck className="w-5 h-5" />
              <span>Role-Based Access Control (RBAC) Platform Matrix</span>
            </div>
            <p className="text-xs text-txt-secondary">
              LandGuard AI enforces strict multi-tier role authorization across infrastructure workflows:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-panel2 rounded-lg border border-hair">
                <span className="font-bold text-purple-400 block mb-1">SUPER ADMIN</span>
                <p className="text-txt-tertiary">Full system control, project intake, AI cadre allocation engine, security audits, database maintenance.</p>
              </div>

              <div className="p-3 bg-panel2 rounded-lg border border-hair">
                <span className="font-bold text-cyan block mb-1">PROJECT HEAD</span>
                <p className="text-txt-tertiary">Portfolio overview, budget tracking, risk forecasting, alignment design selection & SLA oversight.</p>
              </div>

              <div className="p-3 bg-panel2 rounded-lg border border-hair">
                <span className="font-bold text-emerald-400 block mb-1">FIELD OFFICER</span>
                <p className="text-txt-tertiary">Mobile field verification, geo-tagged survey photos, cadastral parcel boundary validation (Cap: 5 projects).</p>
              </div>

              <div className="p-3 bg-panel2 rounded-lg border border-hair">
                <span className="font-bold text-orange-400 block mb-1">CONTRACTOR</span>
                <p className="text-txt-tertiary">EPC design package downloads, corridor construction progress logs, work package tracking.</p>
              </div>
            </div>
          </div>
        )}

        {/* CREATE USER MODAL */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-cyanline/50 bg-raised p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-hair pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-cyan" />
                  <h3 className="font-display text-lg font-bold text-white">Create New Platform User</h3>
                </div>
                <button onClick={() => setShowCreateModal(false)} className="text-txt-tertiary hover:text-white">
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5 text-[12.5px]">
                <div>
                  <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. S. Ramanathan"
                    className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none focus:border-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">Email / Login ID</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="officer@landguard.ai"
                      className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none focus:border-cyan font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">Password</label>
                    <input
                      type="text"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none focus:border-cyan font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">Role Assignment</label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none focus:border-cyan"
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">District / Dept</label>
                    <input
                      type="text"
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      placeholder="Chennai / Land Acquisition Wing"
                      className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none focus:border-cyan"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 94440-12345"
                    className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none focus:border-cyan font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-hair">
                  <Button onClick={() => setShowCreateModal(false)} variant="ghost">
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary">
                    <UserPlus className="h-3.5 w-3.5" /> Create & Persist User
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* EDIT USER MODAL */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-lg rounded-2xl border border-hair bg-raised p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-hair pb-3">
                <h3 className="font-display text-lg font-bold text-white">Edit User: {selectedUser.email}</h3>
                <button onClick={() => setShowEditModal(false)} className="text-txt-tertiary hover:text-white">✕</button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-3.5 text-[12.5px]">
                <div>
                  <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">Full Name</label>
                  <input
                    type="text"
                    value={selectedUser.fullName}
                    onChange={(e) => setSelectedUser({ ...selectedUser, fullName: e.target.value })}
                    className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">Role</label>
                    <select
                      value={selectedUser.role}
                      onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
                      className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none"
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">Department</label>
                    <input
                      type="text"
                      value={selectedUser.department || ''}
                      onChange={(e) => setSelectedUser({ ...selectedUser, department: e.target.value })}
                      className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-hair">
                  <Button onClick={() => setShowEditModal(false)} variant="ghost">Cancel</Button>
                  <Button type="submit" variant="primary">Save Changes</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RESET PASSWORD MODAL */}
        {showResetModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md rounded-2xl border border-hair bg-raised p-6 shadow-2xl">
              <div className="mb-4 flex items-center justify-between border-b border-hair pb-3">
                <h3 className="font-display text-base font-bold text-white">Reset Password for {selectedUser.email}</h3>
                <button onClick={() => setShowResetModal(false)} className="text-txt-tertiary hover:text-white">✕</button>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-3.5 text-[12.5px]">
                <div>
                  <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">New Password</label>
                  <input
                    type="text"
                    required
                    value={resetPassValue}
                    onChange={(e) => setResetPassValue(e.target.value)}
                    className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-hair">
                  <Button onClick={() => setShowResetModal(false)} variant="ghost">Cancel</Button>
                  <Button type="submit" variant="primary">Reset Password</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CREATE PROJECT MODAL */}
        <CreateProjectModal
          isOpen={showCreateProjectModal}
          onClose={() => setShowCreateProjectModal(false)}
          onSuccess={handleProjectCreated}
        />
      </AuthGuard>
    </AppShell>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-hair bg-panel p-3">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[9.5px] uppercase tracking-wider text-txt-tertiary">{label}</span>
        {icon}
      </div>
      <div className="mt-1 font-display text-[20px] font-bold text-txt-primary">{value}</div>
    </div>
  );
}
