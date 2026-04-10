"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Phone, MapPin, DollarSign, Search, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string; // Using phone map for unique ID
  name: string;
  phone: string;
  address: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchCustomers() {
      setLoading(true);
      try {
        const { data: orders, error } = await supabase
          .from("orders")
          .select("customer_name, customer_phone, customer_address, total, created_at, status")
          .order("created_at", { ascending: false });

        if (!error && orders) {
          // Aggregate by phone number (acting as unique customer ID)
          const customerMap = new Map<string, Customer>();

          orders.forEach((order) => {
            const phone = order.customer_phone;
            if (!customerMap.has(phone)) {
              customerMap.set(phone, {
                id: phone,
                name: order.customer_name,
                phone: phone,
                address: order.customer_address,
                totalOrders: 0,
                totalSpent: 0,
                lastOrderDate: order.created_at,
              });
            }
            
            const cust = customerMap.get(phone)!;
            cust.totalOrders += 1;
            // Only count completed revenue
            if (order.status !== 'cancelled') {
              cust.totalSpent += order.total;
            }
            // Update address/name if it's a newer order (assuming descending creation date sort)
            if (new Date(order.created_at) > new Date(cust.lastOrderDate)) {
               cust.lastOrderDate = order.created_at;
               cust.address = order.customer_address;
               cust.name = order.customer_name;
            }
          });

          const sortedCustomers = Array.from(customerMap.values()).sort(
            (a, b) => b.totalSpent - a.totalSpent
          );
          setCustomers(sortedCustomers);
        }
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-zinc-100 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    );
  }

  const topCustomer = customers[0]; // Already sorted by totalSpent

  return (
    <div className="space-y-8 max-w-7xl mx-auto bg-[#f4f5f7] min-h-screen p-5 sm:p-8 lg:p-10 rounded-2xl">
      {/* Header */}
      <div className="pb-6 border-b border-zinc-200/60 mb-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
        <div>
           <h1 className="text-3xl sm:text-4xl font-display text-zinc-800 tracking-tight">
             Customers CRM
           </h1>
           <p className="text-base text-zinc-500 mt-2">Manage and view your top clientele</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-lg border border-zinc-100 shadow-sm flex items-center gap-3">
           <Users size={18} className="text-violet-600" />
           <div>
              <p className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">Total Base</p>
              <p className="text-lg font-display font-bold text-zinc-900">{customers.length}</p>
           </div>
        </div>
      </div>

      {/* Highlights */}
      {topCustomer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-8 shadow-md text-white relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-32 h-32 bg-zinc-700/30 rounded-full blur-2xl"></div>
               <h3 className="text-xs font-bold text-white/50 uppercase tracking-widest mb-4">Top Customer</h3>
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center font-display text-xl">
                     {topCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-display text-xl">{topCustomer.name}</p>
                    <p className="text-white/60 text-sm mt-0.5">{topCustomer.phone}</p>
                  </div>
               </div>
               <div className="mt-6 flex items-center gap-6">
                  <div>
                     <p className="text-xs text-white/50 mb-1 font-medium">LTV (Lifetime Value)</p>
                     <p className="font-display text-2xl text-emerald-400">{topCustomer.totalSpent.toLocaleString()} EGP</p>
                  </div>
                  <div>
                     <p className="text-xs text-white/50 mb-1 font-medium">Orders</p>
                     <p className="font-display text-2xl">{topCustomer.totalOrders}</p>
                  </div>
               </div>
           </div>
        </div>
      )}

      {/* Main CRM Table */}
      <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-zinc-50/50">
           <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm bg-white border border-zinc-200 rounded-lg text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all"
              />
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Orders</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Spent</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-400 text-sm">
                    {searchQuery ? "No customers found matching your search." : "No customers yet."}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-zinc-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-display font-bold text-xs">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-zinc-900 text-sm">{customer.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-zinc-600 text-sm flex items-center gap-2">
                        <Phone size={12} className="text-zinc-400" />
                        {customer.phone}
                      </p>
                      <p className="text-zinc-400 text-xs mt-1 truncate max-w-[150px] flex items-center gap-2" title={customer.address}>
                        <MapPin size={12} />
                        {customer.address}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-medium bg-zinc-100 text-zinc-700 rounded-lg">
                          {customer.totalOrders} {customer.totalOrders === 1 ? 'order' : 'orders'}
                       </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-display font-bold text-emerald-600 text-sm">
                        {customer.totalSpent.toLocaleString()} EGP
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-500">
                      {new Date(customer.lastOrderDate).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       <Link 
                         href={`/admin/dashboard/orders?search=${customer.phone}`}
                         className="p-2 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors inline-block opacity-0 group-hover:opacity-100"
                         title="View Orders"
                       >
                         <ExternalLink size={16} />
                       </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
