"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { sendExchangeNotification } from "@/app/actions/notify";
import {
  ArrowLeft,
  Search,
  Loader2,
  Check,
  ArrowLeftRight,
  Package,
  ChevronRight,
  Truck,
  AlertCircle,
  X,
  Plus,
} from "lucide-react";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────
interface OrderItem {
  title: string;
  size: string;
  quantity: number;
  price: number;
}

interface FoundOrder {
  id: string;
  order_number: number;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  items: OrderItem[];
  total: number;
  status: string;
}

interface Product {
  id: string;
  title: string;
  price: number;
  image_url: string | null;
  sizes: string[];
}

interface NewItem {
  product_id: string;
  title: string;
  size: string;
  quantity: number;
  price: number;
}

const EXCHANGE_TYPES = [
  {
    id: "same_type" as const,
    label: "نفس النوع",
    desc: "مثلاً تيشرت بتيشرت",
    fee: 90,
    color: "border-blue-500/40 bg-blue-500/5 text-blue-400",
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    id: "different_type" as const,
    label: "نوع مختلف",
    desc: "مثلاً تيشرت بلونج سليف",
    fee: 150,
    color: "border-orange-500/40 bg-orange-500/5 text-orange-400",
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ExchangePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitted, setSubmitted] = useState(false);
  const [replacementNumber, setReplacementNumber] = useState<number | null>(null);

  // Step 1 — Order lookup
  const [orderInput, setOrderInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [looking, setLooking] = useState(false);
  const [order, setOrder] = useState<FoundOrder | null>(null);

  // Step 2 — What to return
  const [returnedItems, setReturnedItems] = useState<OrderItem[]>([]);

  // Step 3 — What they want + exchange type
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newItems, setNewItems] = useState<NewItem[]>([]);
  const [exchangeType, setExchangeType] = useState<"same_type" | "different_type">("same_type");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const selectedType = EXCHANGE_TYPES.find((t) => t.id === exchangeType)!;

  // Fetch products when reaching step 3
  useEffect(() => {
    if (step === 3 && products.length === 0) {
      setLoadingProducts(true);
      supabase
        .from("products")
        .select("id, title, price, image_url, sizes")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setProducts(data || []);
          setLoadingProducts(false);
        });
    }
  }, [step, products.length]);

  // ── Step 1: Lookup order ────────────────────────────────────────────────────
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInput.trim() || !phoneInput.trim()) return;
    setLooking(true);

    const { data } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_phone, customer_address, items, total, status")
      .eq("order_number", parseInt(orderInput))
      .single();

    setLooking(false);

    if (!data) {
      toast.error("الأوردر مش موجود. تأكد من الرقم وحاول تاني.");
      return;
    }

    // Verify phone matches
    const cleanInput = phoneInput.replace(/\D/g, "").slice(-10);
    const cleanDb = (data.customer_phone || "").replace(/\D/g, "").slice(-10);
    if (cleanInput !== cleanDb) {
      toast.error("رقم الموبايل مش متطابق مع الأوردر.");
      return;
    }

    if (data.status === "cancelled") {
      toast.error("الأوردر ده كان cancelled، مش ممكن استبداله.");
      return;
    }

    setOrder(data as FoundOrder);
    setReturnedItems([]);
    setStep(2);
  };

  // ── Step 2: Toggle returned items ──────────────────────────────────────────
  const toggleReturnItem = (item: OrderItem) => {
    setReturnedItems((prev) => {
      const exists = prev.find((i) => i.title === item.title && i.size === item.size);
      if (exists) return prev.filter((i) => !(i.title === item.title && i.size === item.size));
      return [...prev, item];
    });
  };

  // ── Step 3: Manage new items ───────────────────────────────────────────────
  const addNewItem = (product: Product, size: string) => {
    if (!size) return;
    const exists = newItems.find((i) => i.product_id === product.id && i.size === size);
    if (exists) {
      setNewItems((prev) => prev.filter((i) => !(i.product_id === product.id && i.size === size)));
    } else {
      setNewItems((prev) => [...prev, {
        product_id: product.id,
        title: product.title,
        size,
        quantity: 1,
        price: product.price,
      }]);
    }
  };

  const removeNewItem = (productId: string, size: string) => {
    setNewItems((prev) => prev.filter((i) => !(i.product_id === productId && i.size === size)));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (newItems.length === 0) {
      toast.error("اختار المنتجات الجديدة اللي عايزها.");
      return;
    }
    if (returnedItems.length === 0) {
      toast.error("اختار المنتجات اللي عايز ترجعها.");
      return;
    }
    setSubmitting(true);

    const returnedTotal = returnedItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const newTotal      = newItems.reduce((s, i) => s + i.price * i.quantity, 0);
    const priceDiff     = newTotal - returnedTotal;
    const shippingFees  = selectedType.fee;
    const total         = priceDiff + shippingFees;

    const { data, error } = await supabase.from("replacements").insert({
      original_order_id:     order!.id,
      original_order_number: order!.order_number,
      customer_name:         order!.customer_name,
      customer_phone:        order!.customer_phone,
      customer_address:      order!.customer_address,
      returned_items:        returnedItems,
      new_items:             newItems,
      exchange_type:         exchangeType,
      shipping_fees:         shippingFees,
      price_difference:      priceDiff,
      total,
      status:                "pending",
      notes:                 notes.trim() || null,
    }).select("replacement_number").single();

    setSubmitting(false);

    if (error) {
      toast.error("حصل خطأ، حاول تاني.");
      console.error(error);
    } else {
      setReplacementNumber(data.replacement_number);
      setSubmitted(true);
      // Send email notification to admin
      sendExchangeNotification({
        replacementNumber: data.replacement_number,
        originalOrderNumber: order!.order_number,
        customerName:    order!.customer_name,
        customerPhone:   order!.customer_phone,
        customerAddress: order!.customer_address,
        returnedItems,
        newItems,
        exchangeType,
        shippingFees,
        priceDifference: priceDiff,
        total,
        notes: notes.trim() || null,
      }).catch(console.error);
    }
  };


  // ─── Success Screen ────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
            <Check size={36} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">تم إرسال طلب الاستبدال!</h1>
            <p className="text-secondary mt-2 text-sm">
              رقم طلبك هو{" "}
              <span className="font-black text-primary text-lg">#{replacementNumber}</span>
            </p>
          </div>
          <div className="bg-surface border border-border-light rounded-2xl p-5 text-sm space-y-3 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-blue-400">1</span>
              </div>
              <p className="text-secondary">هيتواصل معاك الفريق على رقمك خلال <strong className="text-primary">24 ساعة</strong></p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-500/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[10px] font-black text-blue-400">2</span>
              </div>
              <p className="text-secondary">هتبعت المنتج اللي عندك وتستلم الجديد مع المندوب</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-orange-500/10 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                <Truck size={12} className="text-orange-400" />
              </div>
              <p className="text-secondary">
                رسوم الشحن{" "}
                <strong className="text-primary">{selectedType.fee} EGP</strong>{" "}
                هتتدفع عند الاستلام
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-opacity"
          >
            <ArrowLeft size={15} /> الرجوع للموقع
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl border-b border-border-light">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-secondary hover:text-primary transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm font-medium">رجوع</span>
          </Link>
          <div className="text-center">
            <p className="text-xs font-black tracking-widest text-primary uppercase">VILTRUM</p>
            <p className="text-[9px] text-accent font-bold tracking-[0.2em] uppercase -mt-0.5">Exchange Request</p>
          </div>
          <div className="w-16" />
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-2">
        <div className="flex items-center gap-2">
          {[
            { n: 1, label: "الأوردر" },
            { n: 2, label: "المرتجع" },
            { n: 3, label: "الجديد" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${
                step > s.n
                  ? "bg-emerald-500 border-emerald-500 text-white"
                  : step === s.n
                  ? "bg-accent border-accent text-white"
                  : "bg-surface border-border-light text-muted"
              }`}>
                {step > s.n ? <Check size={12} strokeWidth={3} /> : s.n}
              </div>
              <span className={`text-[11px] font-semibold hidden sm:block ${step >= s.n ? "text-primary" : "text-muted"}`}>
                {s.label}
              </span>
              {i < 2 && <div className={`flex-1 h-0.5 rounded-full ${step > s.n ? "bg-emerald-500" : "bg-border-light"}`} />}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* ── STEP 1: Lookup Order ── */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground">طلب استبدال منتج</h1>
              <p className="text-secondary text-sm mt-1">ادخل رقم أوردرك ورقم موبايلك عشان نجيب بياناتك</p>
            </div>

            <form onSubmit={handleLookup} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-2">رقم الأوردر</label>
                <input
                  required
                  type="number"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value)}
                  placeholder="مثال: 1001"
                  className="w-full px-4 py-3.5 bg-surface border border-border-light rounded-2xl text-foreground text-base font-bold focus:outline-none focus:border-accent/50 placeholder-muted transition-colors"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-2">رقم الموبايل</label>
                <input
                  required
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="01xxxxxxxxx"
                  className="w-full px-4 py-3.5 bg-surface border border-border-light rounded-2xl text-foreground text-base font-bold focus:outline-none focus:border-accent/50 placeholder-muted transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={looking}
                className="w-full h-14 flex items-center justify-center gap-3 bg-accent text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {looking ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                {looking ? "جارٍ البحث..." : "ابحث عن أوردرك"}
              </button>
            </form>

            {/* Info box */}
            <div className="bg-surface border border-border-light rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider">شروط الاستبدال</p>
              {[
                { icon: "🔄", text: "الاستبدال لنفس النوع: رسوم شحن 90 EGP" },
                { icon: "✨", text: "الاستبدال لنوع مختلف: رسوم شحن 150 EGP" },
                { icon: "📦", text: "المنتج لازم يكون في حالة ممتازة" },
                { icon: "⏰", text: "يُقبل الاستبدال خلال 7 أيام من الاستلام" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-base">{item.icon}</span>
                  <p className="text-sm text-secondary">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── STEP 2: Select Items to Return ── */}
        {step === 2 && order && (
          <div className="space-y-6">
            <div>
              <button onClick={() => setStep(1)} className="flex items-center gap-1 text-muted hover:text-secondary text-xs mb-3 transition-colors">
                <ArrowLeft size={13} /> رجوع
              </button>
              <h2 className="text-xl font-bold text-foreground">اختار المنتجات اللي هترجعها</h2>
              <p className="text-secondary text-sm mt-1">أوردر #{order.order_number} — {order.customer_name}</p>
            </div>

            <div className="space-y-3">
              {(order.items || []).map((item, i) => {
                const selected = !!returnedItems.find((r) => r.title === item.title && r.size === item.size);
                return (
                  <div
                    key={i}
                    onClick={() => toggleReturnItem(item)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-150 ${
                      selected
                        ? "border-accent bg-accent/5"
                        : "border-border-light bg-surface hover:border-muted"
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      selected ? "bg-accent border-accent" : "border-border-light"
                    }`}>
                      {selected && <Check size={12} strokeWidth={3} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold text-secondary bg-surface border border-border-light px-2 py-0.5 rounded-lg">
                          {item.size}
                        </span>
                        <span className="text-[10px] text-muted">×{item.quantity}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-primary shrink-0">{(item.price * item.quantity).toLocaleString()} EGP</p>
                  </div>
                );
              })}
            </div>

            {returnedItems.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <AlertCircle size={14} className="text-amber-400 shrink-0" />
                <p className="text-xs text-amber-400">اختار منتج واحد على الأقل هترجعه</p>
              </div>
            )}

            <button
              disabled={returnedItems.length === 0}
              onClick={() => setStep(3)}
              className="w-full h-14 flex items-center justify-center gap-3 bg-accent text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              التالي <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* ── STEP 3: Choose New Items + Type ── */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <button onClick={() => setStep(2)} className="flex items-center gap-1 text-muted hover:text-secondary text-xs mb-3 transition-colors">
                <ArrowLeft size={13} /> رجوع
              </button>
              <h2 className="text-xl font-bold text-foreground">اختار المنتجات الجديدة</h2>
              <p className="text-secondary text-sm mt-1">اختار اللي عايزه بدل اللي بترجعه</p>
            </div>

            {/* Exchange Type */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">نوع الاستبدال</p>
              <div className="grid grid-cols-2 gap-3">
                {EXCHANGE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setExchangeType(type.id)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      exchangeType === type.id ? type.color : "border-border-light bg-surface text-muted hover:border-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold">{type.label}</span>
                      {exchangeType === type.id && <Check size={14} />}
                    </div>
                    <p className="text-[10px] opacity-70 mb-1">{type.desc}</p>
                    <p className="text-lg font-black">{type.fee} EGP</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">رسوم شحن</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Catalog */}
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={24} className="animate-spin text-muted" />
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">اختار من الكاتالوج</p>
                {products.map((product) => {
                  const selectedSizes = newItems.filter((i) => i.product_id === product.id).map((i) => i.size);
                  return (
                    <div key={product.id} className="bg-surface border border-border-light rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-14 bg-border-light rounded-xl overflow-hidden shrink-0">
                          {product.image_url && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground text-sm truncate">{product.title}</p>
                          <p className="text-xs font-bold text-accent mt-0.5">{product.price.toLocaleString()} EGP</p>
                        </div>
                        {selectedSizes.length > 0 && (
                          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                            {selectedSizes.length} مختار
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(product.sizes || []).map((size) => {
                          const isSelected = selectedSizes.includes(size);
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => addNewItem(product, size)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                isSelected
                                  ? "bg-accent border-accent text-white"
                                  : "bg-surface border-border-light text-secondary hover:border-muted"
                              }`}
                            >
                              {isSelected ? <Check size={10} strokeWidth={3} /> : <Plus size={10} />}
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Selected New Items */}
            {newItems.length > 0 && (
              <div className="bg-surface border border-border-light rounded-2xl p-4 space-y-2">
                <p className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-3">اختياراتك الجديدة</p>
                {newItems.map((item) => (
                  <div key={`${item.product_id}-${item.size}`} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{item.title}</span>
                      <span className="text-[10px] font-bold text-muted bg-border-light px-2 py-0.5 rounded">{item.size}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-primary">{item.price.toLocaleString()} EGP</span>
                      <button onClick={() => removeNewItem(item.product_id, item.size)} className="text-muted hover:text-red-400 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="text-[10px] font-bold text-secondary uppercase tracking-wider block mb-2">ملاحظات (اختياري)</label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي تفاصيل إضافية..."
                className="w-full px-4 py-3 bg-surface border border-border-light rounded-2xl text-foreground text-sm focus:outline-none focus:border-accent/50 resize-none placeholder-muted"
              />
            </div>

            {/* Pricing Summary */}
            <div className="bg-surface border border-border-light rounded-2xl p-5 space-y-3">
              <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">ملخص الحساب</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-secondary">قيمة المنتجات المرتجعة</span>
                  <span className="font-bold text-foreground">
                    {returnedItems.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()} EGP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">قيمة المنتجات الجديدة</span>
                  <span className="font-bold text-foreground">
                    {newItems.reduce((s, i) => s + i.price * i.quantity, 0).toLocaleString()} EGP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-secondary">رسوم الشحن ({selectedType.label})</span>
                  <span className={`font-bold ${exchangeType === "same_type" ? "text-blue-400" : "text-orange-400"}`}>
                    {selectedType.fee} EGP
                  </span>
                </div>
                <div className="border-t border-border-light pt-2 flex justify-between">
                  <span className="font-bold text-foreground">الإجمالي عليك</span>
                  <span className="font-black text-lg text-foreground">
                    {(
                      newItems.reduce((s, i) => s + i.price * i.quantity, 0) -
                      returnedItems.reduce((s, i) => s + i.price * i.quantity, 0) +
                      selectedType.fee
                    ).toLocaleString()}{" "}
                    EGP
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || newItems.length === 0}
              className="w-full h-14 flex items-center justify-center gap-3 bg-accent text-white rounded-2xl font-bold text-sm uppercase tracking-wider hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {submitting ? <Loader2 size={18} className="animate-spin" /> : <ArrowLeftRight size={18} />}
              {submitting ? "جارٍ الإرسال..." : "إرسال طلب الاستبدال"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
