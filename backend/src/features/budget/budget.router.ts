import { Elysia, t } from 'elysia';
import { budgetService } from './budget.service';

export const budgetRouter = new Elysia({ prefix: '/budget' })
  .group('', (app) => 
    app
      .get('/', () => budgetService.getCurrentBudget(), {
        detail: {
          summary: 'Get current budget',
          description: 'Fetch the current month budget summary, including per-category spent and remaining amounts.',
          tags: ['Budget']
        }
      })
      .get('/impact', ({ query }) => budgetService.getPurchaseImpact(Number(query.amount)), {
        query: t.Object({
          amount: t.Numeric({ description: 'The cost of the potential purchase' })
        }),
        detail: {
          summary: 'Check purchase impact',
          description: 'Calculates how a potential purchase would affect the remaining budget in its category.',
          tags: ['Budget']
        }
      })
      .post('/', ({ body }) => {
        const { month, totalIncome, categories } = body;
        return budgetService.upsertBudget({ month, totalIncome }, categories);
      }, {
        body: t.Object({
          month: t.String({ example: '2026-04' }),
          totalIncome: t.Number({ example: 12000 }),
          categories: t.Array(t.Object({
            name: t.String({ example: 'Food' }),
            type: t.Enum({ fixed: 'fixed', discretionary: 'discretionary' }),
            allocated: t.Number({ example: 2000 }),
            priority: t.Number({ example: 2 }),
            emoji: t.String({ example: '🍲' })
          }))
        }),
        detail: {
          summary: 'Setup or update budget',
          description: 'Creates or updates the budget month and its categories. Used during onboarding or month start.',
          tags: ['Budget']
        }
      })
  );
