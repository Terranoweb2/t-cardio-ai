import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware désactivé pour le déploiement statique
export function middleware(request: NextRequest) {
  // Pour déploiement statique, le middleware est désactivé
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
