import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Add routes that require authentication
    const protectedPaths = ['/dashboard', '/inventory', '/billing']

    const isProtectedPath = protectedPaths.some(path =>
        request.nextUrl.pathname.startsWith(path)
    )

    if (isProtectedPath) {
        // We cannot access localStorage here, but if the app used cookies for auth 
        // we would check them. Since the frontend uses localStorage, 
        // true protection needs to happen on the client. 
        // This is a minimal stub in case they switch to cookies.
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/dashboard/:path*', '/inventory/:path*', '/billing/:path*'],
}
