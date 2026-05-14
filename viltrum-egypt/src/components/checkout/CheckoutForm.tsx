"use client";

import { useState, useEffect } from "react";
import { CreditCard, Truck } from "lucide-react";

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
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: ""
  });

  // Call onSubmit whenever form data or payment method changes
  useEffect(() => {
    onSubmit({
      ...formData,
      paymentMethod
    });
  }, [formData, paymentMethod, onSubmit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form className="space-y-10 font-sans" onSubmit={(e) => e.preventDefault()}>
      {/* Contact Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#000]">Contact Information</h2>
        <div className="grid grid-cols-1 gap-4">
          <div>
             <label className="text-sm font-medium text-[#444] mb-1.5 block">Full Name</label>
             <input
               type="text"
               name="name"
               required
               placeholder="Your Name"
               value={formData.name}
               onChange={handleChange}
               className="viltrum-input"
             />
          </div>
          <div>
             <label className="text-sm font-medium text-[#444] mb-1.5 block">Phone Number</label>
             <input
               type="tel"
               name="phone"
               required
               placeholder="01xxxxxxxxx"
               value={formData.phone}
               onChange={handleChange}
               className="viltrum-input"
             />
          </div>
        </div>
      </div>

      {/* Shipping Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#000]">Shipping Address</h2>
        <div>
           <label className="text-sm font-medium text-[#444] mb-1.5 block">Detailed Address</label>
           <input
             type="text"
             name="address"
             required
             placeholder="City, Area, Street, Building..."
             value={formData.address}
             onChange={handleChange}
             className="viltrum-input"
           />
        </div>
        
        {/* Shipping Method UI (No action required) */}
        <div className="pt-2">
           <div className="flex items-center justify-between p-4 rounded-xl border border-border-light bg-surface">
              <div className="flex items-center gap-3">
                 <Truck size={18} className="text-foreground" />
                 <span className="font-semibold text-sm text-foreground">Standard Shipping</span>
              </div>
              <span className="font-bold text-[10px] tracking-widest text-foreground uppercase">TBD ON WHATSAPP</span>
           </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#000]">Payment Method</h2>
        <p className="text-sm text-muted mb-4">All transactions are secure and encrypted.</p>
        
        <div className="flex flex-col rounded-xl border border-border-light overflow-hidden bg-background">
           {/* Vodafone Cash */}
           <label className={`flex items-center p-4 border-b border-border-light cursor-pointer transition-colors ${paymentMethod === 'vodafone_cash' ? 'bg-surface' : 'hover:bg-surface'} `}>
              <div className="flex items-center flex-1 gap-3">
                 <input 
                   type="radio" 
                   name="payment" 
                   checked={paymentMethod === 'vodafone_cash'}
                   onChange={() => onPaymentMethodChange('vodafone_cash')}
                   className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                 />
                 <span className="font-medium text-sm text-foreground">Cash on Delivery</span>
              </div>
           </label>
           
           {/* InstaPay */}
           <label className={`flex flex-col p-4 cursor-pointer transition-colors ${paymentMethod === 'instapay' ? 'bg-surface' : 'hover:bg-surface'}`}>
              <div className="flex items-center flex-1 gap-3">
                 <input 
                   type="radio" 
                   name="payment" 
                   checked={paymentMethod === 'instapay'}
                   onChange={() => onPaymentMethodChange('instapay')}
                   className="w-4 h-4 text-primary focus:ring-primary accent-primary"
                 />
                 <span className="font-medium text-sm text-foreground">InstaPay / Vodafone Cash Transfer</span>
              </div>
              
              {paymentMethod === 'instapay' && (
                 <div className="ml-7 mt-3 p-4 bg-background rounded-lg border border-border-light shadow-sm">
                    <p className="text-xs text-secondary mb-2">Please transfer exactly the total amount to:</p>
                    <p className="text-lg font-bold tracking-wider text-foreground font-sans">01031429229</p>
                    <p className="text-[10px] font-medium text-muted mt-2">You will be required to upload a screenshot proof after checkout.</p>
                 </div>
              )}
           </label>
        </div>
      </div>
    </form>
  );
}
