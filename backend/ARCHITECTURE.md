# Architecture Spec: Rapid Iteration (Direct)

## Philosophy

This codebase is built for speed over premature abstraction. We leverage direct imports and concrete implementations to minimize the "files-per-feature" count and eliminate boilerplate tax.

- Zero DI/Container: Use exported singletons for services and repositories to avoid wiring overhead.
- Drizzle as Source of Truth: Types and validation schemas are inferred directly from the Drizzle database schema—no manual interfaces or Zod duplication.
- Feature Isolation: Code that changes together lives together.If a feature is deleted, only the main router registration should break.

### Stack

| Concern            | Tool    |
| ------------------ | ------- |
| Runtime            | Bun     |
| Framework          | Elysia  |
| ORM                | Drizzle |
| Validation + Types | Drizzle |

### Folder Structure

```
src/
├── core/
│   ├── db.ts               # Drizzle client instance
│   └── schema.ts           # Global Drizzle Table definitions (Source of Truth)
│
├── features/
│   └── <feature>/          # e.g., user, order, product
│       ├── <feature>.repository.ts  # Direct DB logic (Concrete Class)
│       ├── <feature>.service.ts     # Business logic (Concrete Class)
│       └── <feature>.router.ts      # Elysia routes (Uses Service Singleton)
│
└── index.ts                # App entry point (Register routers)
```

### Implementation Standards

1. `core/schema.ts` — The Ground TruthTables define the shapes for the entire app. Use drizzle-zod to bridge DB definitions to API validation instantly.

```ts
import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
});

// Auto-generated schemas for validation & types
export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

2. `<feature>.repository.ts` — Concrete Data AccessNo interfaces. Export a singleton. This is the only place where Drizzle query logic lives.

```ts
import { db } from '../../core/db';
import { users, type NewUser } from '../../core/schema';
import { eq } from 'drizzle-orm';

export class UserRepository {
  async findByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user ?? null;
  }

  async create(data: NewUser) {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }
}

export const userRepository = new UserRepository();
```

3. `<feature>.service.ts` — Business LogicImport the repository singleton directly. Handle domain-specific rules here.

```ts
import { userRepository } from './user.repository';
import type { NewUser } from '../../core/schema';

export class UserService {
  async register(data: NewUser) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw new Error('Email already taken');
    return userRepository.create(data);
  }
}

export const userService = new UserService();
```

4. `<feature>.router.ts` — Elysia PluginHandles HTTP concerns. Pass the insertUserSchema directly to the body property for automatic validation and OpenAPI docs.

```ts
import Elysia from 'elysia';
import { insertUserSchema, selectUserSchema } from '../../core/schema';
import { userService } from './user.service';

export const userRouter = new Elysia({ prefix: '/users' }).post(
  '/',
  ({ body }) => userService.register(body),
  {
    body: insertUserSchema,
    response: selectUserSchema,
  },
);
```

### Rules for Velocity

| Rule                    | Implementation                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------- |
| No Interfaces           | Never write an IUserRepository. Use concrete classes and direct exports.                |
| Direct Schema Inference | If the DB column changes, the API validation updates automatically via Drizzle-Zod.     |
| Singleton Pattern       | Services and Repositories are instantiated once and exported as constants.              |
| Minimal Mapping         | Pass Drizzle entities directly to the response unless sensitive fields must be omitted. |
