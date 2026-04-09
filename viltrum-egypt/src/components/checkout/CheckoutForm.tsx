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
    if (!name.trim()) newErrors.name = "LEGAL NAME IS REQUIRED";
    if (!phone.trim()) newErrors.phone = "CONTACT NUMBER IS REQUIRED";
    else if (!/^01[0125]\d{8}$/.test(phone.replace(/\s/g, "")))
      newErrors.phone = "INVALID EGYPTIAN PROTOCOL";
    if (!address.trim()) newErrors.address = "DETAILED ADDRESS IS REQUIRED";
    else if (address.trim().length < 10)
      newErrors.address = "PROVIDE MORE PRECISION IN ADDRESS";
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
    <form onChange={handleSubmit} className="space-y-20">
      <div className="space-y-16">
        {/* Name */}
        <div className="space-y-6">
          <label className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-900 block border-l-2 border-zinc-900 pl-4">
            Full Legal Name
          </label>
          <input
            id="checkout-name"
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value.toUpperCase());
              onSubmit({ name: e.target.value.toUpperCase(), phone, address, paymentMethod });
            }}
            placeholder="E.G. AMMAR MOKHTAR"
            className="viltrum-input !text-lg !py-6"
          />
          {errors.name && (
            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">{errors.name}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-6">
          <label className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-900 block border-l-2 border-zinc-900 pl-4">
            Contact Number
          </label>
          <input
            id="checkout-phone"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              onSubmit({ name, phone: e.target.value, address, paymentMethod });
            }}
            placeholder="01XXXXXXXXX"
            className="viltrum-input !text-lg !py-6"
          />
          {errors.phone && (
            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">{errors.phone}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-6">
          <label className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-900 block border-l-2 border-zinc-900 pl-4">
            Shipping Destination
          </label>
          <textarea
            id="checkout-address"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              onSubmit({ name, phone, address: e.target.value, paymentMethod });
            }}
            placeholder="CITY, AREA, STREET, BUILDING..."
            rows={4}
            className="viltrum-input !text-lg !py-6 resize-none"
          />
          {errors.address && (
            <p className="text-[10px] text-red-600 font-black uppercase tracking-widest">{errors.address}</p>
          )}
        </div>
      </div>

      {/* Payment Method Toggle */}
      <div className="space-y-10 pt-16 border-t border-zinc-100">
        <label className="text-xs font-bold uppercase tracking-[0.3em] text-zinc-900 block border-l-2 border-zinc-900 pl-4">
          Transfer Method
        </label>
        <div className="grid grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => onPaymentMethodChange("vodafone_cash")}
            className={`flex flex-col items-center justify-center py-10 px-6 border transition-all duration-500 rounded-none ${
              paymentMethod === "vodafone_cash"
                ? "border-zinc-900 bg-zinc-900 text-white shadow-xl shadow-zinc-900/10"
                : "border-zinc-100 bg-white text-zinc-400 hover:border-zinc-300"
            }`}
          >
            <span className="text-xs font-black uppercase tracking-[0.3em]">
              Vodafone Cash
            </span>
          </button>
          <button
            type="button"
            onClick={() => onPaymentMethodChange("instapay")}
            className={`flex flex-col items-center justify-center py-10 px-6 border transition-all duration-500 rounded-none ${
              paymentMethod === "instapay"
                ? "border-zinc-900 bg-zinc-900 text-white shadow-xl shadow-zinc-900/10"
                : "border-zinc-100 bg-white text-zinc-400 hover:border-zinc-300"
            }`}
          >
            <span className="text-xs font-black uppercase tracking-[0.3em]">
              InstaPay
            </span>
          </button>
        </div>

        {/* Payment Instructions */}
        <div className="p-10 bg-zinc-900 text-white border border-zinc-900">
          <div className="flex items-start gap-6">
            <CreditCard size={24} className="text-zinc-400 mt-1" />
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-400">Transfer Securely To:</p>
              <p className="text-2xl font-display font-bold tracking-widest">
                01031429229
              </p>
              <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase tracking-widest pt-2">
                AFTER TRANSFER, TAKE A CLEAR SCREENSHOT AND UPLOAD IT IN THE SECTION BELOW TO VALIDATE YOUR DROP.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
