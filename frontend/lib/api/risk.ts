import { http, isBackendConfigured } from './httpClient';
import { getMockRisk } from '@/lib/mock';
import { simulateWhatIf } from '@/lib/simulation/whatIf';
import type { RiskScore, RiskDriver, WhatIfLever } from '@/types';

export interface RiskFactorItem {
  id: string;
  projectId: string;
  factorName: string;
  category: string;
  score: number;
  weight: number;
  description?: string;
  mitigation?: string;
}

export interface RiskExplainResponse {
  projectId: string;
  projectName: string;
  riskScore: number;
  riskBand: string;
  predictedDelay: string;
  confidence: number;
  features: Record<string, any>;
  drivers: RiskDriver[];
  categories: { name: string; pct: number }[];
  decisionSupportStatement: string;
}

export const riskApi = {
  getProjectRisk: async (projectId: string): Promise<RiskScore | undefined> => {
    if (!isBackendConfigured()) {
      return getMockRisk(projectId);
    }
    return http.get<RiskScore>(`/api/v1/projects/${projectId}/risk`);
  },

  getRiskDrivers: async (projectId: string): Promise<RiskDriver[]> => {
    if (!isBackendConfigured()) {
      return getMockRisk(projectId)?.drivers ?? [];
    }
    return http.get<RiskDriver[]>(`/api/v1/projects/${projectId}/risk/drivers`);
  },

  getRiskFactors: async (projectId: string): Promise<RiskFactorItem[]> => {
    if (!isBackendConfigured()) {
      return [];
    }
    return http.get<RiskFactorItem[]>(`/api/v1/projects/${projectId}/risk/factors`);
  },

  explainRisk: async (projectId: string): Promise<RiskExplainResponse | undefined> => {
    if (!isBackendConfigured()) {
      const r = getMockRisk(projectId);
      if (!r) return undefined;
      return {
        projectId,
        projectName: 'Infrastructure Corridor',
        riskScore: r.overallPct,
        riskBand: r.band,
        predictedDelay: r.predictedDelayLabel,
        confidence: r.confidencePct,
        features: {},
        drivers: r.drivers,
        categories: r.categories,
        decisionSupportStatement: 'AI PREDICTION · HUMAN DECISION REQUIRED',
      };
    }
    return http.get<RiskExplainResponse>(`/api/v1/projects/${projectId}/risk/explain`);
  },

  recalculateRisk: async (projectId: string): Promise<RiskScore> => {
    if (!isBackendConfigured()) {
      return getMockRisk(projectId)!;
    }
    return http.post<RiskScore>(`/api/v1/projects/${projectId}/risk/recalculate`);
  },

  runWhatIf: async (projectId: string, leverIds: WhatIfLever['id'][]): Promise<WhatIfLever[]> => {
    if (!isBackendConfigured()) {
      return simulateWhatIf(projectId, leverIds);
    }
    return http.post<WhatIfLever[]>(`/api/v1/projects/${projectId}/what-if`, { leverIds });
  },
};
