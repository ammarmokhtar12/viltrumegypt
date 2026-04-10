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

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "Required";
    if (!phone.trim()) newErrors.phone = "Required";
    else if (!/^01[0125]\d{8}$/.test(phone.replace(/\s/g, "")))
      newErrors.phone = "Invalid number";
    if (!address.trim()) newErrors.address = "Required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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
    <form className="space-y-12">
      {/* Name */}
      <div className="space-y-6">
        <label className="text-[11px] font-medium uppercase tracking-[0.35em] text-white block">
          Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            handleChange("name", e.target.value);
          }}
          placeholder="Your full name"
          className="viltrum-input bg-zinc-900 border-zinc-700 rounded-xl"
        />
        {errors.name && (
          <p className="text-[11px] text-red-500 font-medium">{errors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-6">
        <label className="text-[11px] font-medium uppercase tracking-[0.35em] text-white block">
          Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            handleChange("phone", e.target.value);
          }}
          placeholder="01XXXXXXXXX"
          className="viltrum-input bg-zinc-900 border-zinc-700 rounded-xl"
        />
        {errors.phone && (
          <p className="text-[11px] text-red-500 font-medium">{errors.phone}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-6">
        <label className="text-[11px] font-medium uppercase tracking-[0.35em] text-white block">
          Delivery Address
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            handleChange("address", e.target.value);
          }}
          placeholder="City, area, street, building..."
          className="viltrum-input bg-zinc-900 border-zinc-700 rounded-xl"
        />
        {errors.address && (
          <p className="text-[11px] text-red-500 font-medium">
            {errors.address}
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div className="space-y-6 pt-8 border-t border-zinc-800">
        <label className="text-[11px] font-medium uppercase tracking-[0.35em] text-white block">
          Payment Method
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(["vodafone_cash", "instapay"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => {
                onPaymentMethodChange(method);
                onSubmit({ name, phone, address, paymentMethod: method });
              }}
              className={`h-14 flex items-center justify-center text-sm font-semibold transition-all duration-300 rounded-xl ${
                paymentMethod === method
                  ? "bg-white text-black"
                  : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
              }`}
            >
              {method === "vodafone_cash" ? "Vodafone Cash" : "InstaPay"}
            </button>
          ))}
        </div>

        {/* Transfer Info */}
        <div className="rounded-xl p-7 bg-zinc-900 border border-zinc-700 space-y-4">
          <div className="flex items-center gap-2 text-zinc-300">
            <CreditCard size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">
              Transfer to
            </span>
          </div>
          <p className="text-2xl font-bold text-white tracking-wide">
            01031429229
          </p>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            Transfer the exact total amount, then upload your payment screenshot
            below.
          </p>
        </div>
      </div>
    </form>
  );
}
