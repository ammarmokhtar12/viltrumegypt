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
  usePillStyle = false,
}: CheckoutFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = "FIELD REQUIRED";
    if (!phone.trim()) newErrors.phone = "FIELD REQUIRED";
    else if (!/^01[0125]\d{8}$/.test(phone.replace(/\s/g, "")))
      newErrors.phone = "INVALID FORMAT";
    if (!address.trim()) newErrors.address = "FIELD REQUIRED";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: string, value: string) => {
    const updated = {
      name: field === 'name' ? value.toUpperCase() : name,
      phone: field === 'phone' ? value : phone,
      address: field === 'address' ? value : address,
      paymentMethod
    };
    onSubmit(updated);
  };

  return (
    <form className="space-y-6">
      <div className="space-y-6">
        {/* Name */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 pl-4">
            Full Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              setName(val);
              handleChange('name', val);
            }}
            placeholder="E.G. JOHN DOE"
            className="w-full h-14 rounded-full bg-zinc-50/50 border border-zinc-100 px-8 text-xs font-bold tracking-widest focus:border-zinc-900 focus:bg-white transition-all duration-300 outline-none placeholder:text-zinc-200"
          />
          {errors.name && (
            <p className="text-[8px] text-red-500 font-bold tracking-widest pl-4 uppercase">{errors.name}</p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 pl-4">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              handleChange('phone', e.target.value);
            }}
            placeholder="01XXXXXXXXX"
            className="w-full h-14 rounded-full bg-zinc-50/50 border border-zinc-100 px-8 text-xs font-bold tracking-widest focus:border-zinc-900 focus:bg-white transition-all duration-300 outline-none placeholder:text-zinc-200"
          />
          {errors.phone && (
            <p className="text-[8px] text-red-500 font-bold tracking-widest pl-4 uppercase">{errors.phone}</p>
          )}
        </div>

        {/* Address */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 pl-4">
            Delivery Location
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              handleChange('address', e.target.value);
            }}
            placeholder="AREA, STREET, BUILDING..."
            className="w-full h-14 rounded-full bg-zinc-50/50 border border-zinc-100 px-8 text-xs font-bold tracking-widest focus:border-zinc-900 focus:bg-white transition-all duration-300 outline-none placeholder:text-zinc-200"
          />
          {errors.address && (
            <p className="text-[8px] text-red-500 font-bold tracking-widest pl-4 uppercase">{errors.address}</p>
          )}
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-6 pt-6">
        <label className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 pl-4 text-center block">
          Select Gateway
        </label>
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              onPaymentMethodChange("vodafone_cash");
              onSubmit({ name, phone, address, paymentMethod: "vodafone_cash" });
            }}
            className={`flex-1 h-14 rounded-full text-[9px] font-black uppercase tracking-[0.4em] transition-all duration-500 border ${
              paymentMethod === "vodafone_cash"
                ? "bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-zinc-900/20"
                : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300"
            }`}
          >
            V-Cash
          </button>
          <button
            type="button"
            onClick={() => {
              onPaymentMethodChange("instapay");
              onSubmit({ name, phone, address, paymentMethod: "instapay" });
            }}
            className={`flex-1 h-14 rounded-full text-[9px] font-black uppercase tracking-[0.4em] transition-all duration-500 border ${
              paymentMethod === "instapay"
                ? "bg-zinc-900 border-zinc-900 text-white shadow-xl shadow-zinc-900/20"
                : "bg-white border-zinc-100 text-zinc-400 hover:border-zinc-300"
            }`}
          >
            InstaPay
          </button>
        </div>

        {/* Transfer Destination Card */}
        <div className="p-8 rounded-[2rem] bg-zinc-50 border border-zinc-100 space-y-4">
           <div className="flex items-center justify-between opacity-30">
              <span className="text-[8px] font-black tracking-[0.4em]">RECEIVER PROTOCOL</span>
              <CreditCard size={14} />
           </div>
           <div>
             <span className="text-[9px] font-black text-zinc-400 block mb-1">GLOBAL NUMBER</span>
             <p className="text-3xl font-display font-medium text-zinc-900 tracking-widest">
               01031429229
             </p>
           </div>
        </div>
      </div>
    </form>
  );
}
