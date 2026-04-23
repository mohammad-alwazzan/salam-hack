import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";

const sqlite = new Database("sqlite.db", { create: true });
const db = drizzle({ client: sqlite, schema: {} });

export default db;
