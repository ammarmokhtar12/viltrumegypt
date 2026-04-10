"use client";

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
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     // Optional internal state update could go here, 
     // but we assume the parent captures the direct input or we update contextually.
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
               onChange={(e) => onSubmit({ name: e.target.value, phone: (document.getElementById('phone') as HTMLInputElement).value, address: (document.getElementById('address') as HTMLInputElement).value, paymentMethod })}
               className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] bg-white text-base text-[#000] focus:outline-none focus:ring-2 focus:ring-[#000] transition-shadow placeholder:text-[#999]"
             />
          </div>
          <div>
             <label className="text-sm font-medium text-[#444] mb-1.5 block">Phone Number</label>
             <input
               id="phone"
               type="tel"
               name="phone"
               required
               placeholder="01xxxxxxxxx"
               onChange={(e) => onSubmit({ name: (document.querySelector('input[name="name"]') as HTMLInputElement).value, phone: e.target.value, address: (document.getElementById('address') as HTMLInputElement).value, paymentMethod })}
               className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] bg-white text-base text-[#000] focus:outline-none focus:ring-2 focus:ring-[#000] transition-shadow placeholder:text-[#999]"
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
             id="address"
             type="text"
             name="address"
             required
             placeholder="City, Area, Street, Building..."
             onChange={(e) => onSubmit({ name: (document.querySelector('input[name="name"]') as HTMLInputElement).value, phone: (document.getElementById('phone') as HTMLInputElement).value, address: e.target.value, paymentMethod })}
             className="w-full px-4 py-3 rounded-lg border border-[#e5e5e5] bg-white text-base text-[#000] focus:outline-none focus:ring-2 focus:ring-[#000] transition-shadow placeholder:text-[#999]"
           />
        </div>
        
        {/* Shipping Method UI (No action required) */}
        <div className="pt-2">
           <div className="flex items-center justify-between p-4 rounded-lg border-2 border-[#000] bg-[#fafafa]">
              <div className="flex items-center gap-3">
                 <Truck size={18} className="text-[#000]" />
                 <span className="font-semibold text-[#000]">Standard Shipping</span>
              </div>
              <span className="font-bold text-[#000]">FREE</span>
           </div>
        </div>
      </div>

      {/* Payment Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-[#000]">Payment Method</h2>
        <p className="text-sm text-[#666] mb-4">All transactions are secure and encrypted.</p>
        
        <div className="flex flex-col rounded-lg border border-[#e5e5e5] overflow-hidden bg-white">
           {/* Vodafone Cash */}
           <label className={`flex items-center p-4 border-b border-[#e5e5e5] cursor-pointer transition-colors ${paymentMethod === 'vodafone_cash' ? 'bg-[#f8f9fa]' : 'hover:bg-[#f8f9fa]'} `}>
              <div className="flex items-center flex-1 gap-3">
                 <input 
                   type="radio" 
                   name="payment" 
                   checked={paymentMethod === 'vodafone_cash'}
                   onChange={() => onPaymentMethodChange('vodafone_cash')}
                   className="w-4 h-4 text-[#000] focus:ring-[#000] accent-[#000]"
                 />
                 <span className="font-medium text-[#000]">Cash on Delivery</span>
              </div>
           </label>
           
           {/* InstaPay */}
           <label className={`flex flex-col p-4 cursor-pointer transition-colors ${paymentMethod === 'instapay' ? 'bg-[#f8f9fa]' : 'hover:bg-[#f8f9fa]'}`}>
              <div className="flex items-center flex-1 gap-3">
                 <input 
                   type="radio" 
                   name="payment" 
                   checked={paymentMethod === 'instapay'}
                   onChange={() => onPaymentMethodChange('instapay')}
                   className="w-4 h-4 text-[#000] focus:ring-[#000] accent-[#000]"
                 />
                 <span className="font-medium text-[#000]">InstaPay / Vodafone Cash Transfer</span>
              </div>
              
              {paymentMethod === 'instapay' && (
                 <div className="ml-7 mt-3 p-4 bg-white rounded-md border border-[#e5e5e5] shadow-sm">
                    <p className="text-sm text-[#444] mb-2">Please transfer exactly the total amount to:</p>
                    <p className="text-lg font-bold tracking-wider text-[#000] font-sans">01031429229</p>
                    <p className="text-xs text-[#666] mt-2">You will be required to upload a screenshot proof after checkout.</p>
                 </div>
              )}
           </label>
        </div>
      </div>
    </form>
  );
}
