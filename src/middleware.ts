import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("lakaut_token")?.value;

  if (!token) {
    const home = new URL("/?error=session_expired", req.url);
    return NextResponse.redirect(home);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/firmar"],
};
