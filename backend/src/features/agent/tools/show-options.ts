import { tool } from 'ai';
import { z } from 'zod';

export const showOptions = tool({
  description:
    'Use this to provide the user with a set of quick actions or options they can select. This should be used when there are multiple logical next steps (e.g., "Would you like to pay this bill now or see your budget impact first?").',
  inputSchema: z.object({
    prompt: z.string().describe('The message to show the user alongside the options.'),
    options: z.array(z.string()).describe('The labels for the buttons to show the user.'),
  }),
  execute: async ({ prompt, options }) => {
    // This tool is primarily for UI feedback, but we return the structured data
    return { prompt, options };
  },
});
