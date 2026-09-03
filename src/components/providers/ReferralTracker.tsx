"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function ReferralTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");

    if (ref) {
      const cleanRef = ref.trim().toUpperCase();

      const trackReferral = async () => {
        try {
          // Verify if the coupon code is active
          const { data, error } = await supabase
            .from("influencers")
            .select("id, coupon_code, status, clicks")
            .eq("coupon_code", cleanRef)
            .eq("status", "active")
            .maybeSingle();

          if (!error && data) {
            // Save to cookie with 30 days expiration
            const expires = new Date();
            expires.setDate(expires.getDate() + 30);
            
            // Set cookie
            document.cookie = `viltrum_ref=${cleanRef}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
            
            // Set localStorage for redundancy
            localStorage.setItem("viltrum_ref", cleanRef);
            
            // Increment clicks count in DB
            await supabase
              .from("influencers")
              .update({ clicks: (data.clicks || 0) + 1 })
              .eq("id", data.id);
              
            console.log(`[Referral] Code tracked & click registered: ${cleanRef}`);
          } else if (error) {
            console.warn("[Referral] Failed to validate referral code:", error.message);
          }
        } catch (err) {
          console.error("[Referral] Error in tracking:", err);
        }
      };

      trackReferral();
    }
  }, []);

  return null;
}
