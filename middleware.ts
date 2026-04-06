import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

const isDevPreview =
  process.env.DEV_PREVIEW === "true" && process.env.NODE_ENV !== "production";

export default isDevPreview
  ? () => NextResponse.next()
  : auth((req) => {
      const { pathname } = req.nextUrl;
      const isPublic =
        pathname.startsWith("/login") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/webhooks") ||
        pathname.startsWith("/api/booking") ||
        pathname.startsWith("/booking") ||
        pathname === "/";

      if (isPublic) return NextResponse.next();

      if (!req.auth) {
        const loginUrl = new URL("/login", req.nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    });

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
