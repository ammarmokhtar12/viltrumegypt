import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.set("mb_session", "", {
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}
