import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

migrate(db, { migrationsFolder: './drizzle' })
  .then(() => {
    return pool.end();
  })
  .catch((err: unknown) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
