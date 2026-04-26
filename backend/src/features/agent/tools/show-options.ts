import { tool } from 'ai';
import { z } from 'zod';

export const showOptions = tool({
  description:
    'Use this to provide the user with a set of quick-reply buttons they can tap. Use when there are multiple logical next steps (e.g., "Would you like to pay this bill now or see your budget impact first?").',
  inputSchema: z.object({
    title: z.string().describe('A short prompt shown above the buttons, e.g. "What would you like to do?"'),
    options: z
      .array(
        z.object({
          label: z.string().describe('The button label shown to the user.'),
          value: z.string().describe('The machine-readable value sent when the user taps this option.'),
        }),
      )
      .describe('The list of options to display as buttons.'),
  }),
  execute: async ({ title, options }) => {
    return { title, options };
  },
});
