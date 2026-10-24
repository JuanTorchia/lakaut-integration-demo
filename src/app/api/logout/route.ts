import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  (await cookies()).delete("lakaut_token");
  return NextResponse.redirect(new URL("/", req.url));
}
