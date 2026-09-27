'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Search,
  CheckCircle2,
  FolderKanban,
  FileText,
  Layers,
  Award,
  HardHat,
  AlertTriangle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, GlassPanel, PanelHead, Button } from '@/components/ui/Primitives';
import { MOCK_PROJECTS } from '@/lib/mock/projects';
import { MOCK_OFFICERS } from '@/lib/mock/officers';
import { MOCK_PARCELS } from '@/lib/mock/parcels';
import clsx from 'clsx';

type ReportType =
  | 'project_risk'
  | 'acquisition_progress'
  | 'route_comparison'
  | 'officer_performance'
  | 'compensation_status'
  | 'disputes_report'
  | 'contractor_progress'
  | 'ai_summary';

const REPORT_TABS: { id: ReportType; label: string; icon: any }[] = [
  { id: 'project_risk', label: 'Project Risk Report', icon: AlertTriangle },
  { id: 'acquisition_progress', label: 'Land Acquisition Progress', icon: Layers },
  { id: 'route_comparison', label: 'Route Comparison', icon: FolderKanban },
  { id: 'officer_performance', label: 'Officer Performance & Points', icon: Award },
  { id: 'compensation_status', label: 'Compensation Status & Awards', icon: FileSpreadsheet },
  { id: 'disputes_report', label: 'Dispute & Litigation Report', icon: FileText },
  { id: 'contractor_progress', label: 'Contractor Construction Progress', icon: HardHat },
  { id: 'ai_summary', label: 'AI Risk Executive Summary', icon: CheckCircle2 },
];

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('project_risk');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleExportCSV = () => {
    // Generate simple CSV payload for demo
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'ID,Name,District,Budget_Cr,Land_Acres,Risk_Score,Status\n';
    MOCK_PROJECTS.forEach((p) => {
      csvContent += `${p.id},"${p.name}",${p.district},${p.estimatedBudgetCr},${p.requiredLandAreaAcres},${p.riskScore || 50},"${p.status}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LandGuard_${selectedReport}_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification(`CSV Report exported: LandGuard_${selectedReport}_Export.csv`);
  };

  return (
    <AppShell>
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-cyan-glow border border-cyanline px-2 py-0.5 font-mono text-[10px] font-bold text-cyan">
              REPORTS & AUDIT
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              Statutory Reporting & Export Intelligence
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Generate, filter, and export formal RFCTLARR acquisition audits, contractor milestones & officer points
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-lg border border-transparent bg-gradient-to-r from-cyan to-cyan-dim px-3.5 py-1.5 font-mono text-[11.5px] font-bold text-[#05131a] shadow-glow hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" /> Export Report (CSV)
          </button>
          <DemoFlag />
        </div>
      </div>

      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      {/* Report Selection Tabs */}
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-hair pb-3">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = selectedReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedReport(tab.id)}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11px] transition-all',
                isSelected
                  ? 'bg-cyan-glow border border-cyanline text-cyan font-bold'
                  : 'bg-panel2/60 border border-hair text-txt-secondary hover:border-mid hover:text-white'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Report Table Container */}
      <div className="overflow-hidden rounded-xl border border-hair bg-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hair p-3.5 bg-panel2/60">
          <h3 className="font-display text-[14px] font-bold text-txt-primary">
            {REPORT_TABS.find((t) => t.id === selectedReport)?.label}
          </h3>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter report records…"
              className="rounded-lg border border-hair bg-panel px-3 py-1 text-[11.5px] text-txt-primary outline-none focus:border-cyan"
            />
          </div>
        </div>

        {/* Dynamic Table Rendering Based on Selected Report */}
        <div className="overflow-x-auto">
          {selectedReport === 'officer_performance' ? (
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-hair bg-raised/40 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                  <th className="px-4 py-3">Officer Name / ID</th>
                  <th className="px-4 py-3">Designation</th>
                  <th className="px-4 py-3">Completed Inspections</th>
                  <th className="px-4 py-3">SLA Compliance Rate</th>
                  <th className="px-4 py-3">Incentive Points</th>
                  <th className="px-4 py-3">Tier</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_OFFICERS.map((o) => (
                  <tr key={o.id} className="border-b border-hair/60 hover:bg-panel2/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-txt-primary">{o.name}</div>
                      <div className="font-mono text-[10.5px] text-txt-tertiary">{o.id}</div>
                    </td>
                    <td className="px-4 py-3 text-txt-secondary">{o.role}</td>
                    <td className="px-4 py-3 font-mono font-medium text-txt-primary">{o.completedTasks || 24}</td>
                    <td className="px-4 py-3 font-mono text-txt-primary">{o.slaCompliance}%</td>
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">{o.points} pts</td>
                    <td className="px-4 py-3 font-mono text-cyan">{o.tier || 'Gold'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : selectedReport === 'compensation_status' ? (
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-hair bg-raised/40 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                  <th className="px-4 py-3">Parcel ID</th>
                  <th className="px-4 py-3">Owner / Claimant</th>
                  <th className="px-4 py-3">Survey No</th>
                  <th className="px-4 py-3">Area (Acres)</th>
                  <th className="px-4 py-3">Base Valuation</th>
                  <th className="px-4 py-3">Total LARR Award</th>
                  <th className="px-4 py-3">Disbursement Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PARCELS.slice(0, 10).map((p) => {
                  const comp = p.compensationCr || 1.8;
                  return (
                    <tr key={p.id} className="border-b border-hair/60 hover:bg-panel2/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-cyan">{p.id}</td>
                      <td className="px-4 py-3 text-txt-primary font-medium">{p.ownerRef}</td>
                      <td className="px-4 py-3 font-mono text-txt-secondary">{p.surveyNo || '142/A'}</td>
                      <td className="px-4 py-3 font-mono text-txt-primary">{p.areaAcres || 0.85} Ac</td>
                      <td className="px-4 py-3 font-mono text-txt-secondary">₹{(comp * 0.4).toFixed(2)} Cr</td>
                      <td className="px-4 py-3 font-mono font-bold text-risk-low">₹{comp} Cr</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-cyan-glow border border-cyanline px-2 py-0.5 font-mono text-[10px] text-cyan">
                          Ready for RTGS
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-hair bg-raised/40 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                  <th className="px-4 py-3">Project Code</th>
                  <th className="px-4 py-3">Corridor Name</th>
                  <th className="px-4 py-3">District</th>
                  <th className="px-4 py-3">Budget (Cr)</th>
                  <th className="px-4 py-3">Land Area</th>
                  <th className="px-4 py-3">Risk Band</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PROJECTS.map((p) => {
                  const riskBand = p.riskBand || 'high';
                  return (
                    <tr key={p.id} className="border-b border-hair/60 hover:bg-panel2/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-cyan">{p.id}</td>
                      <td className="px-4 py-3 font-medium text-txt-primary">{p.name}</td>
                      <td className="px-4 py-3 text-txt-secondary">{p.district}</td>
                      <td className="px-4 py-3 font-mono font-semibold text-txt-primary">₹{p.estimatedBudgetCr} Cr</td>
                      <td className="px-4 py-3 font-mono text-txt-secondary">{p.requiredLandAreaAcres} Acres</td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span className={clsx(riskBand === 'critical' ? 'text-risk-critical' : riskBand === 'high' ? 'text-risk-high' : 'text-risk-low')}>
                          {p.riskScore || 50}/100 ({riskBand.toUpperCase()})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-txt-secondary">{p.status}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
