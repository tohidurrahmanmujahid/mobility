import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Extract subdomain
  const subdomain = hostname.split('.')[0];

  // // Handle admin subdomain
  // if (subdomain === 'admin') {
  //   // Redirect root to admin login
  //   if (url.pathname === '/') {
  //     url.pathname = '/login';
  //     return NextResponse.redirect(url);
  //   }

  //   // Redirect old login to admin login
  //   if (url.pathname === '/login') {
  //     url.pathname = '/login';
  //     return NextResponse.redirect(url);
  //   }

  //   // Block access to dealer routes
  //   if (url.pathname.startsWith('/dealer')) {
  //     url.pathname = '/login';
  //     return NextResponse.redirect(url);
  //   }

  //   // Allow admin routes
  //   if (url.pathname.startsWith('/admin') || url.pathname.startsWith('/dealer') || url.pathname.startsWith('/api')) {
  //     return NextResponse.next();
  //   }
  // }

  // // Handle dealer/partner subdomain
  // if (subdomain === 'dealer' || subdomain === 'partner') {
  //   // Redirect root to dealer login
  //   if (url.pathname === '/') {
  //     url.pathname = '/login';
  //     return NextResponse.redirect(url);
  //   }

  //   // Redirect old login to dealer login
  //   if (url.pathname === '/login') {
  //     url.pathname = '/login';
  //     return NextResponse.redirect(url);
  //   }

  //   // Block access to admin routes (except API)
  //   if (url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api')) {
  //     url.pathname = '/login';
  //     return NextResponse.redirect(url);
  //   }

  //   // Allow dealer routes and API
  //   if (url.pathname.startsWith('/dealer') || url.pathname.startsWith('/api')) {
  //     return NextResponse.next();
  //   }
  // }

  // // For main domain (no subdomain or www)
  // if (subdomain === 'www' || hostname.indexOf('.') === -1) {
  //   // Default behavior - show general login or redirect to appropriate subdomain
  //   if (url.pathname === '/') {
  //     // You can redirect to a landing page or default login
  //     url.pathname = '/login';
  //     return NextResponse.redirect(url);
  //   }
  // }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg)$).*)',
  ],
};