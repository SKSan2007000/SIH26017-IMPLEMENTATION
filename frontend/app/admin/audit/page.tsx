'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Lock,
  Search,
  Filter,
  ShieldCheck,
  Clock,
  ArrowLeft,
  FileCheck,
  Layers,
  Users,
  Activity,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DemoFlag, GlassPanel } from '@/components/ui/Primitives';
import { MOCK_AUDIT_EVENTS } from '@/lib/mock/auditEvents';
import clsx from 'clsx';

export default function AdminAuditPage() {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filtered = MOCK_AUDIT_EVENTS.filter((e) => {
    const matchesSearch =
      e.id.toLowerCase().includes(query.toLowerCase()) ||
      e.label.toLowerCase().includes(query.toLowerCase()) ||
      e.actor?.toLowerCase().includes(query.toLowerCase()) ||
      e.projectId?.toLowerCase().includes(query.toLowerCase());
    const matchesCat = categoryFilter === 'all' || e.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  return (
    <AppShell>
      <AuthGuard allowedRoles={['SUPER_ADMIN']}>
      {/* Top Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <button className="flex items-center gap-1 text-[12px] font-mono text-cyan hover:underline">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Admin
              </button>
            </Link>
          </div>
          <div className="mt-1 font-display text-[20px] font-bold tracking-wide">
            Enterprise Audit Trail & SHA-256 Compliance Vault
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Tamper-evident, cryptographically chained activity logs for all corridor actions, design versions, officer approvals, and system state changes
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-cyanline bg-cyan-glow/40 px-3 py-1 font-mono text-[11px] text-cyan">
            <Lock className="h-3 w-3" /> IMMUTABLE BLOCK CHAINED
          </div>
          <DemoFlag />
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair bg-panel p-3">
        <div className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-hair bg-panel2 px-3 py-1.5 text-txt-tertiary">
          <Search className="h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search action, actor, entity ID, project ID…"
            className="w-full bg-transparent text-[12.5px] text-txt-primary outline-none placeholder:text-txt-tertiary"
          />
        </div>

        <div className="flex items-center gap-2 text-[12px]">
          <Filter className="h-3.5 w-3.5 text-txt-tertiary" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary outline-none"
          >
            <option value="all">All Categories</option>
            <option value="System">System Intake</option>
            <option value="Route Selection">Route Selection</option>
            <option value="Risk Assessment">Risk Assessment</option>
            <option value="Verification">Field Verification</option>
            <option value="Compensation">Compensation & Notices</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-xl border border-hair bg-panel">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-hair bg-panel2 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                <th className="px-3.5 py-3">Event ID / Hash</th>
                <th className="px-3.5 py-3">Timestamp</th>
                <th className="px-3.5 py-3">Actor / Role</th>
                <th className="px-3.5 py-3">Category</th>
                <th className="px-3.5 py-3">Action Description</th>
                <th className="px-3.5 py-3">Project / Entity</th>
                <th className="px-3.5 py-3 text-right">Verification</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} className="border-b border-hair/60 transition-colors hover:bg-panel2/50">
                  <td className="px-3.5 py-3">
                    <div className="font-mono font-bold text-cyan">{e.id}</div>
                    <div className="font-mono text-[9px] text-txt-tertiary truncate max-w-[120px]">
                      sha256:{Math.abs(e.id.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)).toString(16)}...
                    </div>
                  </td>

                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-1 font-mono text-[11px] text-txt-secondary">
                      <Clock className="h-3 w-3 text-txt-tertiary" /> {e.date || '2026-08-30'}
                    </div>
                    <div className="font-mono text-[10px] text-cyan">{e.time}</div>
                  </td>

                  <td className="px-3.5 py-3">
                    <div className="flex items-center gap-1.5 font-medium text-txt-primary">
                      <ShieldCheck className="h-3.5 w-3.5 text-cyan" />
                      <span>{e.actor || 'System Engine'}</span>
                    </div>
                    <div className="font-mono text-[10px] text-txt-tertiary">SUPER_ADMIN / OFFICER</div>
                  </td>

                  <td className="px-3.5 py-3">
                    <span className="rounded bg-panel2 border border-hair px-2 py-0.5 font-mono text-[9.5px] text-txt-secondary">
                      {e.category || 'Platform Event'}
                    </span>
                  </td>

                  <td className="px-3.5 py-3 text-txt-primary font-medium max-w-xs">
                    {e.label}
                  </td>

                  <td className="px-3.5 py-3">
                    <span className="font-mono text-[11px] text-txt-secondary">
                      {e.projectId || 'PRJ-1042'}
                    </span>
                  </td>

                  <td className="px-3.5 py-3 text-right">
                    <span className="inline-flex items-center gap-1 rounded-full border border-risk-low/40 bg-risk-low/10 px-2 py-0.5 font-mono text-[9.5px] text-risk-low">
                      <FileCheck className="h-3 w-3" /> VERIFIED
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </AuthGuard>
    </AppShell>
  );
}
