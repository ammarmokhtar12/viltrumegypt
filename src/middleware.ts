import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Admin + Command Center: require admin_session cookie
  if (request.nextUrl.pathname.startsWith('/admin/dashboard') || request.nextUrl.pathname.startsWith('/command-center')) {
    const session = request.cookies.get('admin_session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  // Media Buyer dashboard: require mb_session cookie
  if (request.nextUrl.pathname.startsWith('/media-buyer/dashboard')) {
    const session = request.cookies.get('mb_session');
    if (!session?.value) {
      return NextResponse.redirect(new URL('/media-buyer', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/command-center/:path*', '/media-buyer/dashboard/:path*'],
};
