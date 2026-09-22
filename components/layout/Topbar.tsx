'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  MapPin,
  ChevronDown,
  LogOut,
  User,
  Settings,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ExternalLink,
  CheckCheck,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { STATES_DISTRICTS } from '@/lib/mock/_generators';
import { MOCK_PARCELS } from '@/lib/mock/parcels';
import { MOCK_STAKEHOLDERS } from '@/lib/mock/stakeholders';
import { notificationsApi } from '@/lib/api/notifications';
import type { NotificationItem } from '@/types';
import clsx from 'clsx';

export function Topbar() {
  const router = useRouter();
  const pathname = usePathname();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const initAuth = useAuthStore((s) => s.initAuth);
  const isInitialized = useAuthStore((s) => s.isInitialized);

  const projects = useAppStore((s) => s.projects);
  const setProjects = useAppStore((s) => s.setProjects);
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);
  const setSelectedStakeholder = useAppStore((s) => s.setSelectedStakeholder);

  const stateFilter = useAppStore((s) => s.stateFilter);
  const districtFilter = useAppStore((s) => s.districtFilter);
  const setStateFilter = useAppStore((s) => s.setStateFilter);
  const setDistrictFilter = useAppStore((s) => s.setDistrictFilter);
  const districts = STATES_DISTRICTS[stateFilter] ?? [];

  const [search, setSearch] = useState('');
  const [openResults, setOpenResults] = useState(false);
  const [openUserMenu, setOpenUserMenu] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // Fetch live notifications
  const loadNotifications = async () => {
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
      const unread = data.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 8000);
    return () => clearInterval(interval);
  }, [user]);

  // Load live projects from backend
  useEffect(() => {
    let active = true;
    import('@/lib/api/projects').then(({ projectsApi }) => {
      projectsApi.getProjects().then((liveProjects) => {
        if (!active || !liveProjects || liveProjects.length === 0) return;
        // Merge without losing any local/mock ones
        const existingIds = new Set(liveProjects.map((p) => p.id));
        const merged = [...liveProjects];
        projects.forEach((p) => {
          if (!existingIds.has(p.id)) merged.push(p);
        });
        setProjects(merged);
      }).catch(() => {});
    });
    return () => { active = false; };
  }, []);

  // Authenticate & session check
  useEffect(() => {
    initAuth().then((authenticatedUser) => {
      if (!authenticatedUser && pathname !== '/' && pathname !== '/signin') {
        router.push('/signin');
      }
    });
  }, [pathname]);

  // Global search filtering
  const matchingProjects = search
    ? projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()))
    : [];
  const matchingParcels = search
    ? MOCK_PARCELS.filter((p) => p.id.toLowerCase().includes(search.toLowerCase()) || p.ownerRef.toLowerCase().includes(search.toLowerCase())).slice(0, 4)
    : [];
  const matchingStakeholders = search
    ? MOCK_STAKEHOLDERS.filter((s) => s.ref.toLowerCase().includes(search.toLowerCase()) || (s.name && s.name.toLowerCase().includes(search.toLowerCase()))).slice(0, 4)
    : [];

  const hasResults = matchingProjects.length > 0 || matchingParcels.length > 0 || matchingStakeholders.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setOpenResults(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setOpenUserMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setOpenNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const handleNotificationClick = async (n: NotificationItem) => {
    try {
      await notificationsApi.markAsRead(n.id);
    } catch {}
    setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setOpenNotifications(false);

    if (n.projectId) {
      setSelectedProject(n.projectId);
    }

    if (n.actionUrl) {
      router.push(n.actionUrl);
    } else if (n.projectId) {
      router.push(`/dashboard/project-head?project=${encodeURIComponent(n.projectId)}`);
    } else {
      router.push('/notifications');
    }
  };

  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'LG';

  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-3 border-b border-hair bg-base/70 px-4 backdrop-blur-md relative z-40">
      {/* State Filter */}
      <div className="flex items-center gap-1.5 rounded-lg border border-hair bg-panel2 px-2.5 py-1.5 text-[12.5px] text-txt-secondary">
        <MapPin className="h-3.5 w-3.5 text-txt-tertiary" />
        <select
          value={stateFilter}
          onChange={(e) => {
            setStateFilter(e.target.value);
            setDistrictFilter(STATES_DISTRICTS[e.target.value]?.[0] ?? '');
          }}
          className="bg-transparent text-[12.5px] text-txt-primary outline-none cursor-pointer"
        >
          {Object.keys(STATES_DISTRICTS).map((s) => (
            <option key={s} value={s} className="bg-raised">
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* District Filter */}
      <div className="flex items-center gap-1.5 rounded-lg border border-hair bg-panel2 px-2.5 py-1.5 text-[12.5px] text-txt-secondary">
        <select
          value={districtFilter}
          onChange={(e) => setDistrictFilter(e.target.value)}
          className="bg-transparent text-[12.5px] text-txt-primary outline-none cursor-pointer"
        >
          {districts.map((d) => (
            <option key={d} value={d} className="bg-raised">
              {d}
            </option>
          ))}
        </select>
        <ChevronDown className="h-3 w-3 text-txt-tertiary" />
      </div>

      {/* Universal Project Switcher */}
      <div className="flex items-center gap-1.5 rounded-lg border border-hair bg-panel2 px-2.5 py-1.5 text-[12.5px] text-txt-secondary">
        <select
          value={selectedProjectId ?? projects[0]?.id}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="bg-transparent text-[12.5px] text-txt-primary outline-none font-medium cursor-pointer max-w-[220px]"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id} className="bg-raised">
              {p.id}: {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Global Instant Command Search */}
      <div ref={searchRef} className="relative flex max-w-[320px] flex-1 items-center">
        <div className="flex w-full items-center gap-2 rounded-lg border border-hair bg-panel2 px-3 py-1.5 text-txt-tertiary focus-within:border-cyan">
          <Search className="h-3.5 w-3.5" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpenResults(true);
            }}
            onFocus={() => setOpenResults(true)}
            placeholder="Search projects (PRJ-2048), parcels, stakeholders…"
            className="w-full bg-transparent text-[12px] text-txt-primary outline-none placeholder:text-txt-tertiary font-mono"
          />
        </div>

        {openResults && search && hasResults && (
          <div className="absolute left-0 top-11 w-full rounded-xl border border-hair bg-void/95 p-2 shadow-2xl backdrop-blur-md z-50">
            {matchingProjects.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-txt-tertiary">Projects</div>
                {matchingProjects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProject(p.id);
                      setOpenResults(false);
                      setSearch('');
                      router.push(`/dashboard/project-head?project=${encodeURIComponent(p.id)}`);
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] text-txt-primary hover:bg-panel2"
                  >
                    <span className="font-medium truncate">{p.name}</span>
                    <span className="font-mono text-[10px] text-cyan">{p.id}</span>
                  </button>
                ))}
              </div>
            )}

            {matchingParcels.length > 0 && (
              <div className="mb-2">
                <div className="px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-txt-tertiary">Parcels</div>
                {matchingParcels.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedParcel(p.id);
                      setOpenResults(false);
                      setSearch('');
                      router.push('/gis');
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] text-txt-primary hover:bg-panel2"
                  >
                    <span className="font-mono font-bold text-cyan">{p.id}</span>
                    <span className="text-[11px] text-txt-tertiary truncate">{p.ownerRef}</span>
                  </button>
                ))}
              </div>
            )}

            {matchingStakeholders.length > 0 && (
              <div>
                <div className="px-2 py-1 font-mono text-[9px] uppercase tracking-wider text-txt-tertiary">Stakeholders</div>
                {matchingStakeholders.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedStakeholder(s.id);
                      setOpenResults(false);
                      setSearch('');
                      router.push('/stakeholders');
                    }}
                    className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-[12px] text-txt-primary hover:bg-panel2"
                  >
                    <span className="font-medium">{s.ref}</span>
                    <span className="font-mono text-[10px] text-txt-tertiary">{s.responseStatus}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right User Bar & Menu */}
      <div className="ml-auto flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-cyanline bg-cyan-glow px-2.5 py-1 font-mono text-[11px] text-cyan">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan" />
          </span>
          AI CADRE ENGINE — LIVE
        </div>

        {/* Notifications Bell Dropdown */}
        <div ref={notifMenuRef} className="relative">
          <button
            onClick={() => setOpenNotifications(!openNotifications)}
            title="Notifications"
            className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-hair bg-panel2 text-txt-secondary hover:border-cyan hover:text-cyan transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-risk-critical px-1 font-mono text-[9.5px] font-bold text-white shadow-lg animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {openNotifications && (
            <div className="absolute right-0 top-10 w-80 sm:w-96 rounded-2xl border border-hair bg-raised/95 shadow-2xl backdrop-blur-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between border-b border-hair p-3.5 bg-panel2/80">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-cyan" />
                  <span className="font-display font-bold text-[13.5px] text-white">
                    Alerts & Cadre Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-cyan-glow border border-cyanline px-2 py-0.2 font-mono text-[10px] text-cyan font-bold">
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-[11px] text-txt-tertiary hover:text-cyan transition-colors"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark read
                  </button>
                )}
              </div>

              <div className="max-h-[340px] overflow-y-auto divide-y divide-hair">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-txt-tertiary text-xs">
                    No active notifications.
                  </div>
                ) : (
                  notifications.slice(0, 6).map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={clsx(
                        'p-3 transition-colors hover:bg-panel2/60 cursor-pointer space-y-1',
                        !n.read ? 'bg-cyan-glow/10 border-l-2 border-l-cyan' : ''
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-white text-[12px] line-clamp-1">
                          {n.title || n.category}
                        </span>
                        <span className="font-mono text-[9.5px] text-txt-tertiary shrink-0">
                          {n.timestamp ? new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-txt-secondary line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      {n.projectId && (
                        <div className="flex items-center justify-between text-[10.5px] text-cyan font-mono pt-0.5">
                          <span>Project: {n.projectId}</span>
                          <span className="flex items-center gap-0.5 text-txt-tertiary hover:text-cyan">
                            View <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="border-t border-hair p-2 bg-panel2/60 text-center">
                <Link
                  href="/notifications"
                  onClick={() => setOpenNotifications(false)}
                  className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-cyan hover:underline"
                >
                  View All Notifications Hub <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Menu Trigger */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setOpenUserMenu(!openUserMenu)}
            className="flex items-center gap-2 border-l border-hair pl-2.5 hover:opacity-90"
          >
            <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyanline bg-gradient-to-br from-[#1a384c] to-[#0d1e28] font-mono text-[11px] text-cyan font-bold">
              {initials}
            </div>
            <div className="hidden text-left text-[11.5px] leading-tight lg:block">
              <div className="font-semibold text-txt-primary">
                {user?.fullName || 'LandGuard User'}
              </div>
              <div className="font-mono text-[10px] text-txt-tertiary">
                {user?.role ? user.role.replace(/_/g, ' ') : 'SUPER ADMIN'}
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-txt-tertiary" />
          </button>

          {/* User Dropdown Menu */}
          {openUserMenu && (
            <div className="absolute right-0 top-10 w-64 rounded-xl border border-hair bg-raised p-2 shadow-2xl backdrop-blur-xl z-50">
              <div className="border-b border-hair p-2.5">
                <div className="font-semibold text-txt-primary text-[13px]">{user?.fullName || 'Administrator'}</div>
                <div className="font-mono text-[10.5px] text-cyan">{user?.email || 'admin@landguard.ai'}</div>
                <div className="mt-1 flex items-center gap-1 font-mono text-[10px] text-txt-tertiary">
                  <Building className="h-3 w-3" /> {user?.department || 'Central Administration'}
                </div>
              </div>

              <div className="p-1 space-y-0.5 text-[12px]">
                <Link href="/settings" onClick={() => setOpenUserMenu(false)}>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-txt-secondary hover:bg-panel2 hover:text-white cursor-pointer">
                    <User className="h-3.5 w-3.5 text-txt-tertiary" />
                    <span>My Profile</span>
                  </div>
                </Link>

                <Link href="/notifications" onClick={() => setOpenUserMenu(false)}>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-txt-secondary hover:bg-panel2 hover:text-white cursor-pointer">
                    <Bell className="h-3.5 w-3.5 text-txt-tertiary" />
                    <span>Notifications ({unreadCount})</span>
                  </div>
                </Link>

                <Link href="/settings" onClick={() => setOpenUserMenu(false)}>
                  <div className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-txt-secondary hover:bg-panel2 hover:text-white cursor-pointer">
                    <Settings className="h-3.5 w-3.5 text-txt-tertiary" />
                    <span>Platform Settings</span>
                  </div>
                </Link>

                <div className="border-t border-hair my-1" />

                <button
                  onClick={() => {
                    setOpenUserMenu(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-risk-critical hover:bg-risk-critical/10 cursor-pointer"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
