'use client';

import React, { useState } from 'react';
import { GitPullRequest, AlertCircle, CheckCircle2, XCircle, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';
import { api } from '@/lib/api';
import type { DesignChangeRequest } from '@/types';

interface Props {
  projectId: string;
  designId: string;
  existingRequest?: DesignChangeRequest | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangeRequestModal({ projectId, designId, existingRequest, onClose, onSuccess }: Props) {
  const [title, setTitle] = useState(existingRequest?.title || 'Viaduct Alignment Shift at Km 14 to avoid Waterbody Canal');
  const [reason, setReason] = useState(
    existingRequest?.reason ||
      'Ground soil probe revealed high water table at Pier 42-48. Minor 35m northern shift saves ₹14 Cr in deep piling foundations.'
  );
  const [contractorName, setContractorName] = useState(existingRequest?.contractorName || 'Larsen & Toubro Infra Consortium');
  const [officerComment, setOfficerComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'request' | 'review'>('request');

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.createChangeRequest(projectId, designId, {
        title,
        reason,
        contractorId: 'con-01',
        contractorName,
        requestedModifications: { shiftOffsetMeters: 35.0, direction: 'North' },
        proposedGeometry: [
          [80.222, 13.067],
          [80.235, 13.098],
          [80.248, 13.135],
          [80.264, 13.175],
          [80.278, 13.205],
        ],
      });
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!existingRequest) return;
    setSubmitting(true);
    try {
      await api.reviewChangeRequest(
        existingRequest.id,
        status,
        officerComment || (status === 'APPROVED' ? 'Approved based on AI foundation savings analysis.' : 'Rejected due to RoW restrictions.'),
        'Dr. A. Sundaram (Project Director)'
      );
      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-purple-500/40 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-purple-950/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <GitPullRequest className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Contractor Design Change Request</h3>
              <p className="text-xs text-slate-400">Field engineering modifications & AI impact review workflow</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg font-bold px-2 py-1 rounded bg-slate-800/60 hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Mode Selector */}
        {existingRequest && (
          <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 pt-2 gap-4">
            <button
              onClick={() => setActiveTab('request')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'request'
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Request Details
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === 'review'
                  ? 'border-cyan-500 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Officer Review & AI Impact
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-sm">
          {activeTab === 'request' ? (
            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Contractor Organization</label>
                <input
                  type="text"
                  value={contractorName}
                  onChange={(e) => setContractorName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Proposed Change Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                  placeholder="e.g. Minor 35m northern alignment shift at Km 14"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Engineering Justification / Field Finding</label>
                <textarea
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                  placeholder="Describe geotechnical, environmental, or utility conflicts requiring modification..."
                  required
                />
              </div>

              {/* AI Impact Pre-Evaluation */}
              <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                  <Cpu className="w-4 h-4 text-purple-400" />
                  AI Automated Impact Forecast
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Cost Delta</span>
                    <span className="text-emerald-400 font-bold">-₹14.2 Cr (Savings)</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Risk Delta</span>
                    <span className="text-emerald-400 font-bold">-6% Delay Risk</span>
                  </div>
                  <div className="p-2 bg-slate-900 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Schedule Delta</span>
                    <span className="text-cyan-400 font-bold">-1.0 Month</span>
                  </div>
                </div>
              </div>

              {!existingRequest && (
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-purple-900/30"
                  >
                    {submitting ? 'Submitting...' : 'Submit Change Request'}
                  </button>
                </div>
              )}
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/40 border border-slate-700/50 rounded-lg space-y-2">
                <div className="text-xs text-slate-400">Request: <span className="text-white font-medium">{existingRequest?.title}</span></div>
                <div className="text-xs text-slate-300 italic">{existingRequest?.reason}</div>
                <div className="text-xs text-purple-400 font-medium">Contractor: {existingRequest?.contractorName}</div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Project Director / LAO Review Sign-off Note</label>
                <textarea
                  rows={3}
                  value={officerComment}
                  onChange={(e) => setOfficerComment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs"
                  placeholder="Enter authority review remarks and validation notes..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleReview('REJECTED')}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-rose-600/20 border border-rose-500/40 text-rose-300 hover:bg-rose-600/30 text-xs font-medium flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleReview('APPROVED')}
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-emerald-900/30"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Create Design v2
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
