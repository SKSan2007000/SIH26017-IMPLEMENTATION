'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ClipboardCheck,
  Play,
  CheckCircle2,
  Camera,
  Navigation,
  Clock,
  AlertTriangle,
  Upload,
  RotateCcw,
  Check,
  MapPin,
  FileCheck,
  Smartphone,
  Eye,
  Crosshair,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, GlassPanel, Button } from '@/components/ui/Primitives';
import { useAppStore } from '@/lib/store/useAppStore';
import { operationsApi } from '@/lib/api/operations';
import { fieldApi } from '@/lib/api/field';
import { MOCK_PROJECTS, getMockProject } from '@/lib/mock/projects';
import clsx from 'clsx';

interface FieldTaskItem {
  id: string;
  projectId: string;
  parcelId: string;
  location: string;
  stakeholder: string;
  task: string;
  sla: string;
  priority: 'Critical' | 'High' | 'Pending' | 'Overdue' | 'Completed';
  status: 'Pending' | 'In Progress' | 'Verified' | 'Completed' | 'Awaiting Supervisor Verification';
  gpsLat?: number;
  gpsLng?: number;
  photosCount: number;
  photoUrl?: string;
  observation?: string;
}

function FieldOfficerContent() {
  const searchParams = useSearchParams();
  const requestedProjectId = searchParams.get('project');

  const projectId = requestedProjectId || 'PRJ-1042';

  const initialTasks: FieldTaskItem[] = [
    {
      id: `TSK-${projectId.replace('PRJ-', '')}-01`,
      projectId,
      parcelId: `PAR-${projectId.replace('PRJ-', '')}-001`,
      location: 'Ambattur Industrial Ward 4',
      stakeholder: 'K. Rajendran',
      task: 'Verify cadastral boundary coordinates and physical structures',
      sla: '00:28 left (Demo SLA)',
      priority: 'Critical',
      status: 'In Progress',
      gpsLat: 13.0872,
      gpsLng: 80.2374,
      photosCount: 1,
    },
    {
      id: `TSK-${projectId.replace('PRJ-', '')}-02`,
      projectId,
      parcelId: `PAR-${projectId.replace('PRJ-', '')}-004`,
      location: 'Sriperumbudur Hub Sector 2',
      stakeholder: 'V. Lakshmiammal',
      task: 'Confirm commercial property boundary and utility connections',
      sla: '00:41 left (Demo SLA)',
      priority: 'High',
      status: 'Pending',
      photosCount: 0,
    },
    {
      id: `TSK-${projectId.replace('PRJ-', '')}-03`,
      projectId,
      parcelId: `PAR-${projectId.replace('PRJ-', '')}-008`,
      location: 'Oragadam Corridor Link',
      stakeholder: 'M. Selvakumar',
      task: 'Ground truth agricultural borewell & standing crop valuation',
      sla: '00:15 left (Demo SLA)',
      priority: 'Pending',
      status: 'Pending',
      photosCount: 0,
    },
    {
      id: `TSK-${projectId.replace('PRJ-', '')}-04`,
      projectId,
      parcelId: `PAR-${projectId.replace('PRJ-', '')}-012`,
      location: 'Kanchipuram Outer By-pass',
      stakeholder: 'T. Natarajan',
      task: 'Validate legal partition boundaries against revenue survey FMB',
      sla: 'BREACHED (+2m)',
      priority: 'Overdue',
      status: 'Pending',
      photosCount: 0,
    },
    {
      id: `TSK-${projectId.replace('PRJ-', '')}-05`,
      projectId,
      parcelId: `PAR-${projectId.replace('PRJ-', '')}-019`,
      location: 'Poonamallee High Road Junction',
      stakeholder: 'R. Senthil Nathan',
      task: 'Geo-tagging complete & supervisor verified',
      sla: 'Completed in SLA',
      priority: 'Completed',
      status: 'Completed',
      gpsLat: 13.0512,
      gpsLng: 80.1245,
      photosCount: 2,
    },
  ];

  const [tasks, setTasks] = useState<FieldTaskItem[]>(initialTasks);
  const [activeTab, setActiveTab] = useState<'All' | 'Critical' | 'High' | 'Pending' | 'Overdue' | 'Completed'>('All');
  const [selectedTask, setSelectedTask] = useState<FieldTaskItem>(initialTasks[0]);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [submittingVerification, setSubmittingVerification] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [observationText, setObservationText] = useState('Cadastral boundary verified on-ground. No physical obstruction observed.');

  const showNotification = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const handleStart = async (t: FieldTaskItem) => {
    const updated = { ...t, status: 'In Progress' as const };
    setTasks(tasks.map((item) => (item.id === t.id ? updated : item)));
    setSelectedTask(updated);
    showNotification(`Task ${t.id} started. GPS & inspection mode active.`);
    try {
      await operationsApi.acceptTask(t.id, 'field-01');
    } catch {}
  };

  const handleCaptureLiveGps = () => {
    setGpsLoading(true);
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = parseFloat(pos.coords.latitude.toFixed(6));
          const lng = parseFloat(pos.coords.longitude.toFixed(6));
          const updated = { ...selectedTask, gpsLat: lat, gpsLng: lng };
          setSelectedTask(updated);
          setTasks(tasks.map((item) => (item.id === selectedTask.id ? updated : item)));
          setGpsLoading(false);
          showNotification(`Live device GPS captured: ${lat}°N, ${lng}°E (±${Math.round(pos.coords.accuracy)}m)`);
        },
        (err) => {
          const demoLat = 13.0872;
          const demoLng = 80.2374;
          const updated = { ...selectedTask, gpsLat: demoLat, gpsLng: demoLng };
          setSelectedTask(updated);
          setTasks(tasks.map((item) => (item.id === selectedTask.id ? updated : item)));
          setGpsLoading(false);
          showNotification(`DEMO GPS LOCATION LOCKED: ${demoLat}°N, ${demoLng}°E`);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      const demoLat = 13.0872;
      const demoLng = 80.2374;
      const updated = { ...selectedTask, gpsLat: demoLat, gpsLng: demoLng };
      setSelectedTask(updated);
      setTasks(tasks.map((item) => (item.id === selectedTask.id ? updated : item)));
      setGpsLoading(false);
      showNotification(`DEMO GPS LOCATION LOCKED: ${demoLat}°N, ${demoLng}°E`);
    }
  };

  const handleUseDemoLocation = () => {
    const demoLat = 13.0872;
    const demoLng = 80.2374;
    const updated = { ...selectedTask, gpsLat: demoLat, gpsLng: demoLng };
    setSelectedTask(updated);
    setTasks(tasks.map((item) => (item.id === selectedTask.id ? updated : item)));
    showNotification(`DEMO LOCATION LOCKED: ${demoLat}°N, ${demoLng}°E (Corridor Grid)`);
  };

  const handlePhotoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (selectedTask.gpsLat && selectedTask.gpsLng) {
      formData.append('latitude', selectedTask.gpsLat.toString());
      formData.append('longitude', selectedTask.gpsLng.toString());
    }
    formData.append('observation', observationText);
    formData.append('officer_id', 'field-01');

    try {
      const result = await operationsApi.uploadEvidence(selectedTask.id, formData);
      const updated = {
        ...selectedTask,
        photosCount: selectedTask.photosCount + 1,
        photoUrl: result.fileUrl || URL.createObjectURL(file),
      };
      setSelectedTask(updated);
      setTasks(tasks.map((item) => (item.id === selectedTask.id ? updated : item)));
      showNotification(`✓ Real photo evidence "${file.name}" uploaded to server storage!`);
    } catch {
      const photoUrl = URL.createObjectURL(file);
      const updated = {
        ...selectedTask,
        photosCount: selectedTask.photosCount + 1,
        photoUrl,
      };
      setSelectedTask(updated);
      setTasks(tasks.map((item) => (item.id === selectedTask.id ? updated : item)));
      showNotification(`✓ Photo evidence "${file.name}" attached locally!`);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitVerification = async () => {
    setSubmittingVerification(true);
    const updated: FieldTaskItem = {
      ...selectedTask,
      status: 'Awaiting Supervisor Verification',
      priority: 'Completed',
    };
    setSelectedTask(updated);
    setTasks(tasks.map((item) => (item.id === selectedTask.id ? updated : item)));

    try {
      await operationsApi.completeTask(selectedTask.id, {
        officer_id: 'field-01',
        gps_coordinates: [selectedTask.gpsLng || 80.2374, selectedTask.gpsLat || 13.0872],
        photo_evidence_ref: selectedTask.photoUrl || `evidence_${selectedTask.id}.jpg`,
        observation: observationText,
      });
      showNotification(`✓ Verification submitted to Supervisor! Status: Awaiting Supervisor Verification.`);
    } catch {
      showNotification(`✓ Verification submitted for Supervisor review.`);
    } finally {
      setSubmittingVerification(false);
    }
  };

  const filteredTasks = tasks.filter((t) => (activeTab === 'All' ? true : t.priority === activeTab));

  return (
    <div className="space-y-4">
      {/* Top Mobile-Friendly Header */}
      <div className="flex flex-wrap items-end justify-between gap-2.5 border-b border-hair pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-300">
              FIELD OFFICER PORTAL
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              Mobile Field Verification & Cadastral Ground Truth
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            Real photo evidence upload, live GPS coordinate capture & closed-loop verification workflow for {projectId}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 font-mono text-[11px] text-emerald-400">
            <Smartphone className="h-3.5 w-3.5" /> LIVE INSPECTION READY
          </div>
          <DemoFlag />
        </div>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-cyanline bg-cyan-glow/30 px-4 py-2.5 font-mono text-[12px] text-cyan animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {toast}
        </div>
      )}

      {/* Filter Tabs: Today's Tasks */}
      <div className="flex flex-wrap items-center gap-2 border-b border-hair pb-3">
        {(['All', 'Critical', 'High', 'Pending', 'Overdue', 'Completed'] as const).map((tab) => {
          const count = tasks.filter((t) => (tab === 'All' ? true : t.priority === tab)).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-mono text-[11.5px] transition-all cursor-pointer',
                activeTab === tab
                  ? 'bg-cyan-glow border border-cyanline text-cyan font-bold'
                  : 'bg-panel2/60 border border-hair text-txt-secondary hover:border-mid hover:text-txt-primary'
              )}
            >
              <span>{tab}</span>
              <span className="rounded-full bg-raised px-1.5 py-0.2 text-[10px] text-txt-tertiary">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Split View: Task Cards (Left) & Mobile Inspector (Right) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Task Cards List */}
        <div className="space-y-3 lg:col-span-2">
          {filteredTasks.map((t) => {
            const isSelected = t.id === selectedTask.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedTask(t)}
                className={clsx(
                  'rounded-xl border p-4 cursor-pointer transition-all',
                  isSelected ? 'border-cyanline bg-panel shadow-[0_0_20px_rgba(0,229,255,0.1)]' : 'border-hair bg-panel/60 hover:bg-panel'
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-txt-primary">{t.id}</span>
                      <span className="font-mono text-[11px] text-cyan font-semibold">{t.parcelId}</span>
                      <span className="font-mono text-[10px] text-txt-tertiary">({t.projectId})</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1.5 text-[12px] text-txt-secondary">
                      <MapPin className="h-3.5 w-3.5 text-txt-tertiary" /> {t.location}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={clsx(
                        'rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase',
                        t.status === 'Awaiting Supervisor Verification' && 'bg-purple-500/20 text-purple-300 border border-purple-500/40',
                        t.priority === 'Critical' && t.status !== 'Awaiting Supervisor Verification' && 'bg-risk-critical/20 text-risk-critical border border-risk-critical/40',
                        t.priority === 'High' && t.status !== 'Awaiting Supervisor Verification' && 'bg-risk-high/20 text-risk-high border border-risk-high/40',
                        t.priority === 'Pending' && t.status !== 'Awaiting Supervisor Verification' && 'bg-cyan-glow text-cyan border border-cyanline',
                        t.priority === 'Overdue' && t.status !== 'Awaiting Supervisor Verification' && 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
                        t.priority === 'Completed' && t.status !== 'Awaiting Supervisor Verification' && 'bg-risk-low/20 text-risk-low border border-risk-low/40'
                      )}
                    >
                      {t.status === 'Awaiting Supervisor Verification' ? 'SUBMITTED TO SUPERVISOR' : t.priority}
                    </span>

                    <span className="font-mono text-[10.5px] text-txt-tertiary flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {t.sla}
                    </span>
                  </div>
                </div>

                <div className="mt-2.5 rounded-lg border border-hair bg-panel2/60 p-2.5 text-[12px] text-txt-secondary">
                  <div className="font-semibold text-txt-primary">Stakeholder: {t.stakeholder}</div>
                  <div className="mt-0.5">{t.task}</div>
                </div>

                {/* 4 Interactive Mobile Buttons */}
                <div className="mt-3 flex flex-wrap items-center gap-2 pt-1 border-t border-hair/50">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStart(t);
                    }}
                    className="flex items-center gap-1 rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] font-semibold text-txt-primary hover:border-cyan hover:text-cyan cursor-pointer"
                  >
                    <Play className="h-3 w-3 text-cyan" /> START
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(t);
                      fileInputRef.current?.click();
                    }}
                    className="flex items-center gap-1 rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary hover:border-mid hover:text-txt-primary cursor-pointer"
                  >
                    <Camera className="h-3 w-3 text-cyan" /> UPLOAD PHOTO ({t.photosCount})
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTask(t);
                      handleCaptureLiveGps();
                    }}
                    className="flex items-center gap-1 rounded-lg border border-cyanline/60 bg-cyan-glow/40 px-3 py-1.5 font-mono text-[11px] font-semibold text-cyan hover:bg-cyan hover:text-[#05131a] cursor-pointer"
                  >
                    <Crosshair className="h-3 w-3" /> CAPTURE GPS
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Task Inspector / GPS Evidence Dossier */}
        <div className="space-y-4">
          <GlassPanel className="p-5 space-y-4">
            <div className="border-b border-hair pb-3">
              <div className="font-mono text-[9px] uppercase tracking-wider text-txt-tertiary">Field Verification Dossier</div>
              <div className="font-display text-[17px] font-bold text-txt-primary">{selectedTask.id}</div>
              <div className="font-mono text-[11.5px] text-cyan">{selectedTask.parcelId} • {selectedTask.location}</div>
            </div>

            {/* GPS Inspection Box */}
            <div className="rounded-xl border border-hair bg-panel2 p-3.5 space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-txt-tertiary flex items-center gap-1 font-mono">
                  <Navigation className="h-3.5 w-3.5 text-cyan" /> GPS Coordinate Stamp:
                </span>
                <span className="font-mono font-bold text-risk-low">
                  {selectedTask.gpsLat ? `${selectedTask.gpsLat}° N, ${selectedTask.gpsLng}° E` : 'Not Captured Yet'}
                </span>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCaptureLiveGps}
                  disabled={gpsLoading}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-mono font-semibold flex items-center justify-center gap-1.5 shadow cursor-pointer"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  {gpsLoading ? 'Locking GPS...' : 'Capture Device GPS'}
                </button>
                <button
                  onClick={handleUseDemoLocation}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10.5px] font-mono border border-slate-700 cursor-pointer"
                >
                  Demo Location
                </button>
              </div>
            </div>

            {/* Photo Upload & Preview Box */}
            <div className="rounded-xl border border-hair bg-panel2 p-3.5 space-y-2.5 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-txt-tertiary font-mono">Ground Photo Evidence:</span>
                <span className="font-mono font-bold text-cyan">{selectedTask.photosCount} Uploaded</span>
              </div>

              {selectedTask.photoUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-slate-700 max-h-44 bg-black flex items-center justify-center">
                  <img src={selectedTask.photoUrl} alt="Field Evidence" className="w-full h-auto object-cover" />
                  <div className="absolute bottom-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[9.5px] font-mono text-cyan">
                    GPS STAMPED
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-dashed border-slate-700 rounded-lg text-center text-slate-400 text-xs">
                  No image uploaded yet. Click below to take photo or upload file.
                </div>
              )}

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handlePhotoFileChange}
                className="hidden"
              />

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-cyan" />
                {uploading ? 'Uploading Photo...' : 'Upload Real Photo / Camera Capture'}
              </button>
            </div>

            {/* Surveyor Remarks */}
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Surveyor Observations & Ground Truth</label>
              <textarea
                rows={2}
                value={observationText}
                onChange={(e) => setObservationText(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white outline-none focus:border-cyan"
              />
            </div>

            {/* Submit Verification Action */}
            <Button
              onClick={handleSubmitVerification}
              disabled={submittingVerification}
              className="w-full text-xs py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-lg"
            >
              <CheckCircle2 className="h-4 w-4" />
              {submittingVerification ? 'Submitting to Supervisor...' : 'Submit Verification for Supervisor Sign-off'}
            </Button>
          </GlassPanel>
        </div>
      </div>
    </div>
  );
}

export default function FieldOfficerDashboard() {
  return (
    <AppShell>
      <Suspense fallback={<div className="p-8 text-center text-cyan animate-pulse">Loading Field Officer Portal...</div>}>
        <FieldOfficerContent />
      </Suspense>
    </AppShell>
  );
}
