import type { DatabaseConnectionPayload, SslMode } from '../types';

const SSL_MODES: SslMode[] = ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'];

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function isLocalHost(host: string): boolean {
  return ['localhost', '127.0.0.1', '::1', '[::1]'].includes(host.trim().toLowerCase());
}

/**
 * Reads a PostgreSQL connection string such as the one Supabase shows
 * (postgresql://postgres:[YOUR-PASSWORD]@db.xxxx.supabase.co:5432/postgres) into form fields.
 * A placeholder password in square brackets is left empty. Returns null when the text is not a connection string.
 */
export function parseConnectionString(raw: string): Partial<DatabaseConnectionPayload> | null {
  const match = /^postgres(?:ql)?:\/\/(?:([^:@/]*)(?::(.*))?@)?(\[[^\]]+\]|[^:/?#@]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?$/i.exec(
    raw.trim(),
  );
  if (!match) return null;
  const [, user, password, host, port, database, query] = match;
  const params = new URLSearchParams(query ?? '');
  const sslParam = params.get('sslmode') as SslMode | null;
  const cleanHost = host.replace(/^\[(.*)\]$/, '$1');
  const result: Partial<DatabaseConnectionPayload> = {
    host: cleanHost,
    port: port ? Number(port) : 5432,
    database: database ? decode(database) : 'postgres',
    sslMode: sslParam && SSL_MODES.includes(sslParam) ? sslParam : isLocalHost(cleanHost) ? 'disable' : 'require',
  };
  if (user) result.username = decode(user);
  if (password && !/^\[.*\]$/.test(password)) result.password = decode(password);
  return result;
}
