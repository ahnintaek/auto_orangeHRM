import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`필수 환경변수 누락: ${name} (.env.example 참고)`);
  return value;
}

export const env = {
  baseURL: process.env.BASE_URL ?? 'http://localhost:8080',
  isCI: !!process.env.CI,
  adminId: required('ADMIN_ID'),
  adminPw: required('ADMIN_PW'),
  adminEmail: required('ADMIN_EMAIL'),
  adminFirstName: process.env.ADMIN_FIRST_NAME ?? 'ahn',
  adminLastName: process.env.ADMIN_LAST_NAME ?? 'intaek',
};