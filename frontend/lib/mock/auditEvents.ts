import type { AuditEvent } from '@/types';

// Hand-authored audit trail matching the exact demo sequence from the brief,
// scoped to the hero project.
export const MOCK_AUDIT_EVENTS: AuditEvent[] = [
  { id: 'AUD-1', projectId: 'PRJ-1042', time: '09:30', date: '2026-08-30', actor: 'R. Kannan (Project Officer)', label: 'Project intake & boundary definition initialized', category: 'System' },
  { id: 'AUD-2', projectId: 'PRJ-1042', time: '09:42', date: '2026-08-30', actor: 'AI Routing Engine', label: '4 candidate route corridors generated & costed', category: 'Route Selection' },
  { id: 'AUD-3', projectId: 'PRJ-1042', time: '10:03', date: '2026-08-30', actor: 'GIS Spatial Intersect', label: '327 cadastral parcels mapped to corridor alignment', category: 'Risk Assessment' },
  { id: 'AUD-4', projectId: 'PRJ-1042', time: '10:20', date: '2026-08-30', actor: 'R. Kannan (Project Officer)', label: 'Section 4(1) acquisition notices drafted & logged', category: 'Compensation' },
  { id: 'AUD-5', projectId: 'PRJ-1042', time: '11:15', date: '2026-08-30', actor: 'K. Anand (Field Supervisor)', label: 'Field verification assigned to OFC-Anand-R', category: 'Verification' },
  { id: 'AUD-6', projectId: 'PRJ-1042', time: '13:42', date: '2026-08-30', actor: 'OFC-Anand-R (Field Officer)', label: 'GPS coordinates & site photos uploaded for LG-P1024', category: 'Verification' },
  { id: 'AUD-7', projectId: 'PRJ-1042', time: '15:10', date: '2026-08-30', actor: 'K. Anand (Field Supervisor)', label: 'Field inspection verified with high boundary accuracy', category: 'Verification' },
  { id: 'AUD-8', projectId: 'PRJ-1042', time: '15:12', date: '2026-08-30', actor: 'AI Delay Engine', label: 'Delay probability recalculated (87% Critical, +5 months)', category: 'Risk Assessment' },
  { id: 'AUD-9', projectId: 'PRJ-1042', time: '16:45', date: '2026-08-30', actor: 'R. Kannan (Project Officer)', label: 'Route C (Minimum Delay) marked as AI Recommended option', category: 'Route Selection' },
];

export function getMockAuditByProject(projectId: string): AuditEvent[] {
  return MOCK_AUDIT_EVENTS.filter((e) => e.projectId === projectId);
}

