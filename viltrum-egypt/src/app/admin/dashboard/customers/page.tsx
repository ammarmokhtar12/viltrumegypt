"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Phone, MapPin, DollarSign, Search, ExternalLink, Trophy, Package, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string; 
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
            if (order.status !== 'cancelled') {
              cust.totalSpent += order.total;
            }
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
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-border-light border-t-foreground rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.25em] text-muted uppercase font-bold">
            Analytics Node Active
          </span>
        </div>
      </div>
    );
  }

  const topCustomer = customers[0];

  return (
    <div className="space-y-12 animate-fade-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 pb-4">
        <div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] block mb-2">Relational Intelligence</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground border-l-4 border-primary pl-6 leading-none">
            Clientele
          </h1>
          <p className="text-secondary text-sm font-medium mt-4 italic">Analysis of high-value customer interactions and lifecycle.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface border border-border-light px-5 py-3 rounded-2xl">
           <Users size={18} className="text-primary" />
           <div>
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Unique Entities</p>
              <p className="text-lg font-bold text-foreground leading-none mt-0.5">{customers.length}</p>
           </div>
        </div>
      </div>

      {/* Spotlight Segment */}
      {topCustomer && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-8 bg-primary rounded-[2.5rem] p-10 relative overflow-hidden group shadow-2xl shadow-primary/10">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div className="space-y-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-background/20 rounded-xl flex items-center justify-center">
                         <Trophy size={20} className="text-background" />
                      </div>
                      <span className="text-[10px] font-bold text-background/60 uppercase tracking-[0.3em]">Tier 1 Customer</span>
                   </div>
                   
                   <div>
                      <h2 className="text-3xl font-bold text-background leading-none">{topCustomer.name}</h2>
                      <p className="text-background/50 font-bold text-sm mt-3 uppercase tracking-widest">{topCustomer.phone}</p>
                   </div>
                   
                   <div className="flex gap-10">
                      <div>
                        <p className="text-[10px] font-bold text-background/40 uppercase tracking-widest mb-1">Lifetime Value</p>
                        <p className="text-3xl font-bold text-background">{topCustomer.totalSpent.toLocaleString()} <span className="text-xs opacity-50">EGP</span></p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-background/40 uppercase tracking-widest mb-1">Transaction Frequency</p>
                        <p className="text-3xl font-bold text-background">{topCustomer.totalOrders} <span className="text-xs opacity-50">Orders</span></p>
                      </div>
                   </div>
                </div>

                <Link 
                  href={`/admin/dashboard/orders?search=${topCustomer.phone}`}
                  className="bg-background text-primary px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest hover:scale-105 transition-transform shadow-xl"
                >
                  Inspect Activity
                </Link>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 -mr-20 -mt-20 rounded-full blur-3xl"></div>
           </div>

           <div className="lg:col-span-4 bg-surface border border-border-light rounded-[2.5rem] p-10 flex flex-col justify-between">
              <div>
                <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mb-6">CRM Insights</h3>
                <div className="space-y-6">
                   <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-background border border-border-light flex items-center justify-center text-muted"><Package size={18}/></div>
                      <div>
                         <p className="text-sm font-bold text-foreground">Retention Rate</p>
                         <p className="text-xs text-secondary mt-1">Consistent repurchase detected in {((customers.filter(c => c.totalOrders > 1).length / customers.length) * 100).toFixed(0)}% of base.</p>
                      </div>
                   </div>
                </div>
              </div>
              <div className="pt-6 border-t border-border-light mt-6">
                 <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Global Ranking System active</p>
              </div>
           </div>
        </div>
      )}

      {/* CRM Database */}
      <div className="bg-surface border border-border-light rounded-[2rem] overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border-light bg-background/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
           <div className="relative w-full sm:w-96 group">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-foreground transition-all" />
              <input
                type="text"
                placeholder="Search by identity or contact sequence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="viltrum-input pl-11 !min-h-[2.5rem]"
              />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Candidate Entity</th>
                <th>Communication & Local</th>
                <th>Engagement</th>
                <th>Financial Weight</th>
                <th>Last Ping</th>
                <th className="text-right">Access</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <Users size={40} className="mx-auto text-muted opacity-20 mb-4" />
                    <p className="text-sm font-bold text-muted tracking-widest uppercase italic">Entity cloud is sparse</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-background border border-border-light text-foreground flex items-center justify-center font-bold text-xs shadow-sm">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <p className="font-bold text-foreground text-sm">{customer.name}</p>
                      </div>
                    </td>
                    <td>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-foreground flex items-center gap-2">
                           <Phone size={12} className="text-muted" />
                           {customer.phone}
                        </p>
                        <p className="text-[10px] text-muted font-bold tracking-tight flex items-center gap-2 uppercase truncate max-w-[180px]" title={customer.address}>
                           <MapPin size={12} className="text-muted" />
                           {customer.address}
                        </p>
                      </div>
                    </td>
                    <td>
                       <span className="px-2.5 py-1 text-[10px] font-bold text-muted bg-background border border-border-light rounded-lg uppercase tracking-wider">
                          {customer.totalOrders} {customer.totalOrders === 1 ? 'Record' : 'Records'}
                       </span>
                    </td>
                    <td>
                      <span className="font-bold text-foreground">
                        {customer.totalSpent.toLocaleString()} <span className="text-[10px] opacity-40 ml-1">EGP</span>
                      </span>
                    </td>
                    <td>
                      <span className="text-[10px] font-bold text-muted uppercase tracking-widest">
                        {new Date(customer.lastOrderDate).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </td>
                    <td>
                       <div className="flex justify-end">
                          <Link 
                            href={`/admin/dashboard/orders?search=${customer.phone}`}
                            className="w-9 h-9 flex items-center justify-center text-muted hover:text-primary hover:bg-background border border-border-light rounded-lg transition-all"
                            title="Inspect Linked Orders"
                          >
                            <ArrowUpRight size={16} />
                          </Link>
                       </div>
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
