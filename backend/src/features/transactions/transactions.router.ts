import { Elysia, t } from 'elysia';
import { transactionsService } from './transactions.service';

export const transactionsRouter = new Elysia({ prefix: '/transactions' })
  .group('', (app) => 
    app
      .get('/', ({ query }) => {
        return transactionsService.getAllTransactions({
          bankAccountId: query.bankAccountId,
          categoryId: query.categoryId
        });
      }, {
        query: t.Object({
          bankAccountId: t.Optional(t.Numeric()),
          categoryId: t.Optional(t.Numeric())
        }),
        detail: {
          summary: 'List transactions',
          description: 'Fetch all transactions with optional filtering by bank account or budget category.',
          tags: ['Transactions']
        }
      })
      .post('/', ({ body }) => transactionsService.createTransaction(body as any), {
        body: t.Object({
          description: t.String({ example: 'Grocery shopping' }),
          amount: t.Number({ example: -120 }),
          bankAccountId: t.Number(),
          categoryId: t.Optional(t.Number()),
          source: t.Enum({ voice: 'voice', text: 'text', manual: 'manual' }),
          date: t.Optional(t.String())
        }),
        detail: {
          summary: 'Log a transaction',
          description: 'Records a new transaction (expense or income) and updates the bank account balance.',
          tags: ['Transactions']
        }
      })
  );
