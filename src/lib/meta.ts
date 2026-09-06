/* eslint-disable @typescript-eslint/no-explicit-any */
export type MetaEventName =
  | "ViewContent"
  | "AddToCart"
  | "AddToWishlist"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase";

export interface MetaEventProperties {
  value?: number;
  currency?: string;
  content_type?: string;
  content_ids?: (string | number)[];
  content_name?: string;
  contents?: { id: string | number; quantity: number; item_price?: number }[];
  num_items?: number;
}

export function trackMetaEvent(event: MetaEventName, properties?: MetaEventProperties) {
  try {
    if (typeof window !== "undefined" && (window as any).fbq) {
      (window as any).fbq("track", event, properties);
    }
  } catch (e) {
    console.warn("Meta Pixel track error:", e);
  }
}
