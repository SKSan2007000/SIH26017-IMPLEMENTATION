export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string; // lucide-react icon name
  badge?: number | string;
  roles?: string[]; // Allowed roles or undefined for all authorized
  built: boolean;
}

export interface NavGroup {
  group: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    group: 'Role Dashboards & Portals',
    items: [
      { id: 'admin', label: 'Admin Control Center', href: '/admin', icon: 'ShieldCheck', roles: ['SUPER_ADMIN'], built: true },
      { id: 'project-head', label: 'Project Head Portfolio', href: '/dashboard/project-head', icon: 'LayoutDashboard', built: true },
      { id: 'district', label: 'District Operations', href: '/dashboard/district', icon: 'Building2', built: true },
      { id: 'lao', label: 'LAO Acquisition Queue', href: '/dashboard/land-acquisition', icon: 'Layers', built: true },
      { id: 'field', label: 'Field Verification (Mobile)', href: '/dashboard/field', icon: 'Smartphone', badge: '14', built: true },
      { id: 'supervisor', label: 'Supervisor Approvals', href: '/dashboard/supervisor', icon: 'UserCheck', built: true },
      { id: 'contractor-portal', label: 'Contractor Portal', href: '/portal/contractor', icon: 'HardHat', built: true },
      { id: 'citizen-portal', label: 'Citizen Services', href: '/portal/citizen', icon: 'Users', built: true },
    ],
  },
  {
    group: 'Geospatial Intelligence & AI',
    items: [
      { id: 'gis', label: '2D GIS Command', href: '/gis', icon: 'Map', built: true },
      { id: 'twin', label: '3D Project Twin', href: '/twin', icon: 'Box', built: true },
      { id: 'route', label: 'Multi-Design Studio', href: '/route-planning', icon: 'Route', built: true },
      { id: 'risk', label: 'AI Delay Risk Engine', href: '/risk', icon: 'BrainCircuit', built: true },
    ],
  },
  {
    group: 'Operations & Redressal',
    items: [
      { id: 'operations', label: 'Daily Operations & Closed-Loop', href: '/operations', icon: 'Activity', badge: 'LIVE', built: true },
      { id: 'stakeholders', label: 'Stakeholders', href: '/stakeholders', icon: 'Users', built: true },
      { id: 'field-ops', label: 'Cadastral Ground Truth', href: '/field', icon: 'ClipboardCheck', built: true },
      { id: 'documents', label: 'Documents Vault', href: '/documents', icon: 'Files', built: true },
      { id: 'citizen', label: 'Citizen Reports', href: '/citizen', icon: 'Megaphone', built: true },
    ],
  },
  {
    group: 'System & Governance',
    items: [
      { id: 'reports', label: 'Reports & Export', href: '/reports', icon: 'FileSpreadsheet', built: true },
      { id: 'notifications', label: 'Notifications', href: '/notifications', icon: 'Bell', badge: 5, built: true },
      { id: 'officers', label: 'Officer Incentives', href: '/officers', icon: 'Award', built: true },
      { id: 'audit', label: 'SHA-256 Audit Vault', href: '/audit', icon: 'History', built: true },
      { id: 'settings', label: 'Settings', href: '/settings', icon: 'Settings', built: true },
    ],
  },
];
