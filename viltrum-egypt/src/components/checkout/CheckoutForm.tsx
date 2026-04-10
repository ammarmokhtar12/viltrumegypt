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
    <form className="space-y-5">
      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted block">
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

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted block">
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

      <div className="space-y-1.5">
        <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted block">
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
          <p className="text-[11px] text-red-500 font-medium">{errors.address}</p>
        )}
      </div>

      {/* Payment Method */}
      <div className="space-y-4 pt-6 border-t border-border-light">
        <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted block">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["vodafone_cash", "instapay"] as const).map((method) => (
            <button
              key={method}
              type="button"
              onClick={() => {
                onPaymentMethodChange(method);
                onSubmit({ name, phone, address, paymentMethod: method });
              }}
              className={`h-12 flex items-center justify-center text-sm font-semibold transition-all duration-200 rounded-lg ${
                paymentMethod === method
                  ? "bg-primary text-background"
                  : "bg-surface border border-border-light text-secondary hover:text-foreground hover:border-secondary"
              }`}
            >
              {method === "vodafone_cash" ? "Vodafone Cash" : "InstaPay"}
            </button>
          ))}
        </div>

        <div className="rounded-xl p-5 bg-surface border border-border-light space-y-3">
          <div className="flex items-center gap-2 text-muted">
            <CreditCard size={14} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">
              Transfer to
            </span>
          </div>
          <p className="text-xl font-bold text-foreground tracking-wide font-display">
            01031429229
          </p>
          <p className="text-[12px] text-secondary leading-relaxed">
            Transfer the exact total amount, then upload your payment screenshot below.
          </p>
        </div>
      </div>
    </form>
  );
}
