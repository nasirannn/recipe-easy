import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

export type PgClientLike = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

declare global {
  // eslint-disable-next-line no-var
  var __recipeEasyPgPool: Pool | undefined;
}

function sanitizeConnectionString(raw: string): string {
  try {
    const url = new URL(raw);
    // `channel_binding` is a libpq option and can break JS clients.
    url.searchParams.delete('channel_binding');
    // Keep current pg behavior explicit and silence upcoming pg v9 warning.
    const sslmode = (url.searchParams.get('sslmode') || '').toLowerCase();
    if (sslmode === 'prefer' || sslmode === 'require' || sslmode === 'verify-ca') {
      url.searchParams.set('sslmode', 'verify-full');
    }
    return url.toString();
  } catch {
    return raw;
  }
}

function resolveConnectionString(): string {
  const value =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.NEON_DATABASE_URL ||
    '';

  if (!value) {
    throw new Error(
      'Postgres connection is not configured. Set DATABASE_URL (or POSTGRES_URL/NEON_DATABASE_URL).'
    );
  }

  return sanitizeConnectionString(value);
}

function createPool(): Pool {
  return new Pool({
    connectionString: resolveConnectionString(),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });
}

export function getPostgresPool(): Pool {
  if (!globalThis.__recipeEasyPgPool) {
    globalThis.__recipeEasyPgPool = createPool();
  }
  return globalThis.__recipeEasyPgPool;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return getPostgresPool().query<T>(text, params);
}

export async function withPgTransaction<T>(
  handler: (client: PoolClient) => Promise<T>
): Promise<T> {
  const pool = getPostgresPool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const result = await handler(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
