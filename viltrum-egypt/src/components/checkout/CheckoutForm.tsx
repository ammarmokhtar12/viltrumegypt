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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Name */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-viltrum-white/70">
          <User size={14} />
          Full Name <span className="text-viltrum-red">*</span>
        </label>
        <input
          id="checkout-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your full name"
          className="w-full px-4 py-3 bg-viltrum-gray border border-viltrum-white/10 rounded-xl text-viltrum-white placeholder-viltrum-white/20 focus:outline-none focus:border-viltrum-red/50 transition-colors"
        />
        {errors.name && (
          <p className="text-xs text-red-400">{errors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-viltrum-white/70">
          <Phone size={14} />
          Phone Number <span className="text-viltrum-red">*</span>
        </label>
        <input
          id="checkout-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="01XXXXXXXXX"
          className="w-full px-4 py-3 bg-viltrum-gray border border-viltrum-white/10 rounded-xl text-viltrum-white placeholder-viltrum-white/20 focus:outline-none focus:border-viltrum-red/50 transition-colors"
        />
        {errors.phone && (
          <p className="text-xs text-red-400">{errors.phone}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium text-viltrum-white/70">
          <MapPin size={14} />
          Detailed Address <span className="text-viltrum-red">*</span>
        </label>
        <textarea
          id="checkout-address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="City, Area, Street, Building, Floor..."
          rows={3}
          className="w-full px-4 py-3 bg-viltrum-gray border border-viltrum-white/10 rounded-xl text-viltrum-white placeholder-viltrum-white/20 focus:outline-none focus:border-viltrum-red/50 transition-colors resize-none"
        />
        {errors.address && (
          <p className="text-xs text-red-400">{errors.address}</p>
        )}
      </div>

      {/* Payment Method Toggle */}
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm font-medium text-viltrum-white/70">
          <CreditCard size={14} />
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onPaymentMethodChange("vodafone_cash")}
            className={`py-3 px-4 rounded-xl border text-sm font-bold tracking-wide transition-all duration-300 ${
              paymentMethod === "vodafone_cash"
                ? "border-viltrum-red bg-viltrum-red/15 text-viltrum-red"
                : "border-viltrum-white/10 text-viltrum-white/40 hover:border-viltrum-white/20"
            }`}
          >
            Vodafone Cash
          </button>
          <button
            type="button"
            onClick={() => onPaymentMethodChange("instapay")}
            className={`py-3 px-4 rounded-xl border text-sm font-bold tracking-wide transition-all duration-300 ${
              paymentMethod === "instapay"
                ? "border-viltrum-red bg-viltrum-red/15 text-viltrum-red"
                : "border-viltrum-white/10 text-viltrum-white/40 hover:border-viltrum-white/20"
            }`}
          >
            InstaPay
          </button>
        </div>

        {/* Payment Instructions */}
        <div className="p-4 rounded-xl bg-viltrum-red/5 border border-viltrum-red/10">
          <p className="text-xs text-viltrum-white/50 leading-relaxed">
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
    </form>
  );
}
