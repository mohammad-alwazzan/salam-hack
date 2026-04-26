import { tool } from 'ai';
import { z } from 'zod';
import { alertsService } from '../../alerts/alerts.service';

export const getAlerts = tool({
  description:
    'Fetch current proactive alerts ordered by severity: overdue bills (highest), upcoming bills within 7 days, budget categories at 90%+ of allocation, recurring transaction patterns, and Eid seasonal remittance reminders. Surface the single most important alert naturally in conversation — never read out a list of warnings.',
  inputSchema: z.object({}),
  execute: async () => {
    const alerts = await alertsService.getAlerts();
    return { alerts };
  },
});
