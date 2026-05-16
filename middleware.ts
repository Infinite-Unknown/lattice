import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes anyone can hit without a session.
const PUBLIC_PATHS = [
  '/sign-in',
  '/sign-up',
  '/api/auth/signup',
  '/api/auth/session',  // POST idToken → session cookie
  '/api/auth/signout',
  '/api/auth/me',       // returns null user when not signed in
  '/api/auth/account',  // tells the sign-in form which account id to use
];

const COOKIE_NAME = 'lattice_session';

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Pass through static assets + favicon etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  // Public routes — always allowed
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Everything else requires a session cookie. We don't validate the cookie's
  // contents here (the API/page handlers do) — middleware just gates entry.
  const hasCookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!hasCookie) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = '/sign-in';
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
