import { Elysia, t } from 'elysia';
import { transfersService } from './transfers.service';

export const transfersRouter = new Elysia({ prefix: '/transfers' })
  .group('', (app) => 
    app
      .get('/', () => transfersService.getAllTransfers(), {
        detail: {
          summary: 'List transfers',
          description: 'Fetch history of all fund transfers between accounts.',
          tags: ['Transfers']
        }
      })
      .post('/', ({ body }) => transfersService.execute(body as any), {
        body: t.Object({
          fromBankAccountId: t.Number({ description: 'Source account ID' }),
          amount: t.Number({ example: 500 }),
          recipient: t.String({ example: 'Mama' }),
          note: t.Optional(t.String({ example: 'Monthly support' }))
        }),
        detail: {
          summary: 'Execute a transfer',
          description: 'Moves funds from one account to a recipient and logs the transaction.',
          tags: ['Transfers']
        }
      })
  );
