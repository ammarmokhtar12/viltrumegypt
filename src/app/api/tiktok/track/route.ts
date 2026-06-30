/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { cookies, headers } from "next/headers";

async function hashSha256(str: string): Promise<string> {
  if (!str) return "";
  const trimmed = str.trim().toLowerCase();
  if (/^[a-f0-9]{64}$/.test(trimmed)) {
    return trimmed;
  }
  const buf = new TextEncoder().encode(trimmed);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { event, properties, user, event_id, event_time } = body;

    if (!event) {
      return NextResponse.json({ error: "Missing event name" }, { status: 400 });
    }

    const reqHeaders = await headers();
    const reqCookies = await cookies();

    const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip") || "";
    const user_agent = reqHeaders.get("user-agent") || "";
    const ttp = reqCookies.get("_ttp")?.value || reqCookies.get("ttp")?.value || "";
    const ttclid = reqCookies.get("ttclid")?.value || "";

    const hashedEmail = user?.email ? await hashSha256(user.email) : undefined;
    const hashedPhone = user?.phone ? await hashSha256(user.phone) : undefined;
    const hashedExternalId = user?.external_id ? await hashSha256(user.external_id) : undefined;

    const pixelId = process.env.TIKTOK_PIXEL_ID || "D85I6IRC77U26NJHKDKG";
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN || "da59f794422bff1cea1ca32bbfe22bd5b29cf626";

    const payload = {
      event_source: "web",
      event_source_id: pixelId,
      data: [
        {
          event,
          event_time: event_time || Math.floor(Date.now() / 1000),
          event_id: event_id || crypto.randomUUID(),
          user: {
            ttclid: ttclid || undefined,
            ttp: ttp || undefined,
            ip: ip || undefined,
            user_agent: user_agent || undefined,
            email: hashedEmail,
            phone: hashedPhone,
            external_id: hashedExternalId,
          },
          properties: {
            contents: properties?.contents || undefined,
            content_type: properties?.content_type || (properties?.contents?.length ? "product" : undefined),
            content_id: properties?.content_id || undefined,
            content_name: properties?.content_name || undefined,
            value: properties?.value || undefined,
            currency: properties?.currency || "EGP",
            query: properties?.query || properties?.search_string || undefined,
            search_string: properties?.search_string || properties?.query || undefined,
            url: properties?.url || undefined,
          },
        },
      ],
    };

    const tiktokRes = await fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const tiktokData = await tiktokRes.json();

    if (!tiktokRes.ok || tiktokData.code !== 0) {
      console.error("TikTok Events API Error:", tiktokData);
      return NextResponse.json({ error: tiktokData }, { status: tiktokRes.status === 200 ? 400 : tiktokRes.status });
    }

    return NextResponse.json({ success: true, data: tiktokData });
  } catch (error: any) {
    console.error("TikTok API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
