'use client';

import { useState } from 'react';
import {
  Megaphone,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Camera,
  Video,
  Plus,
  Send,
  Filter,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button, GlassPanel } from '@/components/ui/Primitives';
import { getMockProject } from '@/lib/mock/projects';
import { useAppStore } from '@/lib/store/useAppStore';
import type { CitizenReport } from '@/types';
import clsx from 'clsx';

export default function CitizenPage() {
  const projectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const project = getMockProject(projectId);
  const reports = useAppStore((s) => s.citizenReports);
  const updateCitizenReportStatus = useAppStore((s) => s.updateCitizenReportStatus);

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New report form state
  const [newLocation, setNewLocation] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<CitizenReport['category']>('Boundary Grievance');

  const filtered = reports.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(query.toLowerCase()) ||
      r.location.toLowerCase().includes(query.toLowerCase()) ||
      r.description.toLowerCase().includes(query.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleStatusChange(reportId: string, status: CitizenReport['status']) {
    updateCitizenReportStatus(reportId, status);
    if (selectedReport && selectedReport.id === reportId) {
      setSelectedReport({ ...selectedReport, status });
    }
    showToast(`Citizen Report ${reportId} updated to "${status}"`);
  }

  function handleCreateReport(e: React.FormEvent) {
    e.preventDefault();
    const newId = `CR-${200 + Math.floor(Math.random() * 800)}`;
    const newRecord: CitizenReport = {
      id: newId,
      projectId,
      location: newLocation,
      description: newDesc,
      category: newCategory,
      hasPhoto: true,
      hasVideo: false,
      status: 'Submitted',
      submittedAt: new Date().toISOString().split('T')[0],
    };
    useAppStore.setState((s) => ({
      citizenReports: [newRecord, ...s.citizenReports],
    }));
    setShowSubmitModal(false);
    setNewLocation('');
    setNewDesc('');
    showToast(`Citizen Report ${newId} logged successfully into public feedback queue`);
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="font-display text-[20px] font-bold tracking-wide">Citizen Reports & Public Feedback Portal</div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            {project?.name} — Community grievance intake, structural feedback, and public consultation management
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setShowSubmitModal(true)} className="text-[12px]">
            <Plus className="h-3.5 w-3.5" /> Submit Public Report
          </Button>
          <DemoFlag />
        </div>
      </div>

      {toastMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> {toastMessage}
        </div>
      )}

      {/* Submit Report Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <GlassPanel className="w-full max-w-lg p-5">
            <div className="flex items-center justify-between border-b border-hair pb-3">
              <h3 className="font-display text-[15px] font-bold text-txt-primary">Submit Citizen Feedback / Grievance</h3>
              <button onClick={() => setShowSubmitModal(false)} className="text-txt-tertiary hover:text-txt-primary">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="mt-4 space-y-3">
              <div>
                <label className="block font-mono text-[10px] uppercase text-txt-tertiary mb-1">Grievance Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as CitizenReport['category'])}
                  className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-[12.5px] text-txt-primary outline-none"
                >
                  <option value="Boundary Grievance">Boundary / Survey Grievance</option>
                  <option value="Access Road Request">Access Road / Service Lane Request</option>
                  <option value="Environmental Concern">Waterbody / Tree Canopy Protection</option>
                  <option value="Structural Assessment">Structural Assessment of Residential House</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-txt-tertiary mb-1">Location along corridor</label>
                <input
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  placeholder="e.g. Near Ennore Link Road Junction (DEMO)"
                  className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-[12.5px] text-txt-primary outline-none focus:border-cyan"
                />
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase text-txt-tertiary mb-1">Detailed Description</label>
                <textarea
                  required
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the alignment concern or field observation…"
                  className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-[12.5px] text-txt-primary outline-none focus:border-cyan"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" onClick={() => setShowSubmitModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  <Send className="h-3.5 w-3.5" /> Submit to Queue
                </Button>
              </div>
            </form>
          </GlassPanel>
        </div>
      )}

      {/* KPI Stats */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <StatCard label="Total Feedback" value={reports.length} sub="Community submissions" icon={<Megaphone className="h-4 w-4 text-cyan" />} />
        <StatCard label="Verified / Considered" value={reports.filter((r) => r.status === 'Verified' || r.status === 'Considered').length} sub="Under review" icon={<CheckCircle2 className="h-4 w-4 text-risk-low" />} />
        <StatCard label="Pending Action" value={reports.filter((r) => r.status === 'Submitted' || r.status === 'Under Review').length} sub="Intake queue" icon={<Clock className="h-4 w-4 text-risk-medium" />} />
        <StatCard label="Rejected" value={reports.filter((r) => r.status === 'Rejected').length} sub="Out of alignment" icon={<AlertTriangle className="h-4 w-4 text-risk-critical" />} />
      </div>

      {/* Search & Filter */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair bg-panel p-3">
        <div className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-hair bg-panel2 px-3 py-1.5 text-txt-tertiary">
          <Search className="h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search report ID, location, grievance description…"
            className="w-full bg-transparent text-[12.5px] text-txt-primary outline-none placeholder:text-txt-tertiary"
          />
        </div>

        <div className="flex items-center gap-2 text-[12px]">
          <Filter className="h-3.5 w-3.5 text-txt-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Submitted">Submitted</option>
            <option value="Under Review">Under Review</option>
            <option value="Verified">Verified</option>
            <option value="Considered">Considered</option>
            <option value="Planned">Planned</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main List & Details Split */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-2.5">
          {filtered.map((r) => {
            const isSelected = selectedReport?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedReport(r)}
                className={clsx(
                  'rounded-xl border p-4 transition-colors cursor-pointer',
                  isSelected ? 'border-cyanline bg-cyan-glow/20' : 'border-hair bg-panel hover:border-mid'
                )}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-txt-primary">{r.id}</span>
                      <span className="rounded bg-panel2 border border-hair px-1.5 py-0.5 font-mono text-[9.5px] text-txt-tertiary">
                        {r.category ?? 'Community Feedback'}
                      </span>
                    </div>
                    <div className="text-[12.5px] text-txt-secondary mt-1">{r.location}</div>
                  </div>

                  <span
                    className={clsx(
                      'rounded-full px-2.5 py-0.5 font-mono text-[10px]',
                      r.status === 'Verified' || r.status === 'Planned'
                        ? 'bg-risk-low/15 text-risk-low border border-risk-low/30'
                        : r.status === 'Considered'
                        ? 'bg-cyan-glow text-cyan border border-cyanline'
                        : r.status === 'Rejected'
                        ? 'bg-risk-critical/15 text-risk-critical border border-risk-critical/30'
                        : 'bg-risk-medium/15 text-risk-medium border border-risk-medium/30'
                    )}
                  >
                    {r.status}
                  </span>
                </div>

                <p className="mt-2 text-[12px] text-txt-primary/90 leading-relaxed line-clamp-2">{r.description}</p>

                <div className="mt-3 flex items-center justify-between text-[11px] text-txt-tertiary pt-2 border-t border-hair/50">
                  <div className="flex items-center gap-3">
                    {r.hasPhoto && (
                      <span className="flex items-center gap-1 text-cyan font-mono">
                        <Camera className="h-3 w-3" /> Photo attached
                      </span>
                    )}
                    {r.hasVideo && (
                      <span className="flex items-center gap-1 text-cyan font-mono">
                        <Video className="h-3 w-3" /> Video attached
                      </span>
                    )}
                  </div>
                  <span className="font-mono">Submitted: {r.submittedAt}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Report Inspector Drawer */}
        <div>
          {selectedReport ? (
            <GlassPanel className="p-4 space-y-4">
              <div className="border-b border-hair pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wide text-txt-tertiary">Report Dossier</span>
                  <span className="rounded bg-panel2 border border-hair px-1.5 py-0.5 font-mono text-[9.5px] text-txt-secondary">
                    {selectedReport.status}
                  </span>
                </div>
                <div className="mt-1 font-display text-[16px] font-bold text-txt-primary">{selectedReport.id}</div>
                <div className="text-[12px] text-txt-secondary">{selectedReport.location}</div>
              </div>

              <div className="rounded-lg border border-hair bg-panel2 p-3 space-y-1.5 text-[12px]">
                <div className="font-mono text-[9.5px] uppercase tracking-wide text-txt-tertiary">Grievance Narrative</div>
                <p className="text-txt-primary leading-relaxed">{selectedReport.description}</p>
              </div>

              {/* Workflow Status Progression Buttons */}
              <div className="space-y-2 pt-1">
                <div className="font-mono text-[10px] uppercase tracking-wide text-txt-tertiary">Action Recommendation</div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    className="text-[11px] py-2"
                    onClick={() => handleStatusChange(selectedReport.id, 'Considered')}
                  >
                    <CheckCircle2 className="h-3 w-3" /> Mark Considered
                  </Button>
                  <Button
                    className="text-[11px] py-2"
                    onClick={() => handleStatusChange(selectedReport.id, 'Verified')}
                  >
                    Verify Field Claim
                  </Button>
                </div>
                <Button
                  className="w-full text-[11px] py-1.5 text-risk-critical hover:border-risk-critical"
                  onClick={() => handleStatusChange(selectedReport.id, 'Rejected')}
                >
                  Reject Grievance
                </Button>
              </div>
            </GlassPanel>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-hair p-6 text-center text-txt-tertiary">
              <Megaphone className="mb-2 h-8 w-8 text-txt-tertiary" />
              <p className="text-[12.5px]">Select a community report to review attached field photos and record officer determination.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: number | string; sub: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-hair bg-panel p-3.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">{label}</span>
        {icon}
      </div>
      <div className="mt-1.5 font-display text-[24px] font-bold text-txt-primary">{value}</div>
      <div className="mt-0.5 text-[11px] text-txt-tertiary">{sub}</div>
    </div>
  );
}

