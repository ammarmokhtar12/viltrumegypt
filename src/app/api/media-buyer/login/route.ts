import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json();
    const mbPassword = process.env.MEDIA_BUYER_PASSWORD;

    if (!mbPassword) {
      return NextResponse.json(
        { error: "Media buyer password not configured" },
        { status: 500 }
      );
    }

    if (password === mbPassword) {
      const token = crypto.randomBytes(32).toString("hex");
      const secret = process.env.ADMIN_SESSION_SECRET || mbPassword;
      const signature = crypto
        .createHmac("sha256", secret)
        .update(`mb_${token}`)
        .digest("hex");
      const sessionValue = `${token}.${signature}`;

      const response = NextResponse.json({ success: true });
      response.cookies.set("mb_session", sessionValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
