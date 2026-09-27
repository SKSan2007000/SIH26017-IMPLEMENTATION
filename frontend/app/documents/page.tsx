'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Files,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  FileCheck,
  FileX,
  RefreshCw,
  ScanText,
  Map,
  Box,
  Filter,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, Button, GlassPanel } from '@/components/ui/Primitives';
import { getMockProject } from '@/lib/mock/projects';
import { useAppStore } from '@/lib/store/useAppStore';
import type { DocumentRecord } from '@/types';
import clsx from 'clsx';

export default function DocumentsPage() {
  const projectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const project = getMockProject(projectId);
  const documents = useAppStore((s) => s.documents);
  const updateDocumentStatus = useAppStore((s) => s.updateDocumentStatus);
  const setSelectedParcel = useAppStore((s) => s.setSelectedParcel);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [ocrRunning, setOcrRunning] = useState(false);

  const filtered = documents.filter((d) => {
    const matchesSearch =
      d.id.toLowerCase().includes(query.toLowerCase()) ||
      d.parcelId.toLowerCase().includes(query.toLowerCase()) ||
      d.type.toLowerCase().includes(query.toLowerCase());

    const matchesType = typeFilter === 'all' || d.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || d.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const verifiedCount = documents.filter((d) => d.status === 'Verified').length;
  const processingCount = documents.filter((d) => d.status === 'Processing' || d.status === 'Uploaded').length;
  const missingCount = documents.filter((d) => d.status === 'Missing' || d.status === 'Rejected').length;

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  function handleUpdateStatus(docId: string, status: DocumentRecord['status']) {
    updateDocumentStatus(docId, status);
    if (selectedDoc && selectedDoc.id === docId) {
      setSelectedDoc({ ...selectedDoc, status });
    }
    showToast(`Document ${docId} updated to "${status}"`);
  }

  function handleRunOcr(doc: DocumentRecord) {
    setOcrRunning(true);
    setTimeout(() => {
      setOcrRunning(false);
      handleUpdateStatus(doc.id, 'Verified');
      showToast(`AI OCR extracted fields with 96% confidence for ${doc.id}`);
    }, 500);
  }

  return (
    <AppShell>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="font-display text-[20px] font-bold tracking-wide">Document Verification & OCR Intelligence</div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            {project?.name} — Automated document extraction, title clearance, and Section 11/19 document verification
          </div>
        </div>
        <DemoFlag />
      </div>

      {toastMessage && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4" /> {toastMessage}
        </div>
      )}

      {/* KPI Stats */}
      <div className="mb-4 grid grid-cols-4 gap-3">
        <StatCard label="Total Documents" value={documents.length} sub="Cadastral repository" icon={<Files className="h-4 w-4 text-cyan" />} />
        <StatCard label="Verified Documents" value={verifiedCount} sub={`${Math.round((verifiedCount / (documents.length || 1)) * 100)}% verified`} icon={<FileCheck className="h-4 w-4 text-risk-low" />} />
        <StatCard label="In Processing" value={processingCount} sub="OCR & Human review" icon={<Clock className="h-4 w-4 text-risk-medium" />} />
        <StatCard label="Missing / Rejected" value={missingCount} sub="Acquisition blocker" icon={<FileX className="h-4 w-4 text-risk-critical" />} />
      </div>

      {/* Search & Filters */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hair bg-panel p-3">
        <div className="flex max-w-sm flex-1 items-center gap-2 rounded-lg border border-hair bg-panel2 px-3 py-1.5 text-txt-tertiary">
          <Search className="h-3.5 w-3.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search document ID, parcel ID, type…"
            className="w-full bg-transparent text-[12.5px] text-txt-primary outline-none placeholder:text-txt-tertiary"
          />
        </div>

        <div className="flex items-center gap-3 text-[12px]">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-txt-tertiary" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary outline-none"
            >
              <option value="all">All Document Types</option>
              <option value="Ownership">Ownership Title (Patta/Chitta)</option>
              <option value="Survey">Survey Sketch (FMB)</option>
              <option value="Compensation">Compensation Award</option>
              <option value="Legal">Legal Clearance</option>
              <option value="Approval">Government Approval</option>
            </select>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Uploaded">Uploaded</option>
            <option value="Processing">Processing</option>
            <option value="Verified">Verified</option>
            <option value="Rejected">Rejected</option>
            <option value="Missing">Missing</option>
          </select>
        </div>
      </div>

      {/* Main Document Table & OCR Inspector Split */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 overflow-hidden rounded-xl border border-hair bg-panel">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-hair bg-panel2 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                  <th className="px-3.5 py-3">Document ID</th>
                  <th className="px-3.5 py-3">Parcel ID</th>
                  <th className="px-3.5 py-3">Document Type</th>
                  <th className="px-3.5 py-3">OCR Confidence</th>
                  <th className="px-3.5 py-3">Status</th>
                  <th className="px-3.5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => {
                  const isSelected = selectedDoc?.id === d.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDoc(d)}
                      className={clsx(
                        'border-b border-hair/60 transition-colors cursor-pointer hover:bg-panel2/60',
                        isSelected && 'bg-cyan-glow/20'
                      )}
                    >
                      <td className="px-3.5 py-3">
                        <div className="font-mono font-bold text-txt-primary">{d.id}</div>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="font-mono text-cyan">{d.parcelId}</span>
                      </td>

                      <td className="px-3.5 py-3">
                        <span className="font-medium text-txt-primary">{d.type}</span>
                      </td>

                      <td className="px-3.5 py-3">
                        {d.ocr ? (
                          <div className="flex items-center gap-1 font-mono text-[11px] text-cyan">
                            <Sparkles className="h-3 w-3" /> {d.ocr.confidencePct}%
                          </div>
                        ) : (
                          <span className="font-mono text-[11px] text-txt-tertiary">—</span>
                        )}
                      </td>

                      <td className="px-3.5 py-3">
                        <span
                          className={clsx(
                            'rounded-full px-2 py-0.5 font-mono text-[10px]',
                            d.status === 'Verified'
                              ? 'bg-risk-low/15 text-risk-low border border-risk-low/30'
                              : d.status === 'Rejected' || d.status === 'Missing'
                              ? 'bg-risk-critical/15 text-risk-critical border border-risk-critical/30'
                              : d.status === 'Processing'
                              ? 'bg-cyan-glow text-cyan border border-cyanline'
                              : 'bg-risk-medium/15 text-risk-medium border border-risk-medium/30'
                          )}
                        >
                          {d.status}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        {d.status !== 'Verified' ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRunOcr(d);
                            }}
                            className="rounded bg-cyan-glow border border-cyanline px-2.5 py-1 font-mono text-[10.5px] text-cyan hover:bg-cyan hover:text-[#05131a]"
                          >
                            Extract OCR
                          </button>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDoc(d);
                            }}
                            className="rounded border border-hair bg-panel2 px-2.5 py-1 font-mono text-[10.5px] text-txt-secondary hover:border-mid"
                          >
                            Inspect
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Document OCR Inspector */}
        <div>
          {selectedDoc ? (
            <GlassPanel className="p-4 space-y-4">
              <div className="border-b border-hair pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-wide text-txt-tertiary">Document Dossier</span>
                  <span className="rounded bg-panel2 border border-hair px-1.5 py-0.5 font-mono text-[9.5px] text-txt-secondary">
                    {selectedDoc.type}
                  </span>
                </div>
                <div className="mt-1 font-display text-[16px] font-bold text-txt-primary">{selectedDoc.id}</div>
                <div className="font-mono text-[12px] text-cyan">{selectedDoc.parcelId}</div>
              </div>

              {selectedDoc.ocr ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-cyanline bg-cyan-glow/20 px-3 py-2 text-[12px]">
                    <span className="text-cyan font-mono text-[11px] flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> AI OCR Extraction Confidence
                    </span>
                    <span className="font-mono font-bold text-cyan">{selectedDoc.ocr.confidencePct}%</span>
                  </div>

                  <div className="rounded-lg border border-hair bg-panel2 p-3 space-y-2 text-[12px]">
                    <div className="font-mono text-[10px] uppercase tracking-wide text-txt-tertiary mb-1">Extracted Metadata Fields</div>
                    {Object.entries(selectedDoc.ocr.extractedFields).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-hair/50 py-1 last:border-0">
                        <span className="text-txt-tertiary">{k}:</span>
                        <span className="font-medium text-txt-primary font-mono text-[11.5px]">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-hair p-4 text-center text-txt-tertiary">
                  <ScanText className="mx-auto mb-2 h-6 w-6 text-txt-tertiary" />
                  <p className="text-[12px]">No OCR metadata extracted yet for this record.</p>
                  <Button
                    variant="primary"
                    className="mt-3 text-[11.5px]"
                    onClick={() => handleRunOcr(selectedDoc)}
                    disabled={ocrRunning}
                  >
                    <Sparkles className="h-3.5 w-3.5" /> {ocrRunning ? 'Extracting…' : 'Run OCR Extraction'}
                  </Button>
                </div>
              )}

              {/* Status Actions */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="primary"
                    className="text-[11px] py-2"
                    onClick={() => handleUpdateStatus(selectedDoc.id, 'Verified')}
                  >
                    <CheckCircle2 className="h-3 w-3" /> Approve Document
                  </Button>
                  <Button
                    className="text-[11px] py-2 text-risk-critical hover:border-risk-critical"
                    onClick={() => handleUpdateStatus(selectedDoc.id, 'Rejected')}
                  >
                    <FileX className="h-3 w-3" /> Reject
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Link href="/gis" onClick={() => setSelectedParcel(selectedDoc.parcelId)} className="flex-1">
                    <Button className="w-full text-[11px] py-1.5">
                      <Map className="h-3 w-3" /> 2D GIS
                    </Button>
                  </Link>
                  <Link href="/twin" onClick={() => setSelectedParcel(selectedDoc.parcelId)} className="flex-1">
                    <Button className="w-full text-[11px] py-1.5">
                      <Box className="h-3 w-3" /> 3D Twin
                    </Button>
                  </Link>
                </div>
              </div>
            </GlassPanel>
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed border-hair p-6 text-center text-txt-tertiary">
              <Files className="mb-2 h-8 w-8 text-txt-tertiary" />
              <p className="text-[12.5px]">Select a document from the registry to inspect extracted title deeds, survey sketches, and verification stamps.</p>
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

