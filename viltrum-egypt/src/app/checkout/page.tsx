"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Lock, ChevronRight, Sparkles, Copy, Clock } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { supabase } from "@/lib/supabase";
import { formatPrice, generateOrderWhatsAppUrl } from "@/lib/utils";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import PaymentUpload from "@/components/checkout/PaymentUpload";
import Image from "next/image";
import { toast } from "sonner";
import { trackTikTokEvent } from "@/lib/tiktok";
import { sendOrderNotification } from "@/app/actions/notify";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"vodafone_cash" | "instapay">("vodafone_cash");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    address: string;
    paymentMethod: "vodafone_cash" | "instapay";
  } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | number | null>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const handleCopyOrderNumber = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(String(orderNumber));
      setCopied(true);
      toast.success("Order number copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isSuccess) {
    const contactPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "201031429229";
    return (
      <main className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6 py-16 relative overflow-hidden font-sans">
        {/* Editorial Background Glows */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-radial from-neutral-200/40 to-transparent blur-3xl -z-10" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-radial from-neutral-200/30 to-transparent blur-3xl -z-10" />

        <div className="max-w-lg w-full bg-white border border-neutral-100 rounded-[2.5rem] p-8 md:p-12 space-y-10 shadow-[0_32px_96px_-16px_rgba(0,0,0,0.06)] relative animate-in fade-in slide-in-from-bottom-8 duration-1000">
          
          {/* Header Section */}
          <div className="text-center space-y-6">
            {/* Elegant Ring Badge */}
            <div className="flex justify-center">
              <div className="relative flex items-center justify-center">
                {/* Double pulse rings */}
                <div className="absolute inset-0 rounded-full bg-neutral-100 scale-150 animate-pulse" />
                <div className="absolute inset-0 rounded-full bg-neutral-50 scale-125" />
                <div className="relative w-16 h-16 rounded-full bg-neutral-900 flex items-center justify-center text-white shadow-lg z-10">
                  <Check size={28} strokeWidth={2.5} className="animate-in zoom-in duration-500 delay-300" />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-sans font-bold uppercase tracking-[0.25em] text-neutral-400">
                Fulfillment Protocol initiated
              </p>
              <h1 className="text-3xl md:text-4xl font-serif text-neutral-900 tracking-tight leading-tight">
                Order Registered
              </h1>
              <p className="text-neutral-500 text-sm max-w-sm mx-auto leading-relaxed">
                Thank you. Your order has been successfully logged into the Viltrum Egypt directory.
              </p>
            </div>
          </div>

          {/* Premium Order Receipt Block */}
          <div className="bg-[#fcfcfd] border border-neutral-200/60 rounded-2xl p-6 relative overflow-hidden space-y-4">
            {/* Top decorative receipt line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neutral-300 via-neutral-900 to-neutral-300" />
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Reference ID</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">Secure</span>
            </div>

            <div className="flex items-center justify-between gap-4 pt-1">
              <span className="text-3xl font-mono font-black text-neutral-900 tracking-wider">
                #{orderNumber}
              </span>
              <button
                onClick={handleCopyOrderNumber}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-neutral-200 bg-white text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50 active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                {copied ? (
                  <>
                    <Check size={14} className="text-emerald-600" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Instruction Warning */}
            <div className="pt-3 border-t border-dashed border-neutral-200 text-left">
              <p className="text-xs text-neutral-600 leading-relaxed flex items-start gap-2.5">
                <span className="text-neutral-800 text-base leading-none">⚠️</span>
                <span>
                  Please <strong className="text-neutral-950 font-bold">save this order number</strong>. You will need it to track your order status or request updates.
                </span>
              </p>
            </div>
          </div>

          {/* Information Timeline */}
          <div className="space-y-4">
            {[
              {
                icon: <Clock size={16} />,
                title: "Logistics Contact (24 Hours)",
                desc: "Our dispatch managers will contact you within 24 hours to confirm your address and schedule delivery."
              },
              {
                icon: <Sparkles size={16} />,
                title: "WhatsApp Dispatch Message",
                desc: "We are opening a WhatsApp window to finalize shipping. Please keep the session active to proceed."
              }
            ].map((step, idx) => (
              <div key={idx} className="flex gap-4 items-start text-left p-4 rounded-2xl hover:bg-neutral-50 transition-colors duration-300">
                <div className="w-9 h-9 rounded-xl bg-neutral-100 flex-shrink-0 flex items-center justify-center text-neutral-800 mt-0.5">
                  {step.icon}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">{step.title}</h4>
                  <p className="text-xs text-neutral-500 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 space-y-3">
            <Link 
              href="/products" 
              className="w-full h-14 bg-neutral-950 text-white rounded-xl text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-neutral-800 active:scale-[0.98] transition-all flex items-center justify-center shadow-lg shadow-neutral-900/5 cursor-pointer animate-pulse"
            >
              Continue Shopping
            </Link>
            
            <a 
              href={`https://wa.me/${contactPhone}?text=Hello,%20I'm%20inquiring%20about%20my%20order%20%23${orderNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-14 bg-white text-neutral-900 border border-neutral-200 rounded-xl text-[11px] font-semibold uppercase tracking-[0.2em] hover:bg-neutral-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              Contact Support
            </a>
          </div>

        </div>
      </main>
    );
  }

  const cartTotal = totalPrice();
  const cartItems = items;

  if (cartItems.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface">
        <h1 className="text-2xl font-bold text-primary mb-4">Your cart is empty</h1>
        <Link href="/products" className="btn-primary">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const handleFormSubmit = (data: {
    name: string;
    phone: string;
    address: string;
    paymentMethod: "vodafone_cash" | "instapay";
  }) => {
    setFormData(data);
  };

  const handlePaymentMethodChange = (method: "vodafone_cash" | "instapay") => {
    setPaymentMethod(method);
    trackTikTokEvent("AddPaymentInfo", {
      content_type: "product",
      contents: cartItems.map((item) => ({
        content_id: item.product_id,
        content_type: "product",
        content_name: item.title,
        quantity: item.quantity,
        price: item.price,
      })),
      value: cartTotal,
      currency: "EGP",
    });
  };

  const handleFinalSubmit = async () => {
    if (!formData || !formData.name || !formData.phone || !formData.address) {
       alert("Please fill in all contact and shipping details.");
       return;
    }
    // Only require screenshot for instapay
    if (formData.paymentMethod === 'instapay' && !screenshotUrl) {
       alert("Please upload your payment screenshot to proceed.");
       return;
    }

    setSubmitting(true);

    try {
      const orderItems = cartItems.map((item) => ({
        product_id: item.product_id,
        title: item.title,
        size: item.size,
        quantity: item.quantity,
        price: item.price,
        bundle_id: item.bundle_id,
        bundle_label: item.bundle_label,
      }));

      const { data, error } = await supabase
        .from("orders")
        .insert({
          customer_name: formData.name,
          customer_phone: formData.phone,
          customer_address: formData.address,
          payment_method: formData.paymentMethod,
          payment_screenshot_url: screenshotUrl,
          items: orderItems,
          total: cartTotal + 80,
          status: "pending",
        })
        .select("order_number")
        .single();

      if (error) throw error;

      // Decrement stock for each item in the order
      try {
        for (const item of orderItems) {
          await supabase.rpc("decrement_stock", {
            p_product_id: item.product_id,
            p_size: item.size,
            p_quantity: item.quantity,
          });
        }
      } catch (stockErr) {
        console.error("Failed to update inventory during checkout:", stockErr);
      }

      const whatsappUrl = generateOrderWhatsAppUrl(
        data.order_number,
        orderItems,
        cartTotal + 80,
        formData.name,
        formData.paymentMethod
      );

      const trackingProps = {
        content_type: "product",
        contents: orderItems.map((item) => ({
          content_id: item.product_id,
          content_type: "product",
          content_name: item.title,
          quantity: item.quantity,
          price: item.price,
        })),
        value: cartTotal + 80,
        currency: "EGP",
      };
      const userData = {
        phone: formData.phone,
      };

      trackTikTokEvent("PlaceAnOrder", trackingProps, userData, `ord_${data.order_number}_place`);
      trackTikTokEvent("Purchase", trackingProps, userData, `ord_${data.order_number}_purch`);

      clearCart();
      toast.success("Order Confirmed! Your package is being prepared.", {
         description: `Order #${data.order_number} has been successfully recorded.`,
         duration: 5000,
      });

      setOrderNumber(data.order_number);
      setIsSuccess(true);

      // Send Email Notification
      try {
        await sendOrderNotification({
          orderNumber: Number(data.order_number),
          customerName: formData.name,
          customerPhone: formData.phone,
          customerAddress: formData.address,
          paymentMethod: formData.paymentMethod,
          items: orderItems,
          total: cartTotal + 80,
        });
      } catch (emailErr) {
        console.error("Failed to send notification email:", emailErr);
        // We don't want to block the success UI if the email fails
      }
      
      // Delay opening WhatsApp slightly for a better visual transition
      setTimeout(() => {
        window.open(whatsappUrl, "_blank");
      }, 2000);

    } catch (err) {
      console.error("Order error:", err);
      alert("Failed to submit order.");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <main className="min-h-screen bg-background text-primary font-sans selection:bg-primary selection:text-white pb-24">
      {/* Checkout Navbar */}
      <header className="border-b border-border-light bg-background py-4 px-6 md:px-12 flex items-center justify-between z-10 relative">
         <Link href="/" className="inline-block">
           <Image src="/viltrum-logo.png" alt="Viltrum Egypt" width={48} height={48} className="object-contain" />
         </Link>
         <Link href="/products" className="text-sm font-medium flex items-center gap-2 hover:text-accent transition-colors">
            <ArrowLeft size={16} /> Return to Cart
         </Link>
      </header>

      <div className="max-w-6xl mx-auto px-6 md:px-12 pt-8 md:pt-16">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 relative">
            
            {/* Left side: Form */}
            <div className="order-2 lg:order-1 max-w-xl">
               
               {/* Breadcrumbs */}
               <div className="text-xs text-muted flex items-center gap-2 mb-10">
                  <span className="font-semibold text-primary">Information</span>
                  <ChevronRight size={12} />
                  <span className="font-semibold text-primary">Shipping</span>
                  <ChevronRight size={12} />
                  <span className="font-semibold text-primary">Payment</span>
               </div>

               <CheckoutForm
                  onSubmit={handleFormSubmit}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={handlePaymentMethodChange}
               />

               {/* Upload area conditionally rendered dynamically */}
               <div className={`transition-all duration-500 overflow-hidden ${paymentMethod === 'instapay' ? 'max-h-[500px] opacity-100 mt-10' : 'max-h-0 opacity-0 mt-0'}`}>
                  <h2 className="text-xl font-bold text-primary mb-4">Payment Verification</h2>
                  <PaymentUpload onUploadComplete={setScreenshotUrl} uploaded={!!screenshotUrl} />
               </div>

               <div className="mt-12 pt-8 border-t border-border-light">
                  <button
                     onClick={handleFinalSubmit}
                     disabled={submitting}
                     className="btn-primary w-full h-14 text-sm"
                  >
                     {submitting ? "Processing Securely..." : (
                        <>
                           <Lock size={16} /> Complete Order
                        </>
                     )}
                  </button>
               </div>
            </div>

            {/* Right side: Summary */}
            <div className="order-1 lg:order-2">
               <div className="lg:sticky lg:top-10 bg-surface p-8 md:p-10 rounded-2xl border border-border-light">
                  <h3 className="font-semibold text-primary mb-6">Order Summary</h3>

                  <div className="space-y-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                     {(() => {
                        const groupedCheckoutItems: Array<
                          | { type: "single"; item: typeof cartItems[0] }
                          | { type: "bundle"; bundleId: string; bundleLabel: string; items: typeof cartItems; price: number }
                        > = [];

                        const checkoutBundlesMap: Record<string, { bundleLabel: string; items: typeof cartItems; price: number }> = {};

                        cartItems.forEach((item) => {
                          if (item.bundle_id) {
                            if (!checkoutBundlesMap[item.bundle_id]) {
                              checkoutBundlesMap[item.bundle_id] = {
                                bundleLabel: item.bundle_label || "Bundle Offer",
                                items: [],
                                price: 0,
                              };
                            }
                            checkoutBundlesMap[item.bundle_id].items.push(item);
                            checkoutBundlesMap[item.bundle_id].price += item.price * item.quantity;
                          } else {
                            groupedCheckoutItems.push({ type: "single", item });
                          }
                        });

                        Object.entries(checkoutBundlesMap).forEach(([bundleId, data]) => {
                          groupedCheckoutItems.push({
                            type: "bundle",
                            bundleId,
                            bundleLabel: data.bundleLabel,
                            items: data.items,
                            price: data.price,
                          });
                        });

                        return groupedCheckoutItems.map((grouped) => {
                           if (grouped.type === "single") {
                              const item = grouped.item;
                              return (
                                 <div key={`${item.product_id}-${item.size}`} className="flex items-center gap-4">
                                    <div className="relative w-16 h-16 rounded-lg bg-white border border-border-light overflow-hidden flex-shrink-0">
                                       <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full z-10 font-bold border-2 border-white">
                                          {item.quantity}
                                       </span>
                                       {item.image_url ? (
                                          <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                                       ) : (
                                          <div className="w-full h-full bg-surface" />
                                       )}
                                    </div>
                                    <div className="flex-1">
                                       <p className="text-sm font-semibold text-primary truncate">{item.title}</p>
                                       <p className="text-xs text-muted mt-0.5">Size: {item.size}</p>
                                    </div>
                                    <div className="font-medium text-primary text-sm">
                                       {formatPrice(item.price * item.quantity)}
                                    </div>
                                 </div>
                              );
                           } else {
                              return (
                                 <div key={grouped.bundleId} className="p-4 rounded-xl bg-white border border-border-light space-y-4 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                                    <div className="flex justify-between items-center">
                                       <div className="flex items-center gap-2">
                                          <Sparkles size={12} className="text-primary animate-pulse" />
                                          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-primary">
                                             {grouped.bundleLabel}
                                          </span>
                                       </div>
                                       <span className="font-bold text-primary text-sm">
                                          {formatPrice(grouped.price)}
                                       </span>
                                    </div>
                                    <div className="space-y-3 pl-3 border-l-2 border-primary/20">
                                       {grouped.items.map((subItem, index) => (
                                          <div key={`${subItem.product_id}-${subItem.size}-${index}`} className="flex items-center gap-3">
                                             <div className="relative w-10 h-10 rounded bg-surface border border-border-light overflow-hidden flex-shrink-0">
                                                {subItem.image_url ? (
                                                   <Image src={subItem.image_url} alt={subItem.title} fill className="object-cover" />
                                                ) : (
                                                   <div className="w-full h-full bg-surface" />
                                                )}
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                <p className="text-xs font-semibold text-primary truncate">{subItem.title}</p>
                                                <p className="text-[10px] text-muted mt-0.5">Size: {subItem.size}</p>
                                             </div>
                                          </div>
                                       ))}
                                    </div>
                                 </div>
                              );
                           }
                        });
                     })()}
                  </div>

                  <div className="mt-8 space-y-4 pt-6 border-t border-border-light">
                     <div className="flex justify-between text-sm text-secondary">
                        <span>Subtotal</span>
                        <span className="font-medium text-primary">{formatPrice(cartTotal)}</span>
                     </div>
                     <div className="flex justify-between text-sm text-secondary">
                        <span>Shipping</span>
                        <span className="font-semibold text-primary">{formatPrice(80)}</span>
                     </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-border-light flex justify-between items-baseline">
                     <span className="font-semibold text-primary">Total</span>
                     <div className="flex items-baseline gap-2">
                        <span className="text-xs text-muted font-medium tracking-wide">EGP</span>
                        <span className="text-3xl font-bold text-primary tracking-tight">{formatPrice(cartTotal + 80)}</span>
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </main>
  );
}
