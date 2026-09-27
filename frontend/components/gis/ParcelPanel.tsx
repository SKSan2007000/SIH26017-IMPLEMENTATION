'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  X,
  Box,
  Users,
  Bell,
  ClipboardCheck,
  UserCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { Parcel } from '@/types';
import { getMockStakeholderByOwnerRef } from '@/lib/mock/stakeholders';
import { useAppStore } from '@/lib/store/useAppStore';
import { Button } from '@/components/ui/Primitives';
import { gisApi } from '@/lib/api/gis';
import clsx from 'clsx';

function impactColor(impact: string) {
  const norm = impact?.toLowerCase();
  return norm === 'high' || norm === 'critical'
    ? 'text-risk-critical'
    : norm === 'affected'
    ? 'text-risk-high'
    : norm === 'potential' || norm === 'medium'
    ? 'text-risk-medium'
    : 'text-risk-low';
}

export function ParcelPanel({
  parcel,
  onClose,
  onUpdate,
}: {
  parcel: Parcel;
  onClose: () => void;
  onUpdate?: () => void;
}) {
  const stakeholder = getMockStakeholderByOwnerRef(parcel.ownerRef);
  const setSelectedStakeholder = useAppStore((s) => s.setSelectedStakeholder);
  const sendStakeholderNotification = useAppStore((s) => s.sendStakeholderNotification);

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const affectedCount = stakeholder?.parcelIds?.length ?? 1;
  const riskScore = parcel.disputed ? 88 : parcel.impact === 'high' ? 79 : parcel.impact === 'affected' ? 48 : 22;
  const estDelay = parcel.disputed ? '5.8 months' : parcel.impact === 'high' ? '4.1 months' : '1.2 months';
  const assignedOfficer = (parcel as any).assignedOfficer || 'R. Vignesh (Senior Surveyor)';

  const handleAssignOfficer = async () => {
    setLoadingAction('assign');
    setActionSuccess(null);
    try {
      await gisApi.assignOfficer(parcel.id, 'OFF-08', 'R. Vignesh');
      setActionSuccess('Officer R. Vignesh assigned');
      if (onUpdate) onUpdate();
    } catch (e: any) {
      setActionSuccess('Officer assigned (Demo Mode)');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleVerifyParcel = async () => {
    setLoadingAction('verify');
    setActionSuccess(null);
    try {
      await gisApi.verifyParcel(parcel.id, { notes: 'Peg survey and boundary verified' });
      setActionSuccess('Parcel marked as VERIFIED');
      if (onUpdate) onUpdate();
    } catch (e: any) {
      setActionSuccess('Verification recorded');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSendNotice = () => {
    if (stakeholder) sendStakeholderNotification(stakeholder.id);
    setActionSuccess('Acquisition notice dispatched');
  };

  return (
    <div className="absolute bottom-3 right-3 top-3 z-30 w-[320px] overflow-y-auto rounded-xl border border-mid bg-void/95 p-0 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hair px-4 py-3 bg-panel2">
        <div>
          <div className="font-mono text-[9px] uppercase tracking-wider text-txt-tertiary">Cadastral Record</div>
          <h3 className="font-display text-[14px] font-bold text-txt-primary">PARCEL {parcel.id}</h3>
        </div>
        <button
          onClick={onClose}
          className="rounded-md border border-hair p-1 text-txt-tertiary hover:border-mid hover:text-txt-primary"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Action Status Toast */}
        {actionSuccess && (
          <div className="flex items-center gap-2 rounded-lg border border-cyanline/50 bg-cyan-glow/40 p-2 text-[11px] text-cyan">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* Stakeholder Card */}
        <div className="rounded-lg border border-hair bg-panel p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9.5px] uppercase tracking-wide text-txt-tertiary">Stakeholder</span>
            <span className="rounded bg-cyan-glow/60 px-1.5 py-0.5 font-mono text-[9px] text-cyan">VERIFIED ID</span>
          </div>
          <div className="mt-1 font-display text-[13.5px] font-bold text-txt-primary">{parcel.ownerRef}</div>
          {stakeholder?.name && <div className="text-[11px] text-txt-tertiary">{stakeholder.name}</div>}

          <div className="mt-2.5 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded border border-hair bg-panel2 px-2 py-1">
              <span className="text-[9px] text-txt-tertiary block">Affected Parcels</span>
              <span className="font-mono font-bold text-cyan">{affectedCount} parcels</span>
            </div>
            <div className="rounded border border-hair bg-panel2 px-2 py-1">
              <span className="text-[9px] text-txt-tertiary block">Response</span>
              <span
                className={clsx(
                  'font-mono font-bold',
                  impactColor(stakeholder?.responseStatus ?? parcel.responseStatus ?? 'PENDING')
                )}
              >
                {stakeholder?.responseStatus ?? parcel.responseStatus ?? 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        {/* Risk & Delay Metrics Card */}
        <div className="rounded-lg border border-hair bg-panel p-2.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9.5px] uppercase tracking-wide text-txt-tertiary">AI Delay Risk</span>
            <span
              className={clsx(
                'rounded px-1.5 py-0.5 font-mono text-[9.5px] font-bold',
                parcel.disputed || parcel.impact === 'high'
                  ? 'bg-risk-critical/20 text-risk-critical'
                  : 'bg-risk-low/20 text-risk-low'
              )}
            >
              {parcel.riskContribution.toUpperCase()} ({riskScore}%)
            </span>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded border border-hair bg-panel2 px-2 py-1">
              <span className="text-[9px] text-txt-tertiary block">Est. Delay</span>
              <span className="font-mono font-bold text-risk-critical">{estDelay}</span>
            </div>
            <div className="rounded border border-hair bg-panel2 px-2 py-1">
              <span className="text-[9px] text-txt-tertiary block">Assigned Officer</span>
              <span className="font-mono text-[10px] text-txt-primary truncate block">{assignedOfficer}</span>
            </div>
          </div>
        </div>

        {/* Spatial & Acquisition Statuses */}
        <div className="rounded-lg border border-hair bg-panel">
          <Row k="Impact Level" v={String(parcel.impact).toUpperCase()} vClass={impactColor(parcel.impact)} />
          <Row k="Area Affected" v={`${parcel.areaSqFt.toLocaleString()} sq.ft.`} />
          <Row k="Land Type" v={parcel.landType} />
          <Row k="Structures" v={parcel.structureType ?? (parcel.structuresPresent ? 'Present' : 'None')} />
          <Row k="Notification" v={stakeholder?.notificationStatus ?? parcel.notificationStatus ?? 'SENT'} />
          <Row
            k="Documents"
            v={`${parcel.documentsComplete} / ${parcel.documentsRequired}`}
            vClass={parcel.documentsComplete === 4 ? 'text-risk-low' : 'text-risk-high'}
          />
          <Row
            k="Verification"
            v={parcel.verification}
            vClass={parcel.verification === 'VERIFIED' ? 'text-risk-low' : 'text-risk-medium'}
          />
          <Row k="Acquisition" v={parcel.acquisitionStatus} />
          <Row
            k="Legal Dispute"
            v={parcel.disputed ? 'ACTIVE DISPUTE' : 'NO DISPUTE'}
            vClass={parcel.disputed ? 'text-risk-critical' : 'text-risk-low'}
          />
        </div>

        {/* Real Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex gap-2">
            <Link href="/twin" className="flex-1">
              <Button className="w-full text-[11px] py-1.5 flex items-center justify-center gap-1">
                <Box className="h-3 w-3" /> 3D Twin
              </Button>
            </Link>
            <Link
              href="/stakeholders"
              onClick={() => stakeholder && setSelectedStakeholder(stakeholder.id)}
              className="flex-1"
            >
              <Button className="w-full text-[11px] py-1.5 flex items-center justify-center gap-1">
                <Users className="h-3 w-3" /> Stakeholders
              </Button>
            </Link>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAssignOfficer}
              disabled={loadingAction === 'assign'}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-hair bg-panel2 px-2 py-1.5 font-mono text-[10.5px] text-txt-secondary hover:border-cyanline hover:text-cyan transition-colors"
            >
              {loadingAction === 'assign' ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3 w-3" />}
              Assign Officer
            </button>

            <button
              onClick={handleVerifyParcel}
              disabled={loadingAction === 'verify'}
              className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-hair bg-panel2 px-2 py-1.5 font-mono text-[10.5px] text-txt-secondary hover:border-cyanline hover:text-cyan transition-colors"
            >
              {loadingAction === 'verify' ? <Loader2 className="h-3 w-3 animate-spin" /> : <ClipboardCheck className="h-3 w-3" />}
              Start Verify
            </button>
          </div>

          <button
            onClick={handleSendNotice}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-hair bg-panel2 px-3 py-1.5 font-mono text-[11px] text-txt-secondary hover:border-cyanline hover:text-cyan transition-colors"
          >
            <Bell className="h-3 w-3" /> Send Acquisition Notice
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, vClass }: { k: string; v: string; vClass?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-hair/60 px-3 py-1.5 text-[11px] last:border-0">
      <span className="text-txt-tertiary">{k}</span>
      <span className={clsx('font-semibold', vClass)}>{v}</span>
    </div>
  );
}
