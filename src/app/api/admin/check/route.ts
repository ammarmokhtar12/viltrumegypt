import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

function verifySession(sessionValue: string): boolean {
  try {
    const [token, signature] = sessionValue.split(".");
    if (!token || !signature) return false;

    const secret =
      process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD;
    if (!secret) return false;

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(token)
      .digest("hex");

    // Timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  const session = request.cookies.get("admin_session");

  if (session?.value && verifySession(session.value)) {
    return NextResponse.json({ authenticated: true });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
