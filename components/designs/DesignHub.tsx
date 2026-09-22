'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Sparkles,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  GitPullRequest,
  FileCheck,
  Eye,
  GitFork,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';
import { api } from '@/lib/api';
import type { DesignAlternative, DesignComparisonItem, DesignChangeRequest } from '@/types';
import { OfficerRedesignModal } from './OfficerRedesignModal';
import { DesignPackageModal } from './DesignPackageModal';
import { ChangeRequestModal } from './ChangeRequestModal';

export function DesignHub() {
  const selectedProjectId = useAppStore((s) => s.selectedProjectId) ?? 'PRJ-1042';
  const selectedDesignId = useAppStore((s) => s.selectedDesignId);
  const setSelectedDesign = useAppStore((s) => s.setSelectedDesign);
  const compareDesignIds = useAppStore((s) => s.compareDesignIds);
  const toggleCompareDesignId = useAppStore((s) => s.toggleCompareDesignId);

  const [designs, setDesigns] = useState<DesignAlternative[]>([]);
  const [comparison, setComparison] = useState<{ comparedDesigns: DesignComparisonItem[]; recommendedDesignId: string } | null>(null);
  const [changeRequests, setChangeRequests] = useState<DesignChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Modals
  const [redesignModalOpen, setRedesignModalOpen] = useState(false);
  const [packageModalOpen, setPackageModalOpen] = useState(false);
  const [changeRequestModalOpen, setChangeRequestModalOpen] = useState(false);
  const [selectedChangeRequest, setSelectedChangeRequest] = useState<DesignChangeRequest | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'comparison' | 'versions' | 'visual'>('overview');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [ds, comp, crs] = await Promise.all([
        api.getProjectDesigns(selectedProjectId),
        api.compareDesigns(selectedProjectId),
        api.getChangeRequests(selectedProjectId),
      ]);
      setDesigns(ds);
      setComparison(comp);
      setChangeRequests(crs);
      if (!selectedDesignId && ds.length > 0) {
        setSelectedDesign(ds[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [selectedProjectId]);

  const activeDesign = designs.find((d) => d.id === selectedDesignId) || designs[0];
  const activeVersion = activeDesign?.versions[activeDesign.versions.length - 1] || activeDesign?.versions[0];

  const handleGenerateDesigns = async () => {
    setGenerating(true);
    try {
      const newDesigns = await api.generateAiDesigns(selectedProjectId, 4);
      setDesigns(newDesigns);
      const comp = await api.compareDesigns(selectedProjectId);
      setComparison(comp);
    } catch (err) {
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleApproveDesign = async () => {
    if (!activeDesign) return;
    try {
      await api.approveDesign(activeDesign.id, 'Dr. A. Sundaram (Project Director)');
      loadAll();
      setPackageModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & AI Generation Trigger */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-white tracking-wide">Multi-Design & Versioning Engine</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-mono">
              PHASE 6 MULTI-PROJECT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic AI corridor alternatives, version history tracking, officer redesign, and contractor engineering packages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleGenerateDesigns}
            disabled={generating}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-900/30 transition-all active:scale-95"
          >
            <Sparkles className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Generating AI Alternatives...' : 'Generate AI Alternatives'}
          </button>
        </div>
      </div>

      {/* Design Candidate Cards Carousel / Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {designs.map((d) => {
          const isSelected = d.id === activeDesign?.id;
          const isBest = comparison?.recommendedDesignId === d.id;
          const latestV = d.versions[d.versions.length - 1];

          return (
            <div
              key={d.id}
              onClick={() => setSelectedDesign(d.id)}
              className={`relative cursor-pointer rounded-xl p-4 border transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 shadow-xl shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
              }`}
            >
              {/* Badges */}
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200">
                  {d.label} (v{d.currentVersionNumber})
                </span>
                <div className="flex items-center gap-1.5">
                  {isBest && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> AI Top Pick
                    </span>
                  )}
                  {d.isApproved && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Approved
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-sm font-bold text-white truncate mb-1">{d.name}</h3>
              <p className="text-[11px] text-slate-400 mb-3">{d.strategy}</p>

              {/* Quick metrics */}
              <div className="grid grid-cols-3 gap-1.5 text-center text-xs py-2 px-1 bg-slate-950/60 rounded-lg border border-slate-800/60 mb-3">
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Length</span>
                  <span className="font-bold text-cyan-400">{latestV?.lengthKm ?? 35} km</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Cost</span>
                  <span className="font-bold text-emerald-400">₹{latestV?.estimatedCostCr ?? 2100} Cr</span>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 block uppercase">Risk</span>
                  <span className={`font-bold ${(latestV?.delayRiskPct ?? 20) >= 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {latestV?.delayRiskPct ?? 20}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                <span className="text-slate-400 text-[11px]">Overall Score</span>
                <span className="font-mono font-bold text-cyan-300">{latestV?.overallScore ?? 85}/100</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Design Detailed Workspace Tabs */}
      {activeDesign && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-md">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between border-b border-slate-800 px-6 pt-3 bg-slate-950/40">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'overview'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" /> Design Analysis & Actions
              </button>
              <button
                onClick={() => setActiveTab('comparison')}
                className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'comparison'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-4 h-4" /> Multi-Design Matrix ({comparison?.comparedDesigns.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('versions')}
                className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'versions'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <GitFork className="w-4 h-4" /> Version History ({activeDesign.versions.length})
              </button>
              <button
                onClick={() => setActiveTab('visual')}
                className={`pb-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === 'visual'
                    ? 'border-cyan-500 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-4 h-4" /> Engineering Schematic Visual
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 pb-2">
              <button
                onClick={() => setRedesignModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" /> Edit Alignment (Officer Redesign)
              </button>
              <button
                onClick={handleApproveDesign}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Approve & Release Package
              </button>
            </div>
          </div>

          {/* Tab 1: Overview & Actions */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                  <div className="text-xs text-slate-400">Total Corridor Length</div>
                  <div className="text-xl font-bold text-cyan-400 mt-1">{activeVersion?.lengthKm} km</div>
                  <div className="text-[11px] text-slate-500 mt-1">6-Lane Access-Controlled Highway</div>
                </div>
                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                  <div className="text-xs text-slate-400">Cadastral Land Impact</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">{activeVersion?.landImpactAcres} Acres</div>
                  <div className="text-[11px] text-slate-500 mt-1">{activeVersion?.affectedParcelsCount} affected land parcels</div>
                </div>
                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                  <div className="text-xs text-slate-400">Estimated Total Cost</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">₹{activeVersion?.estimatedCostCr} Cr</div>
                  <div className="text-[11px] text-slate-500 mt-1">Civil + Land Acquisition + Resettlement</div>
                </div>
                <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl">
                  <div className="text-xs text-slate-400">AI Acquisition Delay Risk</div>
                  <div className={`text-xl font-bold mt-1 ${(activeVersion?.delayRiskPct ?? 0) >= 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {activeVersion?.delayRiskPct}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Est. Duration: {activeVersion?.estimatedDurationMonths} months</div>
                </div>
              </div>

              {/* Contractor Collaboration & Change Requests */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <GitPullRequest className="w-4 h-4 text-purple-400" />
                    Contractor Field Design Change Requests ({changeRequests.length})
                  </div>
                  <button
                    onClick={() => {
                      setSelectedChangeRequest(null);
                      setChangeRequestModalOpen(true);
                    }}
                    className="px-3 py-1 rounded bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-300 text-xs font-medium"
                  >
                    + Submit Change Request
                  </button>
                </div>

                {changeRequests.length === 0 ? (
                  <div className="text-xs text-slate-500 py-3 text-center">No active contractor change requests for this design.</div>
                ) : (
                  <div className="space-y-2">
                    {changeRequests.map((cr) => (
                      <div
                        key={cr.id}
                        onClick={() => {
                          setSelectedChangeRequest(cr);
                          setChangeRequestModalOpen(true);
                        }}
                        className="p-3 bg-slate-900 border border-slate-800 rounded-lg hover:border-purple-500/50 cursor-pointer flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white block">{cr.title}</span>
                          <span className="text-slate-400 text-[11px]">By {cr.contractorName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-emerald-400 font-bold">Cost Delta: {cr.aiImpactAnalysis.costDeltaCr > 0 ? `+₹${cr.aiImpactAnalysis.costDeltaCr}` : `₹${cr.aiImpactAnalysis.costDeltaCr}`} Cr</span>
                          <span className={`px-2 py-0.5 rounded font-mono text-[10px] ${
                            cr.officerReviewStatus === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {cr.officerReviewStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Side-by-Side Comparison Matrix */}
          {activeTab === 'comparison' && comparison && (
            <div className="p-6 overflow-x-auto space-y-4">
              <table className="w-full text-left text-xs text-slate-300 border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Design Candidate</th>
                    <th className="py-3 px-3">Strategy</th>
                    <th className="py-3 px-3">Length</th>
                    <th className="py-3 px-3">Land Impact</th>
                    <th className="py-3 px-3">Affected Parcels</th>
                    <th className="py-3 px-3">Estimated Cost</th>
                    <th className="py-3 px-3">Duration</th>
                    <th className="py-3 px-3">Delay Risk</th>
                    <th className="py-3 px-3">Connectivity</th>
                    <th className="py-3 px-3">Overall Score</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {comparison.comparedDesigns.map((c) => (
                    <tr
                      key={c.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        c.id === activeDesign.id ? 'bg-cyan-950/20 font-medium text-white' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 flex items-center gap-2">
                        <span className="font-bold text-white">{c.label}</span>
                        {c.aiRecommended && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 font-bold">
                            RECOMMENDED
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-3 text-slate-400">{c.strategy}</td>
                      <td className="py-3.5 px-3 font-mono text-cyan-400">{c.lengthKm} km</td>
                      <td className="py-3.5 px-3 text-amber-400 font-mono">{c.landImpactAcres} Ac</td>
                      <td className="py-3.5 px-3 text-rose-400 font-mono">{c.affectedParcels}</td>
                      <td className="py-3.5 px-3 text-emerald-400 font-mono">₹{c.estimatedCostCr} Cr</td>
                      <td className="py-3.5 px-3 font-mono">{c.estimatedDurationMonths} mo</td>
                      <td className="py-3.5 px-3">
                        <span className={`font-mono font-bold ${c.delayRiskPct >= 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {c.delayRiskPct}%
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono text-purple-400">{c.connectivityScore}/100</td>
                      <td className="py-3.5 px-3 font-mono font-bold text-cyan-300 text-sm">{c.overallScore}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedDesign(c.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium"
                        >
                          Select
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tab 3: Version History */}
          {activeTab === 'versions' && (
            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {activeDesign.versions.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400 text-sm">Version {v.versionNumber}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">{v.source}</span>
                        <span className="text-xs text-slate-500">• Created by {v.createdBy}</span>
                      </div>
                      <p className="text-xs text-slate-300">{v.notes || 'Alignment geometry saved by authorized officer.'}</p>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div>
                        <span className="text-slate-500 block text-[9px]">Length</span>
                        <span className="text-white">{v.lengthKm} km</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Cost</span>
                        <span className="text-emerald-400">₹{v.estimatedCostCr} Cr</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[9px]">Score</span>
                        <span className="text-cyan-300 font-bold">{v.overallScore}/100</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 4: Conceptual Engineering Schematic Visualizer */}
          {activeTab === 'visual' && (
            <div className="p-6 space-y-4">
              {/* Prominent Disclaimer */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-3 text-xs text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <span>
                  <strong>NOTICE:</strong> CONCEPTUAL / SIMULATION — NOT A CERTIFIED ENGINEERING DRAWING.
                  Schematic visuals represent high-level corridor planning approximations.
                </span>
              </div>

              {/* Conceptual Cross-Section Diagram */}
              <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center space-y-4">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Conceptual Viaduct Cross-Section (32m RoW / 6-Lane Access-Controlled)
                </div>

                {/* SVG Schematic */}
                <svg viewBox="0 0 600 180" className="w-full max-w-xl h-auto stroke-current">
                  {/* Ground Level */}
                  <line x1="20" y1="150" x2="580" y2="150" stroke="#475569" strokeWidth="3" strokeDasharray="6 4" />
                  <text x="30" y="170" fill="#64748b" fontSize="10">Ground Cadastral Boundary (RoW 32m)</text>

                  {/* Concrete Piers */}
                  <rect x="270" y="70" width="60" height="80" fill="#1e293b" stroke="#06b6d4" strokeWidth="2" rx="4" />
                  <line x1="300" y1="70" x2="300" y2="150" stroke="#0891b2" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Viaduct Superstructure Deck */}
                  <polygon points="100,70 500,70 480,50 120,50" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                  
                  {/* Road Deck Lanes */}
                  <line x1="120" y1="50" x2="480" y2="50" stroke="#38bdf8" strokeWidth="4" />
                  <line x1="180" y1="50" x2="420" y2="50" stroke="#facc15" strokeWidth="2" strokeDasharray="8 6" />

                  {/* Median Barrier */}
                  <rect x="295" y="40" width="10" height="10" fill="#38bdf8" />

                  {/* Dimension Annotations */}
                  <line x1="100" y1="25" x2="500" y2="25" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrow)" />
                  <text x="250" y="20" fill="#38bdf8" fontSize="11" fontWeight="bold">Deck Width: 28.5m</text>
                  <text x="200" y="115" fill="#94a3b8" fontSize="10">Vertical Clearance: 5.5m</text>
                </svg>

                <div className="grid grid-cols-3 gap-4 text-center text-xs text-slate-400 w-full max-w-lg pt-2">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Pier Foundation</span>
                    <span className="font-bold text-white">Cast-in-situ Bored Piles</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Superstructure</span>
                    <span className="font-bold text-white">Precast Segmental Box Girder</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-500 block text-[10px]">Design Speed</span>
                    <span className="font-bold text-cyan-400">100 km/h</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {redesignModalOpen && activeDesign && (
        <OfficerRedesignModal
          project_id={selectedProjectId}
          design={activeDesign}
          onClose={() => setRedesignModalOpen(false)}
          onSuccess={() => {
            setRedesignModalOpen(false);
            loadAll();
          }}
        />
      )}

      {packageModalOpen && activeDesign && (
        <DesignPackageModal
          designId={activeDesign.id}
          onClose={() => setPackageModalOpen(false)}
        />
      )}

      {changeRequestModalOpen && activeDesign && (
        <ChangeRequestModal
          projectId={selectedProjectId}
          designId={activeDesign.id}
          existingRequest={selectedChangeRequest}
          onClose={() => {
            setChangeRequestModalOpen(false);
            setSelectedChangeRequest(null);
          }}
          onSuccess={() => {
            setChangeRequestModalOpen(false);
            setSelectedChangeRequest(null);
            loadAll();
          }}
        />
      )}
    </div>
  );
}
