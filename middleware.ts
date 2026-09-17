import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) return NextResponse.next();

  // Login page is always accessible
  if (pathname === '/admin/login') return NextResponse.next();

  const cookie = req.cookies.get('admin_session')?.value;
  const secret = process.env.ADMIN_SECRET;

  if (!secret || !cookie || cookie !== secret) {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
