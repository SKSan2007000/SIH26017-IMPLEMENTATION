'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  FileText,
  AlertCircle,
  Upload,
  CheckCircle2,
  Clock,
  Send,
  HelpCircle,
  ShieldCheck,
  Building,
  MapPin,
  FileCheck,
  Lock,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, GlassPanel, PanelHead, Button } from '@/components/ui/Primitives';
import { useAuthStore } from '@/lib/store/useAuthStore';
import { useAppStore } from '@/lib/store/useAppStore';
import { api } from '@/lib/api';

export default function CitizenPortalPage() {
  const { user } = useAuthStore();
  const { selectedProjectId } = useAppStore();
  const [grievanceText, setGrievanceText] = useState('');
  const [grievanceType, setGrievanceType] = useState('Boundary Grievance');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedGrievances, setSubmittedGrievances] = useState([
    {
      id: 'GRV-2026-081',
      date: '2026-08-15',
      type: 'Boundary Measurement Clarification',
      status: 'Resolved — Joint Survey Completed',
      remarks: 'Surveyor verified boundary coordinates. Partition deed updated in Revenue Records.',
    },
  ]);
  const [toast, setToast] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    async function loadReports() {
      try {
        const reports = await api.getCitizenReports(selectedProjectId || 'PRJ-NHAI-001');
        if (reports && reports.length > 0) {
          setSubmittedGrievances(
            reports.map((r) => ({
              id: r.id,
              date: r.submittedAt || new Date().toISOString().split('T')[0],
              type: (r.category || 'Boundary Grievance') as string,
              status: r.status === 'Submitted' ? 'Under Review by Special LAO' : r.status,
              remarks: r.responseNote || r.description,
            }))
          );
        }
      } catch {
        // Use default if network fails
      }
    }
    loadReports();
  }, [selectedProjectId]);

  const handleGrievanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grievanceText) return;
    setIsSubmitting(true);
    const grvId = `GRV-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newGrv = {
      id: grvId,
      date: new Date().toISOString().split('T')[0],
      type: grievanceType,
      status: 'Under Review by Special LAO',
      remarks: 'Acknowledgement receipt generated. Hearing date scheduled within 14 working days.',
    };

    try {
      await api.createCitizenReport({
        id: grvId,
        projectId: selectedProjectId || 'PRJ-NHAI-001',
        location: user?.district ? `${user.district} / ${user.zone || 'Industrial Zone'}` : 'Ambattur Industrial Zone / Survey 142/2A',
        description: grievanceText,
        category: (grievanceType as any) || 'Boundary Grievance',
        status: 'Submitted',
        submittedAt: new Date().toISOString().split('T')[0],
      });
    } catch (err) {
      console.warn('Backend grievance sync fallback', err);
    }

    setSubmittedGrievances((prev) => [newGrv, ...prev]);
    setGrievanceText('');
    setIsSubmitting(false);
    showNotification(`Grievance ${newGrv.id} registered. Tracking ID sent.`);
  };

  const handleDocumentUpload = () => {
    showNotification('Document (Title Deed / Patta Copy) uploaded securely.');
  };

  return (
    <AppShell>
      {/* Citizen Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-teal-500/20 border border-teal-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-teal-300">
              CITIZEN PORTAL
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              Land Owner Portal & Transparent Acquisition Services
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Personal land acquisition status, compensation award calculation, statutory notices & grievance redressal
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 font-mono text-[11px] text-teal-300">
            <Lock className="h-3 w-3" /> PRIVATE & CONFIDENTIAL
          </div>
          <DemoFlag />
        </div>
      </div>

      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      {/* Main Grid: My Land Parcel Status & Grievance Panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: My Land Parcel Dossier & Notice History */}
        <div className="space-y-4 lg:col-span-2">
          {/* Parcel Dossier Card */}
          <div className="overflow-hidden rounded-xl border border-hair bg-panel p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-hair pb-4">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">Registered Land Parcel</div>
                <div className="font-display text-xl font-bold text-txt-primary">Parcel ID: PAR-1042-003</div>
                <div className="mt-1 flex items-center gap-2 font-mono text-[12px] text-cyan">
                  <MapPin className="h-3.5 w-3.5" /> Survey No: 142/2A • Ambattur Industrial Zone
                </div>
              </div>

              <div className="text-right">
                <span className="rounded-full bg-risk-low/15 border border-risk-low/30 px-3 py-1 font-mono text-[11px] font-bold text-risk-low">
                  VERIFIED & APPROVED
                </span>
                <div className="mt-1 font-mono text-[10.5px] text-txt-tertiary">LARR Act 2013 Award Stage</div>
              </div>
            </div>

            {/* Acquisition Project Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-hair bg-panel2 p-3 text-[12px]">
              <div>
                <div className="text-txt-tertiary">Infrastructure Project:</div>
                <div className="font-semibold text-txt-primary mt-0.5">Chennai-Bengaluru Industrial Corridor</div>
              </div>
              <div>
                <div className="text-txt-tertiary">Required Area for ROW:</div>
                <div className="font-mono font-semibold text-txt-primary mt-0.5">0.85 Acres (37,026 sq.ft)</div>
              </div>
              <div>
                <div className="text-txt-tertiary">Competent Authority:</div>
                <div className="font-semibold text-txt-primary mt-0.5">Special LAO — Corridor Division</div>
              </div>
            </div>

            {/* Compensation Breakdown Card */}
            <div className="rounded-xl border border-cyanline/30 bg-cyan-glow/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-[14px] font-bold text-white">
                  Statutory Compensation Breakdown
                </h3>
                <span className="font-mono text-[11px] text-cyan font-bold">RFCTLARR Act 2013 (First Schedule)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px]">
                <div className="rounded-lg border border-hair bg-panel2 p-2.5">
                  <div className="text-txt-tertiary text-[11px]">Guideline Base Rate:</div>
                  <div className="font-mono font-bold text-txt-primary mt-0.5">₹1.40 Cr</div>
                </div>
                <div className="rounded-lg border border-hair bg-panel2 p-2.5">
                  <div className="text-txt-tertiary text-[11px]">Rural Multiplier (1.5x):</div>
                  <div className="font-mono font-bold text-txt-primary mt-0.5">₹2.10 Cr</div>
                </div>
                <div className="rounded-lg border border-hair bg-panel2 p-2.5">
                  <div className="text-txt-tertiary text-[11px]">Solatium (100%):</div>
                  <div className="font-mono font-bold text-txt-primary mt-0.5">₹2.10 Cr</div>
                </div>
                <div className="rounded-lg border border-cyanline bg-cyan-glow p-2.5">
                  <div className="text-cyan text-[11px] font-semibold">Total Approved Award:</div>
                  <div className="font-mono font-bold text-white text-[14px] mt-0.5">₹4.20 Cr</div>
                </div>
              </div>
            </div>

            {/* Upload Land Title / Bank Documents */}
            <div className="rounded-xl border border-hair bg-panel2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <div>
                  <h4 className="font-semibold text-txt-primary text-[13px]">Upload Supporting Documentation</h4>
                  <div className="text-[11.5px] text-txt-tertiary">
                    Patta copy, Revenue FMB sketch, Aadhaar, Bank Mandate for direct award RTGS
                  </div>
                </div>
                <Button onClick={handleDocumentUpload} variant="primary" className="text-[11px] py-1.5">
                  <Upload className="h-3.5 w-3.5" /> Upload Document
                </Button>
              </div>
            </div>
          </div>

          {/* Grievance Tracking List */}
          <div className="overflow-hidden rounded-xl border border-hair bg-panel">
            <div className="border-b border-hair p-3.5 bg-panel2/60">
              <h3 className="font-display text-[14px] font-bold text-txt-primary">
                My Grievance & Objection Tracking History
              </h3>
            </div>

            <div className="divide-y divide-hair">
              {submittedGrievances.map((g) => (
                <div key={g.id} className="p-3.5 space-y-1.5 hover:bg-panel2/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-cyan text-[12px]">{g.id}</span>
                    <span className="rounded-full bg-cyan-glow border border-cyanline px-2.5 py-0.5 font-mono text-[10.5px] text-cyan font-bold">
                      {g.status}
                    </span>
                  </div>
                  <div className="font-semibold text-txt-primary text-[12.5px]">{g.type}</div>
                  <div className="text-[11.5px] text-txt-secondary leading-relaxed">{g.remarks}</div>
                  <div className="font-mono text-[10px] text-txt-tertiary">Registered on {g.date}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Submit Grievance / Objection Form */}
        <div className="space-y-4">
          <GlassPanel className="p-4 space-y-3.5">
            <PanelHead title="Submit Grievance or Objection" sub="Statutory hearing rights" />

            <form onSubmit={handleGrievanceSubmit} className="space-y-3 text-[12px]">
              <div>
                <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">Grievance / Objection Category</label>
                <select
                  value={grievanceType}
                  onChange={(e) => setGrievanceType(e.target.value)}
                  className="w-full rounded-lg border border-hair bg-panel2 px-3 py-2 text-txt-primary outline-none focus:border-cyan"
                >
                  <option value="Compensation Valuation Objection">Compensation Valuation Objection</option>
                  <option value="Boundary / Measurement Dispute">Boundary / Measurement Dispute</option>
                  <option value="Title Partition & Ownership Claim">Title Partition & Ownership Claim</option>
                  <option value="Rehabilitation & Resettlement (R&R)">Rehabilitation & Resettlement (R&R)</option>
                  <option value="Structural / Tree Valuation">Structural / Tree Valuation</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-[10.5px] uppercase text-txt-tertiary mb-1">Statement & Justification</label>
                <textarea
                  required
                  value={grievanceText}
                  onChange={(e) => setGrievanceText(e.target.value)}
                  rows={4}
                  placeholder="State the detailed basis of your objection or request for joint revenue re-inspection…"
                  className="w-full rounded-lg border border-hair bg-panel2 p-2.5 text-txt-primary outline-none focus:border-cyan"
                />
              </div>

              <Button type="submit" variant="primary" className="w-full py-2.5 text-[12px]">
                <Send className="h-3.5 w-3.5" /> Submit Grievance to Collectorate
              </Button>
            </form>
          </GlassPanel>

          {/* Citizen Helpline & Assistance */}
          <GlassPanel className="p-4 space-y-2 text-[12px]">
            <div className="font-display font-bold text-txt-primary">District LAO Helpline</div>
            <div className="text-txt-secondary leading-relaxed">
              Toll-Free Citizen Land Assistance: <span className="font-mono text-cyan font-bold">1800-425-LAND</span>
            </div>
            <div className="font-mono text-[10.5px] text-txt-tertiary">
              Collectorate Working Hours: 10:00 AM – 5:30 PM (Mon-Fri)
            </div>
          </GlassPanel>
        </div>
      </div>
    </AppShell>
  );
}
