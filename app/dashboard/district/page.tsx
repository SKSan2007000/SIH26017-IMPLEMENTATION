'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  MapPin,
  AlertTriangle,
  Users,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  ShieldAlert,
  Send,
  UserCheck,
  FileText,
  Map,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { DemoFlag, GlassPanel, PanelHead, Button } from '@/components/ui/Primitives';
import { useAppStore } from '@/lib/store/useAppStore';
import { MOCK_PARCELS } from '@/lib/mock/parcels';
import { MOCK_STAKEHOLDERS } from '@/lib/mock/stakeholders';
import { MOCK_PROJECTS } from '@/lib/mock/projects';
import clsx from 'clsx';

const MapCommand = dynamic(() => import('@/components/gis/MapCommand').then((m) => m.MapCommand), { ssr: false });

const DISTRICTS = ['Chennai', 'Salem', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Kanchipuram'];

export default function DistrictOfficerDashboard() {
  const [selectedDistrict, setSelectedDistrict] = useState('Chennai');
  const selectedProjectId = useAppStore((s) => s.selectedProjectId);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);

  const districtParcels = MOCK_PARCELS.slice(0, 8);
  const districtStakeholders = MOCK_STAKEHOLDERS.slice(0, 6);
  const districtProjects = MOCK_PROJECTS.filter((p) => p.district === selectedDistrict || selectedDistrict === 'Chennai');

  return (
    <AppShell>
      {/* Top Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-300">
              DISTRICT OFFICER
            </span>
            <div className="font-display text-[20px] font-bold tracking-wide">
              District Administration & Cadastral Operations
            </div>
          </div>
          <div className="mt-0.5 text-[12.5px] text-txt-tertiary">
            District Collectorate operations: land acquisition notices, compensation awards, disputes & officer allocation
          </div>
        </div>

        {/* District Selector & Flag */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-lg border border-hair bg-panel2 px-3 py-1.5 text-[12px]">
            <MapPin className="h-3.5 w-3.5 text-cyan" />
            <span className="text-txt-tertiary">District:</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent font-semibold text-txt-primary outline-none cursor-pointer"
            >
              {DISTRICTS.map((d) => (
                <option key={d} value={d} className="bg-raised">
                  {d}
                </option>
              ))}
            </select>
          </div>
          <DemoFlag />
        </div>
      </div>

      {/* District KPI Metrics */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        <StatCard label="District Projects" value={districtProjects.length.toString()} sub={`${selectedDistrict} Jurisdiction`} />
        <StatCard label="Affected Parcels" value="142" sub="Across 3 Corridors" />
        <StatCard label="Stakeholders" value="318" sub="Notified land owners" />
        <StatCard label="Pending Verif." value="38" sub="Surveyor queue" isWarning />
        <StatCard label="Pending Comp." value="₹145 Cr" sub="Awaiting bank awards" />
        <StatCard label="Active Disputes" value="9" sub="Legal objections filed" isAlert />
        <StatCard label="Officer Workload" value="0.74" sub="Moderate capacity" />
        <StatCard label="SLA Compliance" value="92.4%" sub="18 verifications on-time" />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left 2 Cols: Task Queue, Disputes, Officer Allocation */}
        <div className="space-y-4 lg:col-span-2">
          {/* Priority Task Queue */}
          <div className="overflow-hidden rounded-xl border border-hair bg-panel">
            <div className="flex items-center justify-between border-b border-hair p-3.5 bg-panel2/60">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-cyan" />
                <h3 className="font-display text-[14px] font-bold text-txt-primary">
                  District Priority Task Queue & SLA Monitoring
                </h3>
              </div>
              <span className="font-mono text-[10.5px] text-txt-tertiary">45s Demo SLA Cycle</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="border-b border-hair bg-raised/40 text-left font-mono text-[10px] uppercase tracking-wider text-txt-tertiary">
                    <th className="px-3.5 py-2.5">Parcel / Location</th>
                    <th className="px-3.5 py-2.5">Task Description</th>
                    <th className="px-3.5 py-2.5">Assigned Officer</th>
                    <th className="px-3.5 py-2.5">SLA Countdown</th>
                    <th className="px-3.5 py-2.5">Priority</th>
                    <th className="px-3.5 py-2.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {districtParcels.map((p, idx) => (
                    <tr key={p.id} className="border-b border-hair/60 hover:bg-panel2/50 transition-colors">
                      <td className="px-3.5 py-3">
                        <div className="font-mono font-bold text-cyan">{p.id}</div>
                        <div className="text-[11px] text-txt-secondary">{p.village || 'Ambattur Taluk'}</div>
                      </td>

                      <td className="px-3.5 py-3 text-txt-primary font-medium">
                        {idx % 3 === 0
                          ? 'Section 11(1) Notice Response Verification'
                          : idx % 3 === 1
                          ? 'GPS Boundary Ground Truth Verification'
                          : 'Compensation Calculation & Title Clearance'}
                      </td>

                      <td className="px-3.5 py-3 font-mono text-[11px] text-txt-secondary">
                        {idx % 2 === 0 ? 'OFC-Anand-R' : 'OFC-Priya-S'}
                      </td>

                      <td className="px-3.5 py-3 font-mono text-[11px] text-amber-400">
                        {idx % 2 === 0 ? '00:24 left' : '00:38 left'}
                      </td>

                      <td className="px-3.5 py-3">
                        <span
                          className={clsx(
                            'rounded px-2 py-0.5 font-mono text-[10px] font-bold',
                            p.riskBand === 'critical'
                              ? 'bg-risk-critical/20 text-risk-critical'
                              : 'bg-risk-high/20 text-risk-high'
                          )}
                        >
                          {(p.riskBand || 'HIGH').toUpperCase()}
                        </span>
                      </td>

                      <td className="px-3.5 py-3 text-right">
                        <Link href="/field">
                          <button className="rounded border border-hair bg-panel2 px-2.5 py-1 font-mono text-[10.5px] text-txt-secondary hover:border-cyan hover:text-cyan">
                            Inspect
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Disputes & Officer Allocation */}
          <div className="grid grid-cols-2 gap-4">
            <GlassPanel className="p-4">
              <PanelHead title="Active Land Disputes & Objections" sub={`${selectedDistrict} Court / Revenue`} />
              <div className="mt-3 space-y-2 text-[12px]">
                {districtStakeholders.map((s) => (
                  <div key={s.id} className="rounded-lg border border-hair bg-panel2 p-2.5 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-txt-primary">{s.ref}</div>
                      <div className="font-mono text-[10.5px] text-txt-tertiary">{s.surveyNo} • {s.landUse}</div>
                    </div>
                    <span className="rounded bg-risk-high/15 border border-risk-high/30 px-2 py-0.5 font-mono text-[10px] text-risk-high">
                      {s.responseStatus}
                    </span>
                  </div>
                ))}
              </div>
            </GlassPanel>

            <GlassPanel className="p-4">
              <PanelHead title="Officer Workload & Allocation Index" sub="District Survey Cadre" />
              <div className="mt-3 space-y-3 text-[12px]">
                <WorkloadBar name="R. Vignesh (Senior Surveyor)" load={0.82} count="14 Tasks" />
                <WorkloadBar name="P. Anand (Field LAO)" load={0.65} count="9 Tasks" />
                <WorkloadBar name="K. Priya (Revenue Inspector)" load={0.50} count="6 Tasks" />
                <WorkloadBar name="M. Mohan (Cadastral Officer)" load={0.90} count="18 Tasks" isOverload />

                <div className="pt-2">
                  <Link href="/officers">
                    <Button variant="default" className="w-full text-[11px] py-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-cyan" /> Re-balance Officer Workload
                    </Button>
                  </Link>
                </div>
              </div>
            </GlassPanel>
          </div>
        </div>

        {/* Right Col: District GIS & Daily Operations */}
        <div className="space-y-4">
          <GlassPanel className="p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <div className="font-display text-[13.5px] font-bold">District Cadastral Map</div>
              <span className="font-mono text-[10px] text-cyan">{selectedDistrict} GIS</span>
            </div>
            <div className="h-64 overflow-hidden rounded-lg border border-hair">
              <MapCommand onSelectProject={setSelectedProject} />
            </div>
            <div className="mt-3 flex gap-2">
              <Link href="/gis" className="flex-1">
                <Button className="w-full text-[11px] py-1.5">
                  <Map className="h-3.5 w-3.5 text-cyan" /> 2D GIS
                </Button>
              </Link>
              <Link href="/twin" className="flex-1">
                <Button className="w-full text-[11px] py-1.5">
                  3D Twin
                </Button>
              </Link>
            </div>
          </GlassPanel>

          {/* Daily Operational Summary */}
          <GlassPanel className="p-4 space-y-2.5">
            <PanelHead title="Daily Operational Directives" sub="Revenue Division" />
            <div className="space-y-2 text-[12px]">
              <div className="rounded-lg border border-cyanline/30 bg-cyan-glow/15 p-2.5">
                <div className="font-semibold text-cyan">Disburse ₹42 Cr Batch A Compensation</div>
                <div className="text-[11px] text-txt-secondary mt-0.5">Approved by District Collectorate for 28 verified parcels.</div>
              </div>
              <div className="rounded-lg border border-hair bg-panel2 p-2.5">
                <div className="font-semibold text-txt-primary">Schedule Joint Revenue Inspection</div>
                <div className="text-[11px] text-txt-secondary mt-0.5">Dispute settlement for 14 commercial establishments on Corridor C.</div>
              </div>
            </div>
          </GlassPanel>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value, sub, isAlert, isWarning }: { label: string; value: string; sub: string; isAlert?: boolean; isWarning?: boolean }) {
  return (
    <div className={clsx(
      'rounded-xl border bg-panel p-3',
      isAlert ? 'border-risk-critical/40 bg-risk-critical/10' : isWarning ? 'border-risk-high/40 bg-risk-high/10' : 'border-hair'
    )}>
      <div className="font-mono text-[9px] uppercase tracking-wider text-txt-tertiary">{label}</div>
      <div className={clsx(
        'mt-1 font-display text-[18px] font-bold',
        isAlert ? 'text-risk-critical' : isWarning ? 'text-risk-high' : 'text-txt-primary'
      )}>
        {value}
      </div>
      <div className="mt-0.5 text-[10px] text-txt-tertiary truncate">{sub}</div>
    </div>
  );
}

function WorkloadBar({ name, load, count, isOverload }: { name: string; load: number; count: string; isOverload?: boolean }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-txt-primary font-medium">{name}</span>
        <span className={clsx('font-mono', isOverload ? 'text-risk-critical font-bold' : 'text-cyan')}>{count} ({Math.round(load * 100)}%)</span>
      </div>
      <div className="h-1.5 w-full bg-raised rounded-full overflow-hidden border border-hair">
        <div
          className={clsx('h-full', isOverload ? 'bg-risk-critical' : 'bg-cyan')}
          style={{ width: `${load * 100}%` }}
        />
      </div>
    </div>
  );
}
