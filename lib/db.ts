import { neon } from '@neondatabase/serverless';

// neon() is lazy — it only makes network calls when a query is executed,
// so instantiating with a placeholder at build time is safe.
// Set DATABASE_URL in Vercel project settings for the connection to work at runtime.
const sql = neon(
  process.env.DATABASE_URL ?? 'postgresql://build:placeholder@localhost/neondb',
);

export default sql;
