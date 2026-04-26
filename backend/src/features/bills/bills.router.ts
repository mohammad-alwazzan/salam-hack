import { Elysia, t } from 'elysia';
import { billsService } from './bills.service';

export const billsRouter = new Elysia({ prefix: '/bills' })
  .group('', (app) => 
    app
      .get('/', () => billsService.getAllBills(), {
        detail: {
          summary: 'List all bills',
          description: 'Fetch all registered bills, including paid and pending ones.',
          tags: ['Bills']
        }
      })
      .post('/', ({ body }) => billsService.createBill(body as any), {
        body: t.Object({
          title: t.String({ example: 'Internet Bill' }),
          description: t.Optional(t.String()),
          category: t.String({ example: 'Utilities' }),
          categoryId: t.Optional(t.Number({ example: 1 })),
          amount: t.Number({ example: 80 }),
          currency: t.Optional(t.String({ default: 'USD' })),
          dueDate: t.String({ description: 'ISO Date string', example: '2026-05-01' })
        }),
        detail: {
          summary: 'Create a bill',
          description: 'Add a new bill to the system for tracking.',
          tags: ['Bills']
        }
      })
      .post('/:id/pay', ({ params: { id }, body }) => {
        return billsService.payBill(id, body.bankAccountId);
      }, {
        params: t.Object({
          id: t.Numeric()
        }),
        body: t.Object({
          bankAccountId: t.Number({ description: 'The ID of the account to pay from' })
        }),
        detail: {
          summary: 'Pay a bill',
          description: 'Marks a bill as paid and deducts the amount from the specified bank account.',
          tags: ['Bills']
        }
      })
  );
