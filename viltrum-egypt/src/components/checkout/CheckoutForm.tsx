"use client";

import { useState } from "react";
import { Phone, User, MapPin, CreditCard } from "lucide-react";

interface CheckoutFormProps {
  onSubmit: (data: {
    name: string;
    phone: string;
    address: string;
    paymentMethod: "vodafone_cash" | "instapay";
  }) => void;
  paymentMethod: "vodafone_cash" | "instapay";
  onPaymentMethodChange: (method: "vodafone_cash" | "instapay") => void;
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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Name is required";
    if (!phone.trim()) newErrors.phone = "Phone is required";
    else if (!/^01[0125]\d{8}$/.test(phone.replace(/\s/g, "")))
      newErrors.phone = "Enter a valid Egyptian phone number";
    if (!address.trim()) newErrors.address = "Address is required";
    else if (address.trim().length < 10)
      newErrors.address = "Please provide a detailed address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({ name: name.trim(), phone: phone.trim(), address: address.trim(), paymentMethod });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Name */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 ml-1">
          Full Name <span className="text-viltrum-red">*</span>
        </label>
        <input
          id="checkout-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. John Doe"
          className="viltrum-input"
        />
        {errors.name && (
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">{errors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 ml-1">
          Phone Number <span className="text-viltrum-red">*</span>
        </label>
        <input
          id="checkout-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
          className="viltrum-input"
        />
        {errors.phone && (
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">{errors.phone}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-4">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 ml-1">
          Detailed Address <span className="text-viltrum-red">*</span>
        </label>
        <textarea
          id="checkout-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="City, Area, Street, Building, Floor..."
          rows={3}
          className="viltrum-input !py-4 resize-none"
        />
        {errors.address && (
          <p className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1">{errors.address}</p>
        )}
      </div>

      {/* Payment Method Toggle */}
      <div className="space-y-6 pt-4">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 ml-1">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onPaymentMethodChange("vodafone_cash")}
            className={`flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 transition-all duration-500 group ${
              paymentMethod === "vodafone_cash"
                ? "border-viltrum-red bg-viltrum-red/5 text-foreground shadow-[0_0_20px_rgba(139,0,0,0.1)]"
                : "border-border-color bg-foreground/[0.02] text-foreground/30 hover:border-border-color/30"
            }`}
          >
            <span className={`text-xs font-black uppercase tracking-[0.2em] ${paymentMethod === "vodafone_cash" ? "text-viltrum-red" : ""}`}>
              Vodafone Cash
            </span>
          </button>
          <button
            type="button"
            onClick={() => onPaymentMethodChange("instapay")}
            className={`flex flex-col items-center justify-center py-6 px-4 rounded-2xl border-2 transition-all duration-500 group ${
              paymentMethod === "instapay"
                ? "border-viltrum-red bg-viltrum-red/5 text-foreground shadow-[0_0_20px_rgba(139,0,0,0.1)]"
                : "border-border-color bg-foreground/[0.02] text-foreground/30 hover:border-border-color/30"
            }`}
          >
            <span className={`text-xs font-black uppercase tracking-[0.2em] ${paymentMethod === "instapay" ? "text-viltrum-red" : ""}`}>
              InstaPay
            </span>
          </button>
        </div>

        {/* Payment Instructions */}
        <div className="p-6 rounded-2xl bg-foreground/[0.02] border border-border-color/50">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-viltrum-red/10 flex items-center justify-center shrink-0">
              <CreditCard size={18} className="text-viltrum-red" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-1">Instruction</p>
              <p className="text-sm text-foreground/70 leading-relaxed font-medium">
                {paymentMethod === "vodafone_cash" ? (
                  <>
                    Send payment to <span className="text-viltrum-red font-bold">01031429229</span> via Vodafone Cash,
                    then upload the screenshot below.
                  </>
                ) : (
                  <>
                    Send payment via InstaPay to <span className="text-viltrum-red font-bold">01031429229</span>,
                    then upload the screenshot below.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
