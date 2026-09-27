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
  ArrowLeft,
  MapPin,
  Building,
  Phone,
  Clock,
  Shield,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DemoFlag, GlassPanel, PanelHead, Button } from '@/components/ui/Primitives';
import { authApi, UserProfile, AdminStats } from '@/lib/api/auth';
import { useAuthStore } from '@/lib/store/useAuthStore';
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

const DISTRICT_LIST = ['Chennai', 'Salem', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Krishnagiri', 'Bengaluru Rural', 'Pune', 'Ernakulam', 'Rangareddy', 'Central'];
const ZONE_LIST = ['Zone A', 'Zone B', 'Zone C', 'South Zone', 'North Zone', 'Central Zone', 'West Zone', 'HQ'];

export default function AdminUsersPage() {
  const currentUser = useAuthStore((s) => s.user);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [toast, setToast] = useState<string | null>(null);

  // Modals
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
    zone: 'Zone A',
    phone: '+91 94440-12345',
    address: 'Regional Revenue Division',
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
      const usersData = await authApi.listUsers({ search, role: roleFilter });
      setUsers(usersData);
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.createUser({
        email: formData.email,
        fullName: formData.fullName,
        password: formData.password,
        role: formData.role,
        designation: formData.role.replace(/_/g, ' '),
        department: `${formData.district} Administration`,
        district: formData.district,
        zone: formData.zone,
        address: formData.address,
        phone: formData.phone,
        isActive: formData.isActive,
      });
      showNotification(`User ${formData.email} created and synchronized in database.`);
      setShowCreateModal(false);
      setFormData({
        email: '',
        fullName: '',
        password: 'LandGuard@2026',
        role: 'FIELD_OFFICER',
        district: 'Chennai',
        zone: 'Zone A',
        phone: '+91 94440-12345',
        address: 'Regional Revenue Division',
        isActive: true,
      });
      loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to create user. Email may already exist.');
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await authApi.updateUser(selectedUser.id, {
        fullName: formData.fullName,
        role: formData.role,
        district: formData.district,
        zone: formData.zone,
        phone: formData.phone,
        address: formData.address,
        isActive: formData.isActive,
      });
      showNotification(`User ${selectedUser.email} updated successfully.`);
      setShowEditModal(false);
      loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Failed to update user.');
    }
  };

  const handleToggleActive = async (u: UserProfile) => {
    try {
      await authApi.updateUser(u.id, { isActive: !u.isActive });
      showNotification(`User ${u.email} status changed to ${!u.isActive ? 'ACTIVE' : 'DEACTIVATED'}.`);
      loadData();
    } catch {
      showNotification('Failed to update status.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      await authApi.resetPassword(selectedUser.id, resetPassValue);
      showNotification(`Password reset for ${selectedUser.email}.`);
      setShowResetModal(false);
      setResetPassValue('LandGuard@2026');
    } catch {
      showNotification('Failed to reset password.');
    }
  };

  const handleDeleteUser = async (u: UserProfile) => {
    if (!confirm(`Are you sure you want to delete/deactivate user ${u.email}?`)) return;
    try {
      await authApi.deleteUser(u.id);
      showNotification(`User ${u.email} removed.`);
      loadData();
    } catch (err: any) {
      showNotification(err?.message || 'Cannot delete root administrator.');
    }
  };

  const openEditModal = (u: UserProfile) => {
    setSelectedUser(u);
    setFormData({
      email: u.email,
      fullName: u.fullName,
      password: '',
      role: u.role,
      district: u.district || 'Chennai',
      zone: u.zone || 'Zone A',
      phone: u.phone || '+91 94440-12345',
      address: u.address || 'Regional Revenue Division',
      isActive: u.isActive,
    });
    setShowEditModal(true);
  };

  const openResetModal = (u: UserProfile) => {
    setSelectedUser(u);
    setShowResetModal(true);
  };

  return (
    <AppShell>
      <AuthGuard allowedRoles={['SUPER_ADMIN']}>
        {/* Header */}
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/admin">
                <button className="flex items-center gap-1 rounded-lg border border-hair bg-panel2 px-2.5 py-1 font-mono text-[11px] text-txt-secondary hover:text-white">
                  <ArrowLeft className="h-3 w-3" /> Admin Overview
                </button>
              </Link>
              <span className="rounded bg-cyan-glow border border-cyanline px-2 py-0.5 font-mono text-[10px] font-bold text-cyan">
                SUPER ADMIN
              </span>
              <div className="font-display text-[20px] font-bold tracking-wide">
                User Management & Role-Based Access Control
              </div>
            </div>
            <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
              Manage system users, allocate officers to districts and zones, reset credentials & enforce security policies
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-transparent bg-gradient-to-r from-cyan to-cyan-dim px-3.5 py-1.5 font-mono text-[12px] font-bold text-[#05131a] shadow-[0_0_20px_rgba(0,229,255,0.3)] transition-all hover:opacity-95"
            >
              <UserPlus className="h-3.5 w-3.5" /> CREATE NEW USER
            </button>
            <DemoFlag />
          </div>
        </div>

        {toast && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
            <CheckCircle2 className="h-4 w-4" /> {toast}
          </div>
        )}

        {/* Search & Filter Toolbar */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair bg-panel p-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-1 items-center gap-2 max-w-md">
            <div className="relative flex flex-1 items-center rounded-lg border border-hair bg-panel2 px-2.5 py-1.5 text-txt-secondary">
              <Search className="h-3.5 w-3.5 mr-2 text-txt-tertiary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or district…"
                className="w-full bg-transparent text-[12px] text-txt-primary outline-none placeholder:text-txt-tertiary"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary hover:border-cyan hover:text-cyan"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-txt-tertiary" />
            <span className="font-mono text-[11px] text-txt-tertiary">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-hair bg-panel2 px-2.5 py-1 text-[11.5px] text-txt-primary outline-none cursor-pointer"
            >
              <option value="all">All Roles ({users.length})</option>
              {ALL_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <button
              onClick={loadData}
              className="rounded-lg border border-hair bg-panel2 p-1.5 text-txt-secondary hover:text-white"
              title="Refresh"
            >
              <RefreshCw className={clsx('h-3.5 w-3.5', loading && 'animate-spin')} />
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-xl border border-hair bg-panel shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-hair bg-panel2/80 text-left font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                  <th className="p-3">User & Email</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">District & Zone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-hair">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-panel2/40 transition-colors">
                    <td className="p-3">
                      <div className="font-semibold text-white">{u.fullName}</div>
                      <div className="font-mono text-[11px] text-txt-tertiary">{u.email}</div>
                    </td>
                    <td className="p-3">
                      <span
                        className={clsx(
                          'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-[10.5px] font-bold',
                          u.role === 'SUPER_ADMIN' && 'bg-cyan-glow text-cyan border border-cyanline',
                          u.role === 'PROJECT_HEAD' && 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
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
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-txt-secondary">
                        <MapPin className="h-3 w-3 text-txt-tertiary" />
                        <span>{u.district || 'Chennai'}</span>
                        <span className="text-txt-tertiary">/ {u.zone || 'Zone A'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={clsx(
                          'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold cursor-pointer transition-all',
                          u.isActive
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                            : 'bg-risk-critical/15 text-risk-critical border border-risk-critical/30 hover:bg-risk-critical/25'
                        )}
                      >
                        {u.isActive ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> ACTIVE
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> INACTIVE
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-txt-tertiary">
                      {u.phone || '+91 94440-12345'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(u)}
                          className="rounded-lg border border-hair bg-panel2 p-1.5 text-txt-secondary hover:border-cyan hover:text-cyan"
                          title="Edit User"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => openResetModal(u)}
                          className="rounded-lg border border-hair bg-panel2 p-1.5 text-txt-secondary hover:border-amber-400 hover:text-amber-400"
                          title="Reset Password"
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.email === 'admin@landguard.ai'}
                          className={clsx(
                            'rounded-lg border border-hair bg-panel2 p-1.5 text-txt-secondary hover:border-risk-critical hover:text-risk-critical',
                            u.email === 'admin@landguard.ai' && 'opacity-40 cursor-not-allowed'
                          )}
                          title="Delete User"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- CREATE USER MODAL --- */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md rounded-2xl border border-hair bg-raised p-6 shadow-2xl">
              <h3 className="font-display text-lg font-bold text-white mb-1">Create New Staff User</h3>
              <p className="text-[12px] text-txt-tertiary mb-4">
                Provision a staff account and assign jurisdiction district and operational zone.
              </p>

              <form onSubmit={handleCreateUser} className="space-y-3">
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Demo Officer Name"
                    required
                    className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12.5px] text-white outline-none focus:border-cyan"
                  />
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="officer.name@landguard.ai"
                    required
                    className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 font-mono text-[12px] text-white outline-none focus:border-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                      Role *
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12px] text-white outline-none cursor-pointer focus:border-cyan"
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                      Initial Password
                    </label>
                    <input
                      type="text"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 font-mono text-[12px] text-white outline-none focus:border-cyan"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                      District
                    </label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12px] text-white outline-none cursor-pointer focus:border-cyan"
                    >
                      {DISTRICT_LIST.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                      Zone
                    </label>
                    <select
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12px] text-white outline-none cursor-pointer focus:border-cyan"
                    >
                      {ZONE_LIST.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                      Phone
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 font-mono text-[12px] text-white outline-none focus:border-cyan"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                      Status
                    </label>
                    <select
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12px] text-white outline-none cursor-pointer focus:border-cyan"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-hair">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="rounded-xl border border-hair bg-panel px-4 py-2 font-mono text-[11.5px] text-txt-secondary hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-cyan to-cyan-dim px-4 py-2 font-mono text-[11.5px] font-bold text-[#05131a] hover:opacity-95"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- EDIT USER MODAL --- */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md rounded-2xl border border-hair bg-raised p-6 shadow-2xl">
              <h3 className="font-display text-lg font-bold text-white mb-1">Edit User Profile</h3>
              <p className="font-mono text-[11.5px] text-cyan mb-4">{selectedUser.email}</p>

              <form onSubmit={handleEditUser} className="space-y-3">
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    required
                    className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12.5px] text-white outline-none focus:border-cyan"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12px] text-white outline-none cursor-pointer focus:border-cyan"
                    >
                      {ALL_ROLES.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                      Status
                    </label>
                    <select
                      value={formData.isActive ? 'true' : 'false'}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                      className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12px] text-white outline-none cursor-pointer focus:border-cyan"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                      District
                    </label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12px] text-white outline-none cursor-pointer focus:border-cyan"
                    >
                      {DISTRICT_LIST.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                      Zone
                    </label>
                    <select
                      value={formData.zone}
                      onChange={(e) => setFormData({ ...formData, zone: e.target.value })}
                      className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 text-[12px] text-white outline-none cursor-pointer focus:border-cyan"
                    >
                      {ZONE_LIST.map((z) => (
                        <option key={z} value={z}>
                          {z}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full rounded-xl border border-hair bg-panel2 px-3 py-1.5 font-mono text-[12px] text-white outline-none focus:border-cyan"
                  />
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-hair">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="rounded-xl border border-hair bg-panel px-4 py-2 font-mono text-[11.5px] text-txt-secondary hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-cyan to-cyan-dim px-4 py-2 font-mono text-[11.5px] font-bold text-[#05131a] hover:opacity-95"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- RESET PASSWORD MODAL --- */}
        {showResetModal && selectedUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-sm rounded-2xl border border-hair bg-raised p-6 shadow-2xl">
              <h3 className="font-display text-lg font-bold text-white mb-1">Reset Password</h3>
              <p className="font-mono text-[11.5px] text-amber-400 mb-4">{selectedUser.email}</p>

              <form onSubmit={handleResetPassword} className="space-y-3">
                <div>
                  <label className="mb-1 block font-mono text-[10.5px] uppercase tracking-wider text-txt-tertiary">
                    New Password
                  </label>
                  <input
                    type="text"
                    value={resetPassValue}
                    onChange={(e) => setResetPassValue(e.target.value)}
                    required
                    className="w-full rounded-xl border border-hair bg-panel2 px-3 py-2 font-mono text-[12px] text-white outline-none focus:border-amber-400"
                  />
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-hair">
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    className="rounded-xl border border-hair bg-panel px-4 py-2 font-mono text-[11.5px] text-txt-secondary hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 px-4 py-2 font-mono text-[11.5px] font-bold text-[#05131a] hover:opacity-95"
                  >
                    Confirm Reset
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AuthGuard>
    </AppShell>
  );
}
