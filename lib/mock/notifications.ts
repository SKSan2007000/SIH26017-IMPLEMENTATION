import type { NotificationItem } from '@/types';
import { MOCK_PROJECTS } from './projects';
import { intBetween, mulberry32, pick } from './_generators';

const CATEGORIES: NotificationItem['category'][] = [
  'Critical Delay Risk', 'Document Missing', 'Legal Dispute', 'Compensation Delay',
  'Stakeholder Response', 'Verification Pending', 'Approval Delay', 'Field Task', 'Project Deadline',
];
const SEVERITIES: NotificationItem['severity'][] = ['Critical', 'High', 'Medium', 'Low'];

function messageFor(category: NotificationItem['category'], projectName: string): string {
  const M: Record<NotificationItem['category'], string> = {
    'Critical Delay Risk': `${projectName} crossed critical delay-risk threshold (DEMO alert).`,
    'Document Missing': `Ownership document missing for a parcel on ${projectName} (DEMO).`,
    'Legal Dispute': `New legal dispute flagged on ${projectName} (DEMO).`,
    'Compensation Delay': `Compensation disbursal overdue on ${projectName} (DEMO).`,
    'Stakeholder Response': `Stakeholder has not responded in 14 days on ${projectName} (DEMO).`,
    'Verification Pending': `Field verification pending supervisor review on ${projectName} (DEMO).`,
    'Approval Delay': `Approval stage overdue on ${projectName} (DEMO).`,
    'Field Task': `New field verification task assigned on ${projectName} (DEMO).`,
    'Project Deadline': `Target completion date approaching for ${projectName} (DEMO).`,
  };
  return M[category];
}

function generate(): NotificationItem[] {
  const rng = mulberry32(310442);
  return Array.from({ length: 22 }).map((_, i) => {
    const project = pick(rng, MOCK_PROJECTS);
    const category = pick(rng, CATEGORIES);
    return {
      id: `NTF-${i + 1}`,
      category,
      severity: pick(rng, SEVERITIES),
      message: messageFor(category, project.name),
      projectId: project.id,
      timestamp: `2026-08-${String(intBetween(rng, 20, 30)).padStart(2, '0')}T${String(intBetween(rng, 7, 19)).padStart(2, '0')}:${String(intBetween(rng, 0, 59)).padStart(2, '0')}`,
      read: rng() > 0.6,
    };
  });
}

export const MOCK_NOTIFICATIONS: NotificationItem[] = generate();
