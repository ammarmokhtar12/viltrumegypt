"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, X, MapPin } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface OrderItem {
  title: string;
  quantity: number;
  bundle_label?: string;
}

interface ProofOrder {
  customer_name: string;
  customer_address: string;
  items: OrderItem[];
  created_at: string;
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function getCity(address: string): string {
  const governorates = [
    "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "الشرقية", "المنوفية",
    "الغربية", "كفر الشيخ", "البحيرة", "المنيا", "أسيوط", "سوهاج",
    "قنا", "الأقصر", "أسوان", "الفيوم", "بني سويف", "بورسعيد",
    "دمياط", "الإسماعيلية", "السويس", "القليوبية",
    "Cairo", "Giza", "Alexandria", "Mansoura", "Tanta",
  ];
  for (const gov of governorates) {
    if (address.includes(gov)) return gov;
  }
  const parts = address.split(/[-,،]/);
  return parts[0]?.trim().substring(0, 20) || "Egypt";
}

function formatItems(items: OrderItem[]): string {
  if (!items || items.length === 0) return "an item";

  const hasBundle = items.some(i => i.bundle_label);
  if (hasBundle) {
    const bundleItems = items.filter(i => i.bundle_label);
    const names = bundleItems.map(i => i.title.replace(/\s+/g, " ").trim()).slice(0, 2);
    return `${names.join(" + ")} Bundle`;
  }

  if (items.length === 1) {
    return items[0].title.replace(/\s+/g, " ").trim();
  }

  return `${items[0].title.trim()} + ${items.length - 1} more`;
}

export default function SocialProofPopup() {
  const [order, setOrder] = useState<ProofOrder | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from("orders")
        .select("customer_name, customer_address, items, created_at")
        .in("status", ["delivered", "shipped", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (!data || data.length === 0) return;

      const randomOrder = data[Math.floor(Math.random() * data.length)];

      const firstName = randomOrder.customer_name.split(" ")[0];
      const faked: ProofOrder = {
        ...randomOrder,
        customer_name: firstName,
        created_at: new Date(
          Date.now() - Math.floor(Math.random() * 30 + 2) * 60000
        ).toISOString(),
      };
      setOrder(faked);
      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 8000);
    }, 10000);

    return () => clearTimeout(timer);
  }, [dismissed]);

  // Show another one every 30-60 seconds
  useEffect(() => {
    if (dismissed) return;
    if (!order) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("orders")
        .select("customer_name, customer_address, items, created_at")
        .in("status", ["delivered", "shipped", "confirmed"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (!data || data.length === 0) return;

      const randomOrder = data[Math.floor(Math.random() * data.length)];
      const firstName = randomOrder.customer_name.split(" ")[0];
      setOrder({
        ...randomOrder,
        customer_name: firstName,
        created_at: new Date(
          Date.now() - Math.floor(Math.random() * 45 + 3) * 60000
        ).toISOString(),
      });
      setVisible(true);
      setTimeout(() => setVisible(false), 8000);
    }, Math.random() * 30000 + 30000);

    return () => clearInterval(interval);
  }, [order, dismissed]);

  if (!order || dismissed) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 max-w-sm transition-all duration-500 ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-8 opacity-0 pointer-events-none"
      }`}
    >
      <div className="bg-surface/95 backdrop-blur-xl border border-border-light rounded-2xl p-4 shadow-2xl shadow-black/40">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center text-muted hover:text-foreground transition-colors"
        >
          <X size={12} />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-accent/10 border border-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={18} className="text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground leading-snug">
              {order.customer_name} ordered
            </p>
            <p className="text-[11px] text-secondary mt-0.5 truncate">
              {formatItems(order.items)}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="flex items-center gap-1 text-[10px] text-muted">
                <MapPin size={9} />
                {getCity(order.customer_address)}
              </span>
              <span className="text-[10px] text-muted/50">•</span>
              <span className="text-[10px] text-accent font-medium">
                {getTimeAgo(order.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-0.5 bg-border-light rounded-full overflow-hidden">
          <div
            className="h-full bg-accent rounded-full"
            style={{
              animation: visible ? "shrink 8s linear forwards" : "none",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
