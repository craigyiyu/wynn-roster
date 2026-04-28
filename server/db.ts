import sql from 'mssql';

export const dbConfig = {
  user: 'SA',
  password: 'AT65gcfdjp',
  database: 'wynnai',
  server: '8.130.98.152',
  port: 2433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(dbConfig);
  }
  return pool;
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.close();
    pool = null;
  }
}

export { sql };
