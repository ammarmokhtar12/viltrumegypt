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
    <form className="space-y-6">
      {/* Name */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-600 block">
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
          className="viltrum-input"
        />
        {errors.name && (
          <p className="text-[11px] text-red-500 font-medium">{errors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-600 block">
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
          className="viltrum-input"
        />
        {errors.phone && (
          <p className="text-[11px] text-red-500 font-medium">{errors.phone}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-2">
        <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-600 block">
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
          className="viltrum-input"
        />
        {errors.address && (
          <p className="text-[11px] text-red-500 font-medium">
            {errors.address}
          </p>
        )}
      </div>

      {/* Payment Method */}
      <div className="space-y-4 pt-6 border-t border-zinc-200">
        <label className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-600 block">
          Payment Method
        </label>
        <div className="flex gap-3">
          {(["vodafone_cash", "instapay"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => {
                onPaymentMethodChange(method);
                onSubmit({ name, phone, address, paymentMethod: method });
              }}
              className={`flex-1 h-14 flex items-center justify-center text-sm font-semibold transition-all duration-300 rounded-xl ${
                paymentMethod === method
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {method === "vodafone_cash" ? "Vodafone Cash" : "InstaPay"}
            </button>
          ))}
        </div>

        {/* Transfer Info */}
        <div className="rounded-2xl p-6 bg-white border border-zinc-200 space-y-3">
          <div className="flex items-center gap-2 text-zinc-600">
            <CreditCard size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">
              Transfer to
            </span>
          </div>
          <p className="text-2xl font-bold text-zinc-900 tracking-wide">
            01031429229
          </p>
          <p className="text-[11px] text-zinc-600 leading-relaxed">
            Transfer the exact total amount, then upload your payment screenshot
            below.
          </p>
        </div>
      </div>
    </form>
  );
}
