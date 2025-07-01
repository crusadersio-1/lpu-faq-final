import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Get the session
    const { data: { session }, error } = await supabase.auth.getSession();
    const path = req.nextUrl.pathname;

    // Handle login page access
    if (path === '/auth/login') {
      if (session) {
        // If user is already logged in, redirect to admin
        return NextResponse.redirect(new URL('/admin', req.url));
      }
      return res;
    }

    // Protect admin routes
    if (path.startsWith('/admin')) {
      if (!session) {
        // If no session, redirect to login
        return NextResponse.redirect(new URL('/auth/login', req.url));
      }
      return res;
    }

    // Allow access to root path and all other routes
    return res;
  } catch (error) {
    console.error('Middleware error:', error);
    return res;
  }
}

// Configure middleware to run only on specific paths
export const config = {
  matcher: ['/admin/:path*', '/auth/login']
}; 