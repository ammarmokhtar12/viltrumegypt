import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only protect the admin dashboard routes, not the login page itself
  if (request.nextUrl.pathname.startsWith('/admin/dashboard')) {
    const session = request.cookies.get('admin_session');
    
    // Basic check if cookie exists.
    // The actual signature verification happens in the /api/admin/check route or layout,
    // but this middleware stops obvious unauthorized access at the edge.
    if (!session || !session.value) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }
}

export const config = {
  matcher: ['/admin/dashboard/:path*'],
};
