import { tool } from 'ai';
import { z } from 'zod';
import { alertsService } from '../../alerts/alerts.service';

export const getAlerts = tool({
  description:
    'Fetch current proactive alerts: upcoming bills due soon, budget categories that are nearly or fully exhausted, and detected recurring transaction patterns. Use this to surface insights the user did not ask for — mention the most important one naturally in conversation, not as a list of warnings.',
  inputSchema: z.object({}),
  execute: async () => {
    const alerts = await alertsService.getAlerts();
    return { alerts };
  },
});
