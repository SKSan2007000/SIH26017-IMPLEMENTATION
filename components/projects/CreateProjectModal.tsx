'use client';

import React, { useState } from 'react';
import {
  X,
  PlusCircle,
  Building2,
  MapPin,
  Calendar,
  IndianRupee,
  Layers,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Users,
  Compass,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { projectsApi, CreateProjectPayload } from '@/lib/api/projects';
import type { Project } from '@/types';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
}

const DISTRICT_COORDS_MAP: Record<string, [number, number]> = {
  chennai: [80.2707, 13.0827],
  coimbatore: [76.9558, 11.0168],
  madurai: [78.1198, 9.9252],
  salem: [78.146, 11.6643],
  tiruchirappalli: [78.7047, 10.7905],
  vellore: [79.1325, 12.9165],
  kanchipuram: [79.7036, 12.8342],
  tiruvallur: [79.9079, 13.1432],
  erode: [77.7274, 11.341],
  tirunelveli: [77.7567, 8.7139],
};

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    project_code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
    project_type: 'Expressway / Highway Corridor',
    description: '',
    state: 'Tamil Nadu',
    district: 'Coimbatore',
    taluk: 'Sulur',
    city: 'Coimbatore',
    project_value: 1250,
    land_required_acres: 160,
    target_completion_date: '2028-12-31',
    priority: 'HIGH',
    start_location: 'Sulur Junction NH-544',
    end_location: 'Avinashi Industrial Bypass',
    corridor_length_km: 42.5,
    right_of_way_m: 60.0,
    auto_assign_team: true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRegenerateCode = () => {
    setFormData((prev) => ({
      ...prev,
      project_code: `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const normalizedDist = formData.district.toLowerCase();
      const coords = DISTRICT_COORDS_MAP[normalizedDist] || [80.2707, 13.0827];

      const payload: CreateProjectPayload = {
        name: formData.name.trim(),
        project_code: formData.project_code.trim(),
        type: formData.project_type,
        project_type: formData.project_type,
        description: formData.description.trim() || `${formData.project_type} in ${formData.district}, ${formData.state}`,
        state: formData.state,
        district: formData.district,
        taluk: formData.taluk.trim(),
        city: formData.city.trim(),
        project_value: Number(formData.project_value),
        estimated_budget_cr: Number(formData.project_value),
        land_required_acres: Number(formData.land_required_acres),
        required_land_area_acres: Number(formData.land_required_acres),
        target_completion_date: formData.target_completion_date,
        target_completion: formData.target_completion_date,
        priority: formData.priority,
        start_location: formData.start_location.trim(),
        end_location: formData.end_location.trim(),
        destination: formData.end_location.trim(),
        corridor_length_km: Number(formData.corridor_length_km),
        right_of_way_m: Number(formData.right_of_way_m),
        coords,
        auto_assign_team: formData.auto_assign_team,
      };

      const result = await projectsApi.createProject(payload);
      onSuccess(result);
    } catch (err: any) {
      const msg = err?.message || err?.detail || 'Failed to create project. Please verify all inputs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <PlusCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Create New Infrastructure Project
              </h2>
              <p className="text-xs text-slate-400">
                LandGuard AI Project Intake & Automated Cadre Allocation Engine
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
            <div>
              <p className="font-semibold">Project Creation Error</p>
              <p className="text-xs text-rose-300/90 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* SECTION A: Project Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-400 border-b border-slate-800 pb-2">
              <FileText className="w-4 h-4" />
              <span>Section A: Project Identification</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Title / Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Coimbatore Green Corridor Expressway"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="md:col-span-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Project Code <span className="text-rose-400">*</span>
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    name="project_code"
                    required
                    placeholder="PRJ-2048"
                    value={formData.project_code}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white font-mono text-sm uppercase focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleRegenerateCode}
                    title="Generate New Code"
                    className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 rounded-xl transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Corridor Category / Type
                </label>
                <select
                  name="project_type"
                  value={formData.project_type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Expressway / Highway Corridor">Expressway / Highway Corridor</option>
                  <option value="Dedicated Freight Railway Corridor">Dedicated Freight Railway Corridor</option>
                  <option value="Urban Metro Transit Corridor">Urban Metro Transit Corridor</option>
                  <option value="Industrial Bypass & Ring Road">Industrial Bypass & Ring Road</option>
                  <option value="High-Speed Rail Corridor">High-Speed Rail Corridor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Priority Level
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="CRITICAL">🔴 CRITICAL (Fast-Track SLA)</option>
                  <option value="HIGH">🟠 HIGH Priority</option>
                  <option value="MEDIUM">🟡 MEDIUM Priority</option>
                  <option value="LOW">🔵 LOW Priority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Strategic Scope & Description
              </label>
              <textarea
                name="description"
                rows={2}
                placeholder="High-capacity 6-lane access-controlled greenfield expressway connecting industrial clusters..."
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
              />
            </div>
          </div>

          {/* SECTION B: Geographic Territory */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-400 border-b border-slate-800 pb-2">
              <MapPin className="w-4 h-4" />
              <span>Section B: Administrative Jurisdiction & Territory</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  State
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  District
                </label>
                <select
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                >
                  <option value="Coimbatore">Coimbatore</option>
                  <option value="Chennai">Chennai</option>
                  <option value="Madurai">Madurai</option>
                  <option value="Salem">Salem</option>
                  <option value="Tiruchirappalli">Tiruchirappalli</option>
                  <option value="Vellore">Vellore</option>
                  <option value="Erode">Erode</option>
                  <option value="Kanchipuram">Kanchipuram</option>
                  <option value="Tiruvallur">Tiruvallur</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Taluk / Tahsil
                </label>
                <input
                  type="text"
                  name="taluk"
                  placeholder="e.g. Sulur"
                  value={formData.taluk}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  City / Node
                </label>
                <input
                  type="text"
                  name="city"
                  placeholder="e.g. Coimbatore"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION C: Planning, Budget & Timeline */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-400 border-b border-slate-800 pb-2">
              <IndianRupee className="w-4 h-4" />
              <span>Section C: Investment, Land Area & Target Date</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Estimated Budget (₹ Crore) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  name="project_value"
                  required
                  min="1"
                  step="0.1"
                  value={formData.project_value}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Required Land Area (Acres) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  name="land_required_acres"
                  required
                  min="1"
                  step="0.1"
                  value={formData.land_required_acres}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  name="target_completion_date"
                  value={formData.target_completion_date}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION D: Corridor Dimensions */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-indigo-400 border-b border-slate-800 pb-2">
              <Layers className="w-4 h-4" />
              <span>Section D: Corridor Alignment & Right-of-Way</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Start / Origin Location
                </label>
                <input
                  type="text"
                  name="start_location"
                  placeholder="e.g. Sulur Junction NH-544"
                  value={formData.start_location}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Destination / Terminus
                </label>
                <input
                  type="text"
                  name="end_location"
                  placeholder="e.g. Avinashi Bypass"
                  value={formData.end_location}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Length (km)
                </label>
                <input
                  type="number"
                  name="corridor_length_km"
                  step="0.1"
                  value={formData.corridor_length_km}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Right-of-Way (m)
                </label>
                <input
                  type="number"
                  name="right_of_way_m"
                  step="1"
                  value={formData.right_of_way_m}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION E: Intelligent Cadre Assignment Toggle */}
          <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-start gap-3">
            <input
              type="checkbox"
              id="auto_assign_team"
              name="auto_assign_team"
              checked={formData.auto_assign_team}
              onChange={handleChange}
              className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-800 border-slate-600"
            />
            <label htmlFor="auto_assign_team" className="text-xs text-slate-300 cursor-pointer">
              <span className="font-semibold text-emerald-400 block mb-0.5">
                Automatically execute 6-Role Cadre Allocation Engine (Recommended)
              </span>
              Calculates workload-balanced officer allocation across Project Head, District Officer, LAO, Lead Field Officer, Supervisor, and EPC Contractor with capacity limits.
            </label>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors border border-slate-700"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-900/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Computing Cadre Allocation & Creating Project...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Create Project & Assign Team</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
