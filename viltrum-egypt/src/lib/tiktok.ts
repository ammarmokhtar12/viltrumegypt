/* eslint-disable @typescript-eslint/no-explicit-any */
export type TikTokEventName =
  | "ViewContent"
  | "AddToWishlist"
  | "Search"
  | "AddPaymentInfo"
  | "AddToCart"
  | "InitiateCheckout"
  | "PlaceAnOrder"
  | "CompleteRegistration"
  | "Purchase";

export interface TikTokEventProperties {
  value?: number;
  currency?: string;
  content_type?: string;
  content_id?: string | number;
  content_name?: string;
  contents?: {
    content_id?: string | number;
    content_type?: string;
    content_name?: string;
    quantity?: number;
    price?: number;
  }[];
  query?: string;
  search_string?: string;
  url?: string;
}

export interface TikTokUserData {
  email?: string;
  phone?: string;
  external_id?: string;
}

export async function trackTikTokEvent(
  event: TikTokEventName,
  properties?: TikTokEventProperties,
  user?: TikTokUserData,
  eventId?: string
) {
  try {
    const currentUrl = typeof window !== "undefined" ? window.location.href : properties?.url;
    const dedupeEventId = eventId || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `tt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);

    // 1. Trigger client-side pixel (ttq) if available (Hybrid Tracking)
    if (typeof window !== "undefined" && (window as any).ttq) {
      try {
        const clientProps = {
          ...properties,
          event_id: dedupeEventId,
          url: currentUrl,
        };
        (window as any).ttq.track(event, clientProps);
      } catch (e) {
        console.warn("TikTok client pixel track error:", e);
      }
    }

    // 2. Send to our Server-Side Events API route
    const res = await fetch("/api/tiktok/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        properties: {
          ...properties,
          url: currentUrl,
        },
        user,
        event_id: dedupeEventId,
        event_time: Math.floor(Date.now() / 1000),
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.warn("TikTok server track warning:", err);
    }
  } catch (error) {
    console.warn("TikTok track error:", error);
  }
}
