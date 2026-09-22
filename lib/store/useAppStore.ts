import { create } from 'zustand';
import type { Project, Parcel, Route, Stakeholder, VerificationCase, DocumentRecord, CitizenReport, DesignAlternative } from '@/types';
import { MOCK_PROJECTS } from '@/lib/mock/projects';
import { MOCK_PARCELS } from '@/lib/mock/parcels';
import { MOCK_STAKEHOLDERS } from '@/lib/mock/stakeholders';
import { MOCK_FIELD_CASES } from '@/lib/mock/fieldCases';
import { MOCK_DOCUMENTS } from '@/lib/mock/documents';
import { MOCK_CITIZEN_REPORTS } from '@/lib/mock/citizenReports';
import { MOCK_DESIGNS } from '@/lib/mock/designs';

export type MapLayerKey =
  | 'projects'
  | 'routes'
  | 'parcels'
  | 'risk'
  | 'stakeholders'
  | 'infrastructure'
  | 'fieldOfficers'
  | 'verification'
  | 'buildings'
  | 'corridorRibbon'
  | 'roadNetwork'
  | 'connectivityGaps';

interface AppState {
  // projects & entities
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  addProject: (p: Project) => void;

  // selection synchronizer
  selectedProjectId: string | null;
  selectedParcelId: string | null;
  selectedRouteId: string | null;
  selectedStakeholderId: string | null;
  selectedDesignId: string | null;
  selectedVersionNumber: number | null;
  compareDesignIds: string[];
  intelPanelOpen: boolean;

  setSelectedProject: (id: string | null) => void;
  setSelectedParcel: (id: string | null) => void;
  setSelectedRoute: (id: string | null) => void;
  setSelectedStakeholder: (id: string | null) => void;
  setSelectedDesign: (id: string | null) => void;
  setSelectedVersionNumber: (num: number | null) => void;
  setCompareDesignIds: (ids: string[]) => void;
  toggleCompareDesignId: (id: string) => void;
  setIntelPanelOpen: (open: boolean) => void;

  // designs state
  designs: DesignAlternative[];
  setDesigns: (designs: DesignAlternative[]) => void;

  // search & filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  stateFilter: string;
  districtFilter: string;
  riskFilter: 'all' | 'critical' | 'high' | 'medium' | 'low';
  setStateFilter: (v: string) => void;
  setDistrictFilter: (v: string) => void;
  setRiskFilter: (v: AppState['riskFilter']) => void;

  // map layers (per view)
  layers: Record<'command' | 'gis' | 'twin', Record<MapLayerKey, boolean>>;
  toggleLayer: (view: 'command' | 'gis' | 'twin', layer: MapLayerKey) => void;

  // 2D/3D mode + sidebar
  twinMode: '2d' | '3d' | 'satellite';
  setTwinMode: (m: AppState['twinMode']) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // simulation state (What-If)
  activeLevers: string[];
  toggleLever: (leverId: string) => void;
  resetLevers: () => void;

  // interactive workflow states
  fieldCases: VerificationCase[];
  assignOfficer: (caseId: string, officerRef: string) => void;
  updateCaseStatus: (caseId: string, status: VerificationCase['status']) => void;

  documents: DocumentRecord[];
  updateDocumentStatus: (docId: string, status: DocumentRecord['status']) => void;

  citizenReports: CitizenReport[];
  updateCitizenReportStatus: (reportId: string, status: CitizenReport['status']) => void;

  stakeholders: Stakeholder[];
  sendStakeholderNotification: (id: string) => void;

  // demo user role
  userRole: string;
  setUserRole: (r: string) => void;
}

const defaultLayers: Record<MapLayerKey, boolean> = {
  projects: true,
  routes: true,
  parcels: true,
  risk: true,
  stakeholders: true,
  infrastructure: true,
  fieldOfficers: true,
  verification: true,
  buildings: true,
  corridorRibbon: true,
  roadNetwork: true,
  connectivityGaps: true,
};

export const useAppStore = create<AppState>((set) => ({
  projects: MOCK_PROJECTS,
  setProjects: (projects) => set({ projects }),
  addProject: (p) =>
    set((s) => ({
      projects: [p, ...s.projects],
      selectedProjectId: p.id,
      selectedRouteId: p.selectedRouteId ?? `RT-${p.id}-C`,
      selectedDesignId: `DSG-${p.id}-D`,
    })),

  selectedProjectId: 'PRJ-1042',
  selectedParcelId: null,
  selectedRouteId: 'RT-1042-C',
  selectedStakeholderId: null,
  selectedDesignId: 'DSG-PRJ-1042-D',
  selectedVersionNumber: 1,
  compareDesignIds: ['DSG-PRJ-1042-A', 'DSG-PRJ-1042-B', 'DSG-PRJ-1042-C', 'DSG-PRJ-1042-D'],
  intelPanelOpen: false,

  designs: MOCK_DESIGNS,
  setDesigns: (designs) => set({ designs }),

  setSelectedProject: (id) =>
    set((s) => ({
      selectedProjectId: id,
      selectedParcelId: null,
      selectedRouteId: id ? (s.projects.find((p) => p.id === id)?.selectedRouteId ?? `RT-${id}-C`) : null,
      selectedStakeholderId: null,
      selectedDesignId: id ? `DSG-${id}-D` : null,
      selectedVersionNumber: 1,
      compareDesignIds: id
        ? [`DSG-${id}-A`, `DSG-${id}-B`, `DSG-${id}-C`, `DSG-${id}-D`]
        : [],
    })),
  setSelectedParcel: (id) => set({ selectedParcelId: id }),
  setSelectedRoute: (id) =>
    set((s) => ({
      selectedRouteId: id,
      projects: s.projects.map((p) => (p.id === s.selectedProjectId ? { ...p, selectedRouteId: id } : p)),
    })),
  setSelectedStakeholder: (id) => set({ selectedStakeholderId: id }),
  setSelectedDesign: (id) =>
    set((s) => ({
      selectedDesignId: id,
      selectedRouteId: id ? id.replace('DSG-', 'RT-') : s.selectedRouteId,
      selectedVersionNumber: 1,
    })),
  setSelectedVersionNumber: (num) => set({ selectedVersionNumber: num }),
  setCompareDesignIds: (ids) => set({ compareDesignIds: ids }),
  toggleCompareDesignId: (id) =>
    set((s) => ({
      compareDesignIds: s.compareDesignIds.includes(id)
        ? s.compareDesignIds.filter((d) => d !== id)
        : [...s.compareDesignIds, id],
    })),
  setIntelPanelOpen: (open) => set({ intelPanelOpen: open }),

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),

  stateFilter: 'Tamil Nadu',
  districtFilter: 'Chennai',
  riskFilter: 'all',
  setStateFilter: (v) => set({ stateFilter: v }),
  setDistrictFilter: (v) => set({ districtFilter: v }),
  setRiskFilter: (v) => set({ riskFilter: v }),

  layers: {
    command: { ...defaultLayers },
    gis: { ...defaultLayers },
    twin: { ...defaultLayers },
  },
  toggleLayer: (view, layer) =>
    set((s) => ({
      layers: {
        ...s.layers,
        [view]: {
          ...s.layers[view],
          [layer]: !s.layers[view][layer],
        },
      },
    })),

  twinMode: '3d',
  setTwinMode: (m) => set({ twinMode: m }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  activeLevers: [],
  toggleLever: (leverId) =>
    set((s) => ({
      activeLevers: s.activeLevers.includes(leverId) ? s.activeLevers.filter((l) => l !== leverId) : [...s.activeLevers, leverId],
    })),
  resetLevers: () => set({ activeLevers: [] }),

  fieldCases: MOCK_FIELD_CASES,
  assignOfficer: (caseId, officerRef) =>
    set((s) => ({
      fieldCases: s.fieldCases.map((c) => (c.id === caseId ? { ...c, officerRef, status: 'Assigned' } : c)),
    })),
  updateCaseStatus: (caseId, status) =>
    set((s) => ({
      fieldCases: s.fieldCases.map((c) => (c.id === caseId ? { ...c, status } : c)),
    })),

  documents: MOCK_DOCUMENTS,
  updateDocumentStatus: (docId, status) =>
    set((s) => ({
      documents: s.documents.map((d) => (d.id === docId ? { ...d, status } : d)),
    })),

  citizenReports: MOCK_CITIZEN_REPORTS,
  updateCitizenReportStatus: (reportId, status) =>
    set((s) => ({
      citizenReports: s.citizenReports.map((r) => (r.id === reportId ? { ...r, status } : r)),
    })),

  stakeholders: MOCK_STAKEHOLDERS,
  sendStakeholderNotification: (id) =>
    set((s) => ({
      stakeholders: s.stakeholders.map((sh) => (sh.id === id ? { ...sh, notificationStatus: 'SENT' } : sh)),
    })),

  userRole: 'Project Officer',
  setUserRole: (r) => set({ userRole: r }),
}));


