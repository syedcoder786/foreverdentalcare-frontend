import { describe, expect, it } from 'vitest';
import { parseConnectionString } from '../utils/databaseUrl';

describe('parseConnectionString', () => {
  it('reads a Supabase URI and leaves the placeholder password empty', () => {
    expect(parseConnectionString('postgresql://postgres:[YOUR-DATABASE-PASSWORD]@db.nioxafchtoazqxcwqvnx.supabase.co:5432/postgres')).toEqual({
      host: 'db.nioxafchtoazqxcwqvnx.supabase.co',
      port: 5432,
      database: 'postgres',
      username: 'postgres',
      sslMode: 'require',
    });
  });

  it('decodes passwords, keeps @ inside them and reads sslmode', () => {
    expect(parseConnectionString('postgres://postgres.abc:p%40ss@w0rd@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=verify-full')).toMatchObject({
      username: 'postgres.abc',
      password: 'p@ss@w0rd',
      host: 'aws-0-ap-south-1.pooler.supabase.com',
      port: 6543,
      sslMode: 'verify-full',
    });
  });

  it('ignores line breaks and spaces from a wrapped copy, and keeps a raw % in the password', () => {
    const wrapped = 'postgresql://postgres.abc:pa%Zss\n@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
    const withSpace = 'postgresql://postgres.abc:pa%Zss @aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';
    for (const raw of [wrapped, withSpace]) {
      expect(parseConnectionString(raw)).toMatchObject({
        username: 'postgres.abc',
        password: 'pa%Zss',
        host: 'aws-0-ap-northeast-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
      });
    }
  });

  it('uses no SSL for localhost and rejects other text', () => {
    expect(parseConnectionString('postgresql://u:p@localhost/clinic')).toMatchObject({ host: 'localhost', port: 5432, database: 'clinic', sslMode: 'disable' });
    expect(parseConnectionString('mysql://u:p@host/db')).toBeNull();
  });
});
