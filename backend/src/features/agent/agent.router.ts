import Elysia from 'elysia';
import { agentService } from './agent.service';
import { z } from 'zod';
import { convertToModelMessages } from 'ai';

export const agentRouter = new Elysia({ prefix: '/agent' }).post(
  '/chat',
  async ({ body }) => {
    const messages = await convertToModelMessages(body.messages);

    const result = agentService.streamChat(messages);
    return (await result).toUIMessageStreamResponse();
  },
  {
    body: z.object({
      messages: z.array(z.any()),
    }),
    detail: {
      summary: 'Stream a chat response from Gemini',
      tags: ['Agent'],
    },
  },
);
