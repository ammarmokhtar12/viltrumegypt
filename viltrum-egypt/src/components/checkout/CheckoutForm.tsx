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
    <form onChange={handleSubmit} className="space-y-12">
      {/* Name */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Full Name
        </label>
        <input
          id="checkout-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            // Auto submit on change to sync with parent
            onSubmit({ name: e.target.value, phone, address, paymentMethod });
          }}
          placeholder="e.g. AMMAR MOKHTAR"
          className="viltrum-input"
        />
        {errors.name && (
          <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{errors.name}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Phone Number
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
          className="viltrum-input"
        />
        {errors.phone && (
          <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{errors.phone}</p>
        )}
      </div>

      {/* Address */}
      <div className="space-y-4">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Detailed Address
        </label>
        <textarea
          id="checkout-address"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            onSubmit({ name, phone, address: e.target.value, paymentMethod });
          }}
          placeholder="City, Area, Street, Building, Floor..."
          rows={3}
          className="viltrum-input !py-4 resize-none"
        />
        {errors.address && (
          <p className="text-[10px] text-red-600 font-bold uppercase tracking-widest">{errors.address}</p>
        )}
      </div>

      {/* Payment Method Toggle */}
      <div className="space-y-6 pt-6 border-t border-zinc-100">
        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => onPaymentMethodChange("vodafone_cash")}
            className={`flex flex-col items-center justify-center py-6 px-4 border transition-all duration-300 ${
              paymentMethod === "vodafone_cash"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              Vodafone Cash
            </span>
          </button>
          <button
            type="button"
            onClick={() => onPaymentMethodChange("instapay")}
            className={`flex flex-col items-center justify-center py-6 px-4 border transition-all duration-300 ${
              paymentMethod === "instapay"
                ? "border-zinc-900 bg-zinc-900 text-white"
                : "border-zinc-100 bg-zinc-50 text-zinc-400 hover:border-zinc-200"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
              InstaPay
            </span>
          </button>
        </div>

        {/* Payment Instructions */}
        <div className="p-6 bg-zinc-50 border border-zinc-100">
          <div className="flex items-start gap-4">
            <CreditCard size={18} className="text-zinc-900 mt-1" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Instruction</p>
              <p className="text-sm text-zinc-900 leading-relaxed font-bold">
                {paymentMethod === "vodafone_cash" ? (
                  <>
                    Send to <span className="underline decoration-2 underline-offset-4">01031429229</span> via Vodafone Cash, kemudian upload screenshot bukti pembayaran.
                  </>
                ) : (
                  <>
                    Send to <span className="underline decoration-2 underline-offset-4">01031429229</span> via InstaPay, kemudian upload screenshot bukti pembayaran.
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
