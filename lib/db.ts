import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set.');
}

// HTTP-based connection — safe for serverless / Vercel Edge
const sql = neon(process.env.DATABASE_URL);

export default sql;
