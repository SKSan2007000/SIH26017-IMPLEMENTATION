'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  FileText,
  MapPin,
  Box,
  Map,
  Clock,
  Trash2,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  HardHat,
  Users,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button } from '@/components/ui/Primitives';
import { useAppStore } from '@/lib/store/useAppStore';
import { notificationsApi } from '@/lib/api/notifications';
import type { NotificationItem } from '@/types';
import clsx from 'clsx';

export default function NotificationsPage() {
  const router = useRouter();
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const unreadCount = notifications.filter((a) => !a.read).length;

  async function markAllRead() {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch {
      setNotifications((prev) => prev.map((a) => ({ ...a, read: true })));
    }
  }

  async function handleMarkSingleRead(id: string) {
    try {
      await notificationsApi.markAsRead(id);
    } catch {}
    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)));
  }

  function handleNotificationClick(n: NotificationItem) {
    handleMarkSingleRead(n.id);
    if (n.projectId) {
      setSelectedProject(n.projectId);
    }
    if (n.actionUrl) {
      router.push(n.actionUrl);
    } else if (n.projectId) {
      router.push(`/dashboard/project-head?project=${encodeURIComponent(n.projectId)}`);
    }
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === 'unread') return !n.read;
    if (filterType === 'cadre') return n.category === 'Project Assignment' || n.category === 'Cadre Allocation';
    if (filterType === 'risk') return n.category === 'Critical Delay Risk' || n.category === 'Risk';
    return true;
  });

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-glow border border-cyanline px-2 py-0.5 font-mono text-[10px] font-bold text-cyan">
              REAL-TIME DISPATCH
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              Notifications & Cadre Operational Alert Center
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Automated task dispatch, SLA warning triggers, verification milestones, and legal notice updates
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={loadNotifications}
            title="Refresh Notifications"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-panel2 text-txt-secondary hover:border-cyan hover:text-cyan"
          >
            <RefreshCw className={clsx('h-3.5 w-3.5', loading && 'animate-spin')} />
          </button>
          {unreadCount > 0 && (
            <Button onClick={markAllRead} className="text-[12px]">
              <CheckCheck className="h-3.5 w-3.5" /> Mark All as Read ({unreadCount})
            </Button>
          )}
          <DemoFlag />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-4 flex items-center gap-2 border-b border-hair pb-2 text-xs font-mono">
        <button
          onClick={() => setFilterType('all')}
          className={clsx(
            'px-3 py-1.5 rounded-lg transition-colors',
            filterType === 'all' ? 'bg-cyan-glow text-cyan border border-cyanline font-bold' : 'text-txt-tertiary hover:text-white'
          )}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setFilterType('unread')}
          className={clsx(
            'px-3 py-1.5 rounded-lg transition-colors',
            filterType === 'unread' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold' : 'text-txt-tertiary hover:text-white'
          )}
        >
          Unread ({unreadCount})
        </button>

        <button
          onClick={() => setFilterType('cadre')}
          className={clsx(
            'px-3 py-1.5 rounded-lg transition-colors',
            filterType === 'cadre' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold' : 'text-txt-tertiary hover:text-white'
          )}
        >
          Cadre Assignments
        </button>

        <button
          onClick={() => setFilterType('risk')}
          className={clsx(
            'px-3 py-1.5 rounded-lg transition-colors',
            filterType === 'risk' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 font-bold' : 'text-txt-tertiary hover:text-white'
          )}
        >
          Delay Risk Spikes
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-hair p-6 text-center text-txt-tertiary">
            <Bell className="mb-2 h-8 w-8 text-txt-tertiary" />
            <p className="text-[13px]">No notifications found in this view.</p>
          </div>
        ) : (
          filteredNotifications.map((a) => (
            <div
              key={a.id}
              className={clsx(
                'flex flex-wrap items-center justify-between gap-4 rounded-xl border p-4 transition-all hover:bg-panel2/80 cursor-pointer',
                !a.read ? 'border-cyanline/70 bg-cyan-glow/15 shadow-lg shadow-cyan-950/20' : 'border-hair bg-panel'
              )}
              onClick={() => handleNotificationClick(a)}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={clsx(
                    'mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border shrink-0',
                    a.severity === 'Critical' || a.priority === 'CRITICAL'
                      ? 'border-risk-critical/40 bg-risk-critical/15 text-risk-critical'
                      : a.category === 'Project Assignment' || a.category === 'Cadre Allocation'
                      ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-400'
                      : a.severity === 'High'
                      ? 'border-risk-high/40 bg-risk-high/15 text-risk-high'
                      : 'border-cyanline bg-cyan-glow text-cyan'
                  )}
                >
                  {a.category === 'Project Assignment' || a.category === 'Cadre Allocation' ? (
                    <Users className="h-4 w-4" />
                  ) : a.severity === 'Critical' ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <Bell className="h-4 w-4" />
                  )}
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-display font-bold text-txt-primary text-[13.5px]">
                      {a.title || a.category}
                    </span>
                    {!a.read && (
                      <span className="rounded bg-cyan px-1.5 py-0.2 font-mono text-[9px] font-bold text-[#05131a]">
                        NEW
                      </span>
                    )}
                    {a.projectId && (
                      <span className="font-mono text-[10.5px] px-2 py-0.2 rounded bg-slate-800 text-cyan border border-slate-700">
                        {a.projectId}
                      </span>
                    )}
                    <span className="text-[10px] text-txt-tertiary font-mono uppercase">
                      {a.category}
                    </span>
                  </div>

                  <p className="text-[12.5px] text-txt-secondary leading-relaxed">
                    {a.message}
                  </p>

                  <div className="flex items-center gap-3 font-mono text-[11px] text-txt-tertiary pt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {a.timestamp ? new Date(a.timestamp).toLocaleString() : 'Just now'}
                    </span>
                    {a.actionUrl && (
                      <span className="text-cyan flex items-center gap-1 font-semibold">
                        Action available <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {a.actionUrl && (
                  <Button variant="primary" className="text-[11px] px-3 py-1.5">
                    Open Workflow <ArrowRight className="w-3 h-3" />
                  </Button>
                )}
                {!a.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkSingleRead(a.id);
                    }}
                    title="Mark as read"
                    className="p-1.5 rounded-lg border border-hair text-txt-tertiary hover:text-cyan hover:border-cyan"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </AppShell>
  );
}
