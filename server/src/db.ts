import mysql from 'mysql2/promise';
import { config } from './config';

export const pool = mysql.createPool(config.db);

export async function rows<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const [r] = await pool.query(sql, params);
  return r as T[];
}

export async function one<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await rows<T>(sql, params))[0];
}

export async function run(sql: string, params: unknown[] = []): Promise<mysql.ResultSetHeader> {
  const [r] = await pool.query(sql, params);
  return r as mysql.ResultSetHeader;
}
