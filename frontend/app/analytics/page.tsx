'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Percent,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  PieChart,
  Activity,
  Globe,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button, GlassPanel } from '@/components/ui/Primitives';
import { getMockProject } from '@/lib/mock/projects';
import { getMockRisk, MOCK_RISKS } from '@/lib/mock/risks';
import { getMockRoutes } from '@/lib/mock/routes';
import { useAppStore } from '@/lib/store/useAppStore';
import { api } from '@/lib/api';
import type { CategoryRisk, PortfolioSummary, AnalyticsSnapshot } from '@/types';
import clsx from 'clsx';

export default function AnalyticsPage() {
  const projectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const project = getMockProject(projectId);
  const riskData = getMockRisk(projectId);
  const routes = getMockRoutes(projectId);

  const [mode, setMode] = useState<'project' | 'portfolio'>('project');
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSnapshot | null>(null);
  const [downloadToast, setDownloadToast] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [sum, anal] = await Promise.all([
          api.getPortfolioSummary(),
          api.getAnalytics(),
        ]);
        setSummary(sum);
        setAnalytics(anal);
      } catch (err) {
        console.error(err);
      }
    }
    loadData();
  }, []);

  function handleExport() {
    setDownloadToast(true);
    setTimeout(() => setDownloadToast(false), 3000);
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="font-display text-[20px] font-bold tracking-wide">
            {mode === 'portfolio' ? 'Statewide Infrastructure Portfolio Analytics' : 'Predictive Delay Analytics & Risk Modeling'}
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            {mode === 'portfolio'
              ? 'Multi-project aggregate risk indices, regional delay benchmarks, and portfolio budget execution'
              : `${project?.name} — Multi-factor regression, cadastral litigation density, and schedule slippage projections`}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex rounded-lg border border-hair bg-panel p-0.5 text-xs">
            <button
              onClick={() => setMode('project')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'project' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" /> Project Level
            </button>
            <button
              onClick={() => setMode('portfolio')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 transition-all ${
                mode === 'portfolio' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Statewide Portfolio
            </button>
          </div>

          <Button onClick={handleExport} className="text-[12px]">
            <Download className="h-3.5 w-3.5" /> Export Delay Risk Report (PDF)
          </Button>
          <DemoFlag />
        </div>
      </div>

      {downloadToast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          Export generated: LandGuard_{mode === 'portfolio' ? 'Portfolio' : 'Delay'}_Intelligence_{projectId}.pdf
        </div>
      )}

      {mode === 'portfolio' ? (
        /* Portfolio Level Analytics */
        <div className="space-y-6">
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="Portfolio Projects"
                value={`${summary.totalProjects} Active`}
                sub="Across Tamil Nadu, Karnataka & Maharashtra"
                icon={<Layers className="h-4 w-4 text-cyan" />}
              />
              <StatCard
                label="Total Portfolio Outlay"
                value={`₹${summary.totalEstimatedBudgetCr.toLocaleString()} Cr`}
                sub="Land Acquisition & Civil Works"
                icon={<TrendingUp className="h-4 w-4 text-emerald-400" />}
              />
              <StatCard
                label="Total Cadastrals at Risk"
                value={`${summary.totalAffectedParcels} Parcels`}
                sub="1,895 Target Acres"
                icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
              />
              <StatCard
                label="Mean Portfolio Risk"
                value={`${summary.overallPortfolioRiskPct}%`}
                sub="Moderate Regional Delay Index"
                accent="critical"
                icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
              />
            </div>
          )}

          {/* Regional Benchmarks */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                <h3 className="text-sm font-bold text-white mb-1">State-Wise Average Land Acquisition Delay (Days)</h3>
                <p className="text-xs text-slate-400 mb-4">Historical benchmark across statutory clearance stages</p>
                <div className="space-y-3">
                  {analytics.stateWiseDelayDays.map((st) => (
                    <div key={st.state} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-medium">{st.state}</span>
                        <span className="font-mono text-cyan-400 font-bold">{st.avgDelayDays} Days</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${Math.min(100, (st.avgDelayDays / 160) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
                <h3 className="text-sm font-bold text-white mb-1">District-Wise Acquisition Chokepoints</h3>
                <p className="text-xs text-slate-400 mb-4">Litigation and valuation grievance density</p>
                <div className="space-y-3">
                  {analytics.districtWiseDelayDays.map((dt) => (
                    <div key={dt.district} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-white font-medium">{dt.district}</span>
                        <span className="font-mono text-amber-400 font-bold">{dt.avgDelayDays} Days</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.min(100, (dt.avgDelayDays / 180) * 100)}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Project Specific Analytics */
        <>
          {/* KPI Cards */}
          <div className="mb-4 grid grid-cols-4 gap-3">
            <StatCard
              label="Composite Delay Risk"
              value={`${riskData?.overallPct ?? 87}%`}
              sub={riskData?.band?.toUpperCase() ?? 'CRITICAL'}
              accent="critical"
              icon={<ShieldAlert className="h-4 w-4 text-risk-critical" />}
            />
            <StatCard
              label="Projected Schedule Slippage"
              value={riskData?.predictedDelayLabel ?? '+5 months'}
              sub="Linear acquisition baseline"
              icon={<Clock className="h-4 w-4 text-risk-high" />}
            />
            <StatCard
              label="AI Model Confidence"
              value={`${riskData?.confidencePct ?? 88}%`}
              sub="Empirical validation score"
              icon={<TrendingUp className="h-4 w-4 text-cyan" />}
            />
            <StatCard
              label="Risk Trend Status"
              value={riskData?.trendStatus ?? 'DETERIORATING'}
              sub="Historical multi-point delta"
              icon={<AlertTriangle className="h-4 w-4 text-risk-critical" />}
            />
          </div>

          {/* 6-Factor Delay Decomposition Breakdown */}
          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="col-span-2 rounded-xl border border-hair bg-panel p-4">
              <div className="flex items-center justify-between border-b border-hair pb-3">
                <div>
                  <h3 className="font-display text-[15px] font-bold text-txt-primary">Cadastral Risk Category Decomposition</h3>
                  <p className="text-[11.5px] text-txt-tertiary">Explainable AI feature weight contribution to corridor delay</p>
                </div>
                <span className="rounded bg-cyan-glow/40 border border-cyanline px-2 py-0.5 font-mono text-[10px] text-cyan">
                  SHAP REGRESSION MODEL
                </span>
              </div>

              <div className="mt-4 space-y-3.5">
                {riskData?.categories?.map((f: CategoryRisk) => {
                  const pct = f.pct;
                  const color =
                    pct >= 75
                      ? 'bg-risk-critical'
                      : pct >= 50
                      ? 'bg-risk-high'
                      : pct >= 30
                      ? 'bg-risk-medium'
                      : 'bg-risk-low';

                  return (
                    <div key={f.name} className="space-y-1">
                      <div className="flex justify-between text-[12px]">
                        <span className="font-medium text-txt-primary">{f.name}</span>
                        <span className="font-mono font-bold text-txt-secondary">{pct}% Risk Factor</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-panel2">
                        <div className={clsx('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                }) ?? (
                  <div className="text-[12px] text-txt-tertiary">Category breakdown available for active corridor.</div>
                )}
              </div>
            </div>

            {/* Route Alternative Risk Comparison */}
            <div className="rounded-xl border border-hair bg-panel p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-display text-[15px] font-bold text-txt-primary">Route Delay Trade-off</h3>
                <p className="text-[11.5px] text-txt-tertiary mb-3">Delay probability across 4 corridor alternatives</p>

                <div className="space-y-2.5">
                  {routes.map((r) => (
                    <div
                      key={r.id}
                      className={clsx(
                        'rounded-lg border p-2.5 transition-colors',
                        r.aiRecommended ? 'border-cyanline bg-cyan-glow/20' : 'border-hair bg-panel2'
                      )}
                    >
                      <div className="flex items-center justify-between text-[12px]">
                        <span className="font-bold text-txt-primary">{r.label}</span>
                        <span className="font-mono text-cyan">{r.delayProbabilityPct}% delay risk</span>
                      </div>
                      <div className="mt-1 flex items-center justify-between font-mono text-[11px] text-txt-tertiary">
                        <span>{r.strategy}</span>
                        <span>+{r.estimatedDelayMonths} mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Link href="/route-planning" className="pt-3">
                <Button variant="primary" className="w-full text-[11.5px]">
                  Optimize Alignment <ArrowUpRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: React.ReactNode;
  accent?: 'critical';
}) {
  return (
    <div className="rounded-xl border border-hair bg-panel p-3.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">{label}</span>
        {icon}
      </div>
      <div className={clsx('mt-1.5 font-display text-[24px] font-bold', accent === 'critical' ? 'text-risk-critical' : 'text-txt-primary')}>
        {value}
      </div>
      <div className="mt-0.5 text-[11px] text-txt-tertiary">{sub}</div>
    </div>
  );
}
