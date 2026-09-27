'use client';

import React, { useState, useEffect } from 'react';
import { Sliders, RefreshCw, Save, CheckCircle2, AlertCircle, Compass, Layers, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import type { DesignAlternative, LonLat } from '@/types';
import { evaluateDesignGeometry } from '@/lib/simulation/designEngine';

interface Props {
  project_id: string;
  design: DesignAlternative;
  onClose: () => void;
  onSuccess: () => void;
}

export function OfficerRedesignModal({ project_id, design, onClose, onSuccess }: Props) {
  const latestVersion = design.versions[design.versions.length - 1] || design.versions[0];
  const [geometry, setGeometry] = useState<LonLat[]>(latestVersion?.routeGeometry || [[80.237, 13.087], [80.260, 13.140], [80.275, 13.190]]);
  const [corridorWidth, setCorridorWidth] = useState<number>(32);
  const [shiftOffset, setShiftOffset] = useState<number>(0);
  const [officerName, setOfficerName] = useState('R. Vignesh (Senior Field Officer)');
  const [notes, setNotes] = useState('');
  const [metrics, setMetrics] = useState<any>(null);
  const [recalculating, setRecalculating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Initial calculation
  useEffect(() => {
    handleRecalculate();
  }, []);

  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      // Apply interactive shift offset to internal waypoints
      const modifiedGeom: LonLat[] = geometry.map((pt, idx) => {
        if (idx === 0 || idx === geometry.length - 1) return pt;
        const offsetDeg = (shiftOffset * 0.0001);
        return [Number((pt[0] + offsetDeg).toFixed(6)), Number((pt[1] + offsetDeg * 0.8).toFixed(6))];
      });

      const res = await api.recalculateDesign(project_id, modifiedGeom, corridorWidth, design.strategy);
      setMetrics(res);
    } catch (err) {
      console.error(err);
      // Fallback
      const res = evaluateDesignGeometry(geometry, corridorWidth, design.strategy);
      setMetrics(res);
    } finally {
      setRecalculating(false);
    }
  };

  const handleSaveVersion = async () => {
    setSaving(true);
    try {
      const modifiedGeom: LonLat[] = geometry.map((pt, idx) => {
        if (idx === 0 || idx === geometry.length - 1) return pt;
        const offsetDeg = (shiftOffset * 0.0001);
        return [Number((pt[0] + offsetDeg).toFixed(6)), Number((pt[1] + offsetDeg * 0.8).toFixed(6))];
      });

      await api.saveDesignVersion(
        design.id,
        modifiedGeom,
        officerName,
        notes || `Officer alignment modified: ${shiftOffset > 0 ? '+' : ''}${shiftOffset}m shift with ${corridorWidth}m RoW.`,
        corridorWidth
      );
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-cyan-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-cyan-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Officer Interactive Alignment Redesign
                <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono">
                  {design.label} (v{design.currentVersionNumber})
                </span>
              </h3>
              <p className="text-xs text-slate-400">Modify corridor parameters & dynamically recalculate land/cost/risk metrics</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* Alignment Control Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Right-of-Way Corridor Width</span>
                <span className="font-mono text-cyan-400 font-bold">{corridorWidth} meters</span>
              </div>
              <input
                type="range"
                min="24"
                max="60"
                step="2"
                value={corridorWidth}
                onChange={(e) => setCorridorWidth(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>24m (4-Lane)</span>
                <span>32m (6-Lane Std)</span>
                <span>60m (Expressway + Siding)</span>
              </div>
            </div>

            <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">Corridor Alignment Shift Offset</span>
                <span className="font-mono text-purple-400 font-bold">{shiftOffset > 0 ? `+${shiftOffset}m (North)` : shiftOffset < 0 ? `${shiftOffset}m (South)` : '0m (Direct)'}</span>
              </div>
              <input
                type="range"
                min="-80"
                max="80"
                step="5"
                value={shiftOffset}
                onChange={(e) => setShiftOffset(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>-80m Bypass</span>
                <span>0m Baseline</span>
                <span>+80m Bypass</span>
              </div>
            </div>
          </div>

          {/* Recalculate Trigger */}
          <div className="flex items-center justify-between p-3 bg-slate-800/60 border border-slate-700 rounded-lg">
            <div className="text-xs text-slate-300">
              Interactive changes update geometric corridor buffers and spatial intersections.
            </div>
            <button
              onClick={handleRecalculate}
              disabled={recalculating}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/50 text-cyan-300 text-xs font-medium flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
              Recalculate All Metrics
            </button>
          </div>

          {/* Dynamic Recalculated Metric Cards */}
          {metrics && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Dynamic Multi-Criteria Evaluation</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">Length</span>
                  <span className="text-base font-bold text-cyan-400">{metrics.lengthKm} km</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">Land Impact</span>
                  <span className="text-base font-bold text-amber-400">{metrics.landImpactAcres} Acres</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">Affected Parcels</span>
                  <span className="text-base font-bold text-rose-400">{metrics.affectedParcelsCount} Cadastral</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">Est. Cost</span>
                  <span className="text-base font-bold text-emerald-400">₹{metrics.estimatedCostCr} Cr</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">Delay Risk</span>
                  <span className={`text-base font-bold ${metrics.delayRiskPct >= 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {metrics.delayRiskPct}%
                  </span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">Connectivity</span>
                  <span className="text-base font-bold text-purple-400">{metrics.connectivityScore}/100</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <span className="text-base font-bold text-white">{metrics.estimatedDurationMonths} mo</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                  <span className="text-[10px] text-slate-400 block">AI Overall Score</span>
                  <span className="text-base font-bold text-cyan-300">{metrics.overallScore}/100</span>
                </div>
              </div>
            </div>
          )}

          {/* Officer Attribution & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Authorizing Officer</label>
              <input
                type="text"
                value={officerName}
                onChange={(e) => setOfficerName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Redesign Version Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Northern bypass around dense residential hamlet"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Creates <span className="text-cyan-300 font-mono">v{design.currentVersionNumber + 1}</span> without modifying approved baseline history.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveVersion}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-cyan-900/30"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : `Save as Version ${design.currentVersionNumber + 1}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
