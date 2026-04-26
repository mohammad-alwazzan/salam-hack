import { Elysia } from 'elysia';
import { openapi } from '@elysiajs/openapi';
import { agentRouter } from './features/agent/agent.router';
import { bankAccountsRouter } from './features/bankAccounts/bankAccounts.router';
import { billsRouter } from './features/bills/bills.router';
import { budgetRouter } from './features/budget/budget.router';
import { transactionsRouter } from './features/transactions/transactions.router';
import cors from '@elysiajs/cors';

export const app = new Elysia({})
  .use(openapi())
  .use(cors({ origin: '*' }))
  .get('/', () => 'Hello Elysia')
  .get('/health', () => ({ status: 'ok' }))
  .use(agentRouter)
  .use(bankAccountsRouter)
  .use(billsRouter)
  .use(budgetRouter)
  .use(transactionsRouter);

app.listen(3001, () => {
  console.log(
    `Server is running at http://${app.server?.hostname}:${app.server?.port}`,
  );
  console.log(
    `OpenAPI Docs are running at http://${app.server?.hostname}:${app.server?.port}/openapi`,
  );
});

export type App = typeof app;
