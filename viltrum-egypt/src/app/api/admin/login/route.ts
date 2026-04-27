import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: "Admin password not configured" },
        { status: 500 }
      );
    }

    if (password === adminPassword) {
      // Generate a cryptographically signed session token
      const token = crypto.randomBytes(32).toString("hex");
      const secret = process.env.ADMIN_SESSION_SECRET || adminPassword;
      const signature = crypto
        .createHmac("sha256", secret)
        .update(token)
        .digest("hex");
      const sessionValue = `${token}.${signature}`;

      const response = NextResponse.json({ success: true });
      response.cookies.set("admin_session", sessionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
