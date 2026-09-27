'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Route, Map, Box, Sparkles, RefreshCw, Layers } from 'lucide-react';
import { GlassPanel, Button, DemoFlag } from '@/components/ui/Primitives';
import { STATES_DISTRICTS } from '@/lib/mock/_generators';
import { useAppStore } from '@/lib/store/useAppStore';
import { projectsApi, CreateProjectPayload } from '@/lib/api/projects';
import { AssignmentResultCard } from '@/components/projects/AssignmentResultCard';
import type { Project } from '@/types';

const PROJECT_TYPES = [
  'Expressway / Highway Corridor',
  'Dedicated Freight Railway Corridor',
  'Urban Metro Transit Corridor',
  'Industrial Bypass & Ring Road',
  'High-Speed Rail Corridor',
];

export function ProjectCreateForm() {
  const router = useRouter();
  const addProject = useAppStore((s) => s.addProject);
  const setSelectedProject = useAppStore((s) => s.setSelectedProject);

  const [form, setForm] = useState({
    name: '',
    project_code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
    type: PROJECT_TYPES[0],
    state: Object.keys(STATES_DISTRICTS)[0],
    district: STATES_DISTRICTS[Object.keys(STATES_DISTRICTS)[0]][0],
    taluk: 'Madhavaram',
    city: 'Chennai',
    startLocation: '',
    destination: '',
    budget: '1250',
    targetCompletion: '2028-12-31',
    landArea: '160',
    corridorLengthKm: '48.5',
    rightOfWayM: '60.0',
    priority: 'HIGH',
    auto_assign_team: true,
  });

  const [created, setCreated] = useState<Project | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const handleRegenerateCode = () => {
    setForm((prev) => ({
      ...prev,
      project_code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
    }));
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: CreateProjectPayload = {
        name: form.name.trim(),
        project_code: form.project_code.trim(),
        type: form.type,
        project_type: form.type,
        state: form.state,
        district: form.district,
        taluk: form.taluk,
        city: form.city,
        start_location: form.startLocation || `${form.district} Central`,
        end_location: form.destination || `${form.district} Industrial Node`,
        destination: form.destination || `${form.district} Industrial Node`,
        project_value: Number(form.budget) || 1250,
        estimated_budget_cr: Number(form.budget) || 1250,
        target_completion_date: form.targetCompletion,
        target_completion: form.targetCompletion,
        land_required_acres: Number(form.landArea) || 160,
        required_land_area_acres: Number(form.landArea) || 160,
        corridor_length_km: Number(form.corridorLengthKm) || 48.5,
        right_of_way_m: Number(form.rightOfWayM) || 60.0,
        priority: form.priority,
        auto_assign_team: form.auto_assign_team,
        coords: [80.22, 13.12],
      };

      const res = await projectsApi.createProject(payload);
      addProject(res);
      setSelectedProject(res.id);
      setCreated(res);
    } catch (err: any) {
      const msg = err?.message || err?.detail || 'Failed to create project. Verify unique code and required fields.';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="mx-auto mt-6 max-w-4xl space-y-6">
        <AssignmentResultCard
          project={created}
          onClose={() => setCreated(null)}
        />
        <div className="text-center">
          <button
            onClick={() => setCreated(null)}
            className="text-xs text-txt-tertiary hover:text-txt-primary underline cursor-pointer"
          >
            ← Create another project
          </button>
        </div>
      </div>
    );
  }

  return (
    <GlassPanel className="mx-auto mt-4 max-w-3xl p-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
              PROJECT INTAKE
            </span>
            <h2 className="font-display text-[17px] font-bold">Create New Infrastructure Project</h2>
          </div>
          <p className="mt-1 text-[12px] text-txt-tertiary">
            Define corridor boundary, target administrative districts, financial parameters, and execute AI cadre allocation
          </p>
        </div>
        <DemoFlag />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <strong>Error:</strong> {error}
        </div>
      )}

      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <Field label="Project Name" span2>
          <input
            required
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder="e.g. Chennai Outer Ring Road Extension"
            className="input"
          />
        </Field>

        <Field label="Project Code">
          <div className="flex items-center gap-1.5">
            <input
              required
              value={form.project_code}
              onChange={(e) => update('project_code', e.target.value.toUpperCase())}
              placeholder="PRJ-2048"
              className="input font-mono uppercase"
            />
            <button
              type="button"
              onClick={handleRegenerateCode}
              title="Generate New Code"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </Field>

        <Field label="Project Type">
          <select value={form.type} onChange={(e) => update('type', e.target.value)} className="input">
            {PROJECT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>

        <Field label="State">
          <select
            value={form.state}
            onChange={(e) => {
              update('state', e.target.value);
              update('district', STATES_DISTRICTS[e.target.value][0]);
            }}
            className="input"
          >
            {Object.keys(STATES_DISTRICTS).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>

        <Field label="District">
          <select value={form.district} onChange={(e) => update('district', e.target.value)} className="input">
            {STATES_DISTRICTS[form.state].map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </Field>

        <Field label="Start / Origin Location">
          <input
            required
            value={form.startLocation}
            onChange={(e) => update('startLocation', e.target.value)}
            placeholder="e.g. Ennore Port Junction"
            className="input"
          />
        </Field>

        <Field label="Destination Node">
          <input
            required
            value={form.destination}
            onChange={(e) => update('destination', e.target.value)}
            placeholder="e.g. Sriperumbudur Industrial Hub"
            className="input"
          />
        </Field>

        <Field label="Estimated Budget (₹ Cr)">
          <input
            required
            type="number"
            step="0.1"
            value={form.budget}
            onChange={(e) => update('budget', e.target.value)}
            className="input font-mono"
          />
        </Field>

        <Field label="Required Land Area (Acres)">
          <input
            required
            type="number"
            step="0.1"
            value={form.landArea}
            onChange={(e) => update('landArea', e.target.value)}
            className="input font-mono"
          />
        </Field>

        <Field label="Target Completion Date">
          <input
            required
            type="date"
            value={form.targetCompletion}
            onChange={(e) => update('targetCompletion', e.target.value)}
            className="input"
          />
        </Field>

        <Field label="Priority Level">
          <select value={form.priority} onChange={(e) => update('priority', e.target.value)} className="input">
            <option value="CRITICAL">🔴 CRITICAL (Fast-Track SLA)</option>
            <option value="HIGH">🟠 HIGH Priority</option>
            <option value="MEDIUM">🟡 MEDIUM Priority</option>
            <option value="LOW">🔵 LOW Priority</option>
          </select>
        </Field>

        <div className="col-span-2 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-2.5">
          <input
            type="checkbox"
            id="auto_assign_cb"
            checked={form.auto_assign_team}
            onChange={(e) => update('auto_assign_team', e.target.checked)}
            className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-800"
          />
          <label htmlFor="auto_assign_cb" className="text-xs text-slate-300 cursor-pointer">
            <strong className="text-emerald-400 block mb-0.5">Auto-Assign 6-Member Operational Team</strong>
            Runs the workload-balanced officer allocation algorithm (Project Head, District Officer, LAO, Field Officer, Supervisor, Contractor).
          </label>
        </div>

        <div className="col-span-2 mt-2 flex justify-end gap-2 border-t border-hair pt-4">
          <Button type="button" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Computing Allocation...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" /> Create Project & Assign Team
              </>
            )}
          </Button>
        </div>
      </form>
      <style jsx>{`
        .input {
          width: 100%;
          border-radius: 8px;
          border: 1px solid var(--tw-border-opacity, rgba(148, 176, 204, 0.18));
          background: rgba(20, 27, 40, 0.65);
          padding: 8px 11px;
          font-size: 12.5px;
          color: #e7edf5;
          outline: none;
        }
        .input:focus {
          border-color: #38d3f0;
        }
      `}</style>
    </GlassPanel>
  );
}

function Field({ label, children, span2 }: { label: string; children: React.ReactNode; span2?: boolean }) {
  return (
    <label className={span2 ? 'col-span-2 block' : 'block'}>
      <span className="mb-1.5 block font-mono text-[10.5px] uppercase tracking-wide text-txt-tertiary">{label}</span>
      {children}
    </label>
  );
}
