'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';

export function GlassPanel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('rounded-xl border border-hair bg-panel backdrop-blur-md', className)}>
      {children}
    </div>
  );
}

export function PanelHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hair px-4 py-3">
      <h3 className="font-display text-[13.5px] font-semibold tracking-wide">{title}</h3>
      {sub && <span className="font-mono text-[10.5px] text-txt-tertiary">{sub}</span>}
    </div>
  );
}

export function DemoFlag({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-risk-high/35 bg-risk-high/10 px-2 py-1 font-mono text-[10.5px] tracking-wide text-risk-high',
        className
      )}
    >
      ⚠ DEMO / SIMULATION DATA
    </span>
  );
}

export function Button({
  children,
  onClick,
  variant = 'default',
  className,
  type = 'button',
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex items-center justify-center gap-2 rounded-lg border px-3.5 py-2.5 text-[12.5px] font-semibold transition-colors',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        variant === 'primary' && 'border-transparent bg-gradient-to-br from-cyan to-cyan-dim text-[#05131a] hover:opacity-90',
        variant === 'default' && 'border-mid bg-panel2 text-txt-primary hover:border-cyan hover:text-cyan',
        variant === 'ghost' && 'border-transparent bg-transparent text-txt-secondary hover:text-txt-primary',
        className
      )}
    >
      {children}
    </button>
  );
}

export function Switch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={clsx(
        'relative h-3.5 w-[26px] flex-shrink-0 rounded-full border transition-colors',
        on ? 'border-cyanline bg-cyan-glow' : 'border-mid bg-white/5'
      )}
      style={{ width: 26, height: 14 }}
      aria-pressed={on}
    >
      <span
        className={clsx('absolute top-0.5 h-2.5 w-2.5 rounded-full transition-all', on ? 'bg-cyan' : 'bg-txt-tertiary')}
        style={{ left: on ? 13 : 1 }}
      />
    </button>
  );
}

export function RiskPct({ pct, band }: { pct: number; band: string }) {
  const colorClass =
    band === 'critical' ? 'text-risk-critical' : band === 'high' ? 'text-risk-high' : band === 'medium' ? 'text-risk-medium' : 'text-risk-low';
  return <span className={clsx('font-mono font-bold', colorClass)}>{pct}%</span>;
}

export function ModuleStub({ label, icon, note }: { label: string; icon: ReactNode; note?: string }) {
  return (
    <div className="flex h-[calc(100vh-140px)] items-center justify-center">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-hair bg-panel2 text-txt-tertiary">
          {icon}
        </div>
        <h2 className="mb-2 font-display text-[17px] font-bold">{label}</h2>
        <p className="mb-3.5 text-[12.5px] leading-relaxed text-txt-tertiary">
          {note ??
            'This module is defined in the LandGuard AI information architecture and wired into navigation, but its UI is intentionally out of scope for this milestone — which focuses on Command Center → Route Planning → 2D GIS → 3D Twin → Project Intelligence. It will be built next using the same mock-data/service-function pattern as the modules above.'}
        </p>
        <span className="inline-block rounded-full border border-hair px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
          Planned — Next Milestone
        </span>
      </div>
    </div>
  );
}
