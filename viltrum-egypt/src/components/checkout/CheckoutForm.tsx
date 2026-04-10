"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";

interface CheckoutFormProps {
  onSubmit: (data: {
    name: string;
    phone: string;
    address: string;
    paymentMethod: "vodafone_cash" | "instapay";
  }) => void;
  paymentMethod: "vodafone_cash" | "instapay";
  onPaymentMethodChange: (method: "vodafone_cash" | "instapay") => void;
  usePillStyle?: boolean;
}

export default function CheckoutForm({
  onSubmit,
  paymentMethod,
  onPaymentMethodChange,
}: CheckoutFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    const updated = {
      name: field === "name" ? value : name,
      phone: field === "phone" ? value : phone,
      address: field === "address" ? value : address,
      paymentMethod,
    };
    onSubmit(updated);
  };

  return (
    <div className="space-y-12">
      {/* Contact Info */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Contact</h2>
        <div className="space-y-4">
          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              handleChange("name", e.target.value);
            }}
            placeholder="Full Name"
            className="viltrum-input !bg-white !rounded-lg !min-h-[3rem]"
          />
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              handleChange("phone", e.target.value);
            }}
            placeholder="Phone Number (e.g. 010...)"
            className="viltrum-input !bg-white !rounded-lg !min-h-[3rem]"
          />
        </div>
      </div>

      {/* Shipping Method */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Shipping method</h2>
        <div className="radio-card radio-card-selected group">
           <span className="text-sm font-medium text-foreground">قياسي</span>
           <span className="text-sm font-bold text-foreground">E£118.00</span>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Delivery</h2>
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            handleChange("address", e.target.value);
          }}
          placeholder="Detailed Delivery Address (City, Area, Street...)"
          className="viltrum-input !bg-white !rounded-lg !min-h-[3rem]"
        />
      </div>

      {/* Payment */}
      <div className="space-y-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Payment</h2>
          <p className="text-xs text-muted">All transactions are secure and encrypted.</p>
        </div>
        
        <div className="space-y-0.5 border border-border-light rounded-xl overflow-hidden">
           {/* Option 1: Cash on Delivery */}
           <div 
             onClick={() => {
                onPaymentMethodChange("vodafone_cash");
                onSubmit({ name, phone, address, paymentMethod: "vodafone_cash" });
             }}
             className={`p-4 cursor-pointer transition-all ${paymentMethod === "vodafone_cash" ? 'bg-primary/5' : 'bg-white hover:bg-zinc-50'}`}
           >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className={`radio-circle ${paymentMethod === "vodafone_cash" ? 'border-primary bg-primary' : ''}`}>
                      <div className={`radio-dot ${paymentMethod === "vodafone_cash" ? 'scale-100' : ''}`} />
                   </div>
                   <span className="text-sm font-medium text-foreground">Cash on Delivery (COD)</span>
                </div>
              </div>
              {paymentMethod === "vodafone_cash" && (
                <div className="mt-4 pt-4 border-t border-primary/10 animate-in fade-in slide-in-from-top-1">
                   <p className="text-sm text-secondary leading-relaxed rtl">
                      ادفع براحتك وقت الاستلام! تقدر تعاين النظارة وتتأكد من جودتها قبل ما تدفع للمندوب
                   </p>
                </div>
              )}
           </div>

           {/* Option 2: InstaPay */}
           <div 
             onClick={() => {
                onPaymentMethodChange("instapay");
                onSubmit({ name, phone, address, paymentMethod: "instapay" });
             }}
             className={`p-4 cursor-pointer border-t border-border-light transition-all ${paymentMethod === "instapay" ? 'bg-primary/5' : 'bg-white hover:bg-zinc-50'}`}
           >
              <div className="flex items-center gap-3">
                 <div className={`radio-circle ${paymentMethod === "instapay" ? 'border-primary bg-primary' : ''}`}>
                    <div className={`radio-dot ${paymentMethod === "instapay" ? 'scale-100' : ''}`} />
                 </div>
                 <span className="text-sm font-medium text-foreground">فودافون كاش / انستا باي</span>
              </div>
              {paymentMethod === "instapay" && (
                <div className="mt-4 pt-4 border-t border-primary/10 animate-in fade-in slide-in-from-top-1 space-y-3">
                   <p className="text-sm text-secondary">يرجى تحويل المبلغ وتحصيل صورة للتحويل:</p>
                   <p className="text-xl font-bold font-display tracking-widest text-primary">01031429229</p>
                </div>
              )}
           </div>
        </div>
      </div>

      {/* Billing Address */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-foreground">Billing address</h2>
        <div className="space-y-0.5 border border-border-light rounded-xl overflow-hidden">
           <div className="p-4 bg-primary/5 flex items-center gap-3">
              <div className="radio-circle border-primary bg-primary">
                 <div className="radio-dot scale-100" />
              </div>
              <span className="text-sm font-medium text-foreground">Same as shipping address</span>
           </div>
           <div className="p-4 bg-white hover:bg-zinc-50 border-t border-border-light flex items-center gap-3 cursor-not-allowed opacity-60">
              <div className="radio-circle" />
              <span className="text-sm font-medium text-foreground">Use a different billing address</span>
           </div>
        </div>
      </div>
    </div>
  );
}
