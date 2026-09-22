'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore, getRoleDashboardPath, RoleType } from '@/lib/store/useAuthStore';
import { ShieldAlert, LogIn, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  allowedRoles?: (RoleType | string)[];
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const initAuth = useAuthStore((s) => s.initAuth);
  const logout = useAuthStore((s) => s.logout);

  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    initAuth().then((authUser) => {
      // If not logged in, redirect to /signin
      if (!authUser) {
        setAuthorized(false);
        router.push('/signin');
        return;
      }

      // Check role permissions if specified
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = (authUser.role || '').toUpperCase();
        const isSuperAdmin = userRole === 'SUPER_ADMIN';
        const isRoleAllowed = allowedRoles.map((r) => r.toUpperCase()).includes(userRole);

        if (!isSuperAdmin && !isRoleAllowed) {
          setAuthorized(false);
          return;
        }
      }

      setAuthorized(true);
    });
  }, [pathname, allowedRoles, initAuth, router]);

  if (authorized === null) {
    return (
      <div className="flex h-64 w-full items-center justify-center font-mono text-[12px] text-txt-tertiary">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan border-t-transparent" />
          Verifying security clearance…
        </div>
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center p-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-risk-critical/40 bg-risk-critical/10 shadow-[0_0_30px_rgba(239,91,91,0.2)]">
          <ShieldAlert className="h-8 w-8 text-risk-critical" />
        </div>
        <h2 className="mt-4 font-display text-xl font-bold text-white">
          Access Restricted • Insufficient Clearance
        </h2>
        <p className="mt-1.5 max-w-md text-[13px] text-txt-secondary">
          Your current authenticated role (<span className="font-mono text-cyan">{user?.role || 'UNAUTHENTICATED'}</span>) does not have authorization to view this protected command dashboard.
        </p>
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => router.push(getRoleDashboardPath(user?.role))}
            className="flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow/40 px-4 py-2 font-mono text-[12px] font-bold text-cyan transition-all hover:bg-cyan-glow"
          >
            <span>Return to Authorized Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl border border-hair bg-panel2 px-4 py-2 font-mono text-[12px] text-txt-secondary hover:text-white"
          >
            <LogIn className="h-3.5 w-3.5" />
            <span>Switch Role / Sign In</span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
