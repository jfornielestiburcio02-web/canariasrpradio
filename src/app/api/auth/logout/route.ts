
import { NextResponse } from 'next/server';
import { logout } from '@/app/lib/auth-utils';

export async function GET(request: Request) {
  await logout();
  return NextResponse.redirect(new URL('/', request.url));
}
