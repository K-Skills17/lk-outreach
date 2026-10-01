import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, isValidAdminSession } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Login page is always accessible
  if (pathname === '/admin/login') return NextResponse.next();

  if (!(await isValidAdminSession(req.cookies.get(ADMIN_COOKIE)?.value))) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search   = '';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// /api/admin/* routes are not matched here — each handler calls requireAdmin()
// so it can answer with a JSON 401 instead of an HTML redirect.
export const config = {
  matcher: ['/admin/:path*'],
};
