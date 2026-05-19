import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let _db: Db | undefined;

function getDb(): Db {
  if (!_db) {
    const sql = neon(process.env.DATABASE_URL!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

// Lazy proxy — DB is only initialized on first actual use (at request time),
// not at module import time, so builds without DATABASE_URL succeed.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const d = getDb();
    const value = Reflect.get(d as object, prop, receiver);
    return typeof value === "function" ? (value as Function).bind(d) : value;
  },
});
