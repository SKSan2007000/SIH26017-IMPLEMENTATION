'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, FileText, CheckCircle2, AlertTriangle, Building, Compass, Layers } from 'lucide-react';
import { api } from '@/lib/api';
import type { DesignPackage } from '@/types';

interface Props {
  designId: string;
  onClose: () => void;
}

export function DesignPackageModal({ designId, onClose }: Props) {
  const [pkg, setPkg] = useState<DesignPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getDesignPackage(designId);
        setPkg(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [designId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-emerald-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-emerald-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Approved Design Release Package
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono">
                  {pkg?.packageNumber || 'DPKG-RELEASE'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Official engineering specifications issued for EPC contractors</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Disclaimer Banner */}
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-200 leading-relaxed">
              <span className="font-semibold text-amber-300">DEMONSTRATION DISCLAIMER: </span>
              {pkg?.disclaimer || 'CONCEPTUAL / SIMULATION — NOT A CERTIFIED ENGINEERING DRAWING.'} All geometries and cadastral associations are synthetic.
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 animate-pulse">Generating release package...</div>
          ) : pkg ? (
            <>
              {/* Specs Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg">
                  <div className="text-xs text-slate-400">Design Alignment</div>
                  <div className="text-sm font-bold text-white truncate">{pkg.specs.designName}</div>
                </div>
                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg">
                  <div className="text-xs text-slate-400">Corridor Length</div>
                  <div className="text-sm font-bold text-cyan-400">{pkg.specs.lengthKm} km</div>
                </div>
                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg">
                  <div className="text-xs text-slate-400">Land Impact</div>
                  <div className="text-sm font-bold text-amber-400">{pkg.specs.landImpactAcres} Acres</div>
                </div>
                <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-lg">
                  <div className="text-xs text-slate-400">Est. Budget</div>
                  <div className="text-sm font-bold text-emerald-400">₹{pkg.specs.estimatedCostCr} Cr</div>
                </div>
              </div>

              {/* Package Details */}
              <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-lg space-y-2">
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Approved Authority:</span>
                  <span className="font-medium text-emerald-300">{pkg.approvedBy}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Target Duration:</span>
                  <span className="font-medium text-white">{pkg.specs.estimatedDurationMonths} Months</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Predicted Delay Risk:</span>
                  <span className="font-medium text-emerald-400">{pkg.specs.delayRiskPct}% (Low Risk Corridor)</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span className="text-slate-400">Lane Configuration:</span>
                  <span className="font-medium text-white">{pkg.specs.lanes || 6}-Lane Access Controlled Expressway (32m RoW)</span>
                </div>
              </div>

              {/* Officer Instructions */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Government Special Officer Instructions
                </h4>
                <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 leading-relaxed font-mono">
                  {pkg.officerInstructions}
                </div>
              </div>

              {/* Attached Artifacts */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-slate-800/40 border border-slate-700 rounded flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Compass className="w-4 h-4 text-cyan-400" /> 2D GIS Cadastral Overlay
                  </span>
                  <span className="text-emerald-400 font-mono">Verified</span>
                </div>
                <div className="p-2.5 bg-slate-800/40 border border-slate-700 rounded flex items-center justify-between">
                  <span className="flex items-center gap-2 text-slate-300">
                    <Layers className="w-4 h-4 text-purple-400" /> 3D Digital Twin Viaduct Specs
                  </span>
                  <span className="text-emerald-400 font-mono">Synced</span>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-400">
            {downloaded ? '✓ Package exported with SHA-256 validation seal' : 'Available for authorized EPC contractors & authorities'}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {pkg && (
              <>
                <button
                  onClick={() => {
                    import('@/lib/utils/designPackageExport').then(({ downloadGeoJsonAlignment }) => {
                      downloadGeoJsonAlignment(pkg);
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono font-medium flex items-center gap-1 border border-slate-700"
                >
                  <Compass className="w-3.5 h-3.5" /> GeoJSON
                </button>
                <button
                  onClick={() => {
                    import('@/lib/utils/designPackageExport').then(({ downloadCsvSummary }) => {
                      downloadCsvSummary(pkg);
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium flex items-center gap-1 border border-slate-700"
                >
                  <FileText className="w-3.5 h-3.5" /> CSV
                </button>
              </>
            )}
            <button
              onClick={() => {
                if (pkg) {
                  import('@/lib/utils/designPackageExport').then(({ generateAndDownloadPdfReport }) => {
                    generateAndDownloadPdfReport(pkg);
                    setDownloaded(true);
                  });
                }
              }}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download Design PDF Report
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white text-xs font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
