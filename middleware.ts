import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "./lib/utils/jwt";

const protectedPaths = ["/admin"];

const isProtectedPath = (pathname: string) =>
  protectedPaths.some((path) => pathname.startsWith(path));

const isTokenValidAndAdmin = async (token: string, secret: string | undefined) => {
  if (!secret) return false;
  const payload = await verifyJwt(token, secret);
  if (!payload) return false;

  const role =
    payload.role ||
    payload.roles?.[0] ||
    payload.authorities?.[0];

  return role?.toLowerCase() === "admin";
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("yemchi_admin_token")?.value;
  const jwtSecret = process.env.JWT_SECRET;

  if (!token || !(await isTokenValidAndAdmin(token, jwtSecret))) {
    const res = NextResponse.redirect(new URL("/auth", req.url));
    res.cookies.set({
      name: "yemchi_admin_token",
      value: "",
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
