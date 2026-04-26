import { Elysia, t } from 'elysia';
import { bankAccountsService } from './bankAccounts.service';

export const bankAccountsRouter = new Elysia({ prefix: '/bank-accounts' })
  .group('', (app) => 
    app
      .get('/', () => bankAccountsService.getAllAccounts(), {
        detail: {
          summary: 'List all bank accounts',
          description: 'Returns a list of all bank accounts with their current balances and types.',
          tags: ['Bank Accounts']
        }
      })
      .get('/:id', ({ params: { id } }) => bankAccountsService.getById(id), {
        params: t.Object({
          id: t.Numeric({ description: 'The unique ID of the bank account' })
        }),
        detail: {
          summary: 'Get account details',
          description: 'Fetches detailed information for a single bank account by its ID.',
          tags: ['Bank Accounts']
        }
      })
      .post('/', ({ body }) => bankAccountsService.create(body), {
        body: t.Object({
          name: t.String({ example: 'Main Checking' }),
          bank: t.String({ example: 'Alinma Bank' }),
          balance: t.Number({ example: 5000 }),
          currency: t.Optional(t.String({ default: 'USD', example: 'USD' })),
          type: t.Enum({
            checking: 'checking',
            savings: 'savings',
            remittance: 'remittance'
          }, { description: 'The type of bank account' })
        }),
        detail: {
          summary: 'Create account',
          description: 'Registers a new bank account in the system.',
          tags: ['Bank Accounts']
        }
      })
  );
