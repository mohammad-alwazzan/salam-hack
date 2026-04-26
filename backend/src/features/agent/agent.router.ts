import Elysia, { t } from 'elysia';
import { agentService } from './agent.service';

export const agentRouter = new Elysia({ prefix: '/agent' })
  .group('', (app) => 
    app
      .post('/chat', async ({ body }) => {
        const result = await agentService.streamChat(body.messages);
        return result.toUIMessageStreamResponse();
      }, {
        body: t.Object({
          messages: t.Array(t.Any(), { description: 'Array of chat messages' })
        }),
        detail: {
          summary: 'Chat with Mizan',
          description: 'Streams a conversation with Mizan, the financial AI agent.',
          tags: ['Agent']
        }
      })
  );
