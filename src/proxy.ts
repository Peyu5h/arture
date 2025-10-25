import { NextResponse, type NextRequest } from "next/server";

export default async function authMiddleware(request: NextRequest) {
  // Skip middleware for API routes completely
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Public paths that don't require authentication
  const publicPaths = ["/sign-in", "/sign-up", "/onboarding"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path),
  );

  // Skip middleware for public paths
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for auth cookie to determine if user is authenticated
  // Better Auth uses different cookie names, let's check for any auth-related cookie
  const hasAuthCookie = request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.includes("better-auth") ||
        cookie.name.includes("session") ||
        cookie.name.includes("auth"),
    );

  if (!hasAuthCookie) {
    // Redirect to onboarding if no auth cookie found
    const onboardingUrl = new URL("/onboarding", request.url);
    onboardingUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(onboardingUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths except static files and favicon
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};

export const middleware = authMiddleware;
