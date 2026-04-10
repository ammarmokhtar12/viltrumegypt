"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Order } from "@/types";
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Users,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell
} from "recharts";

// Custom Gauge Component
const Gauge = ({ value, label, color, max = 100 }: { value: number, label: string, color: string, max?: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((value / max) * circumference);

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-28 h-28 flex items-center justify-center">
        {/* Background circle */}
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-zinc-100"
          />
          {/* Progress circle */}
          <circle
            cx="56"
            cy="56"
            r={radius}
            stroke={color}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-display font-bold text-zinc-800">
            {value.toFixed(1)}{max === 100 ? "%" : ""}
          </span>
        </div>
      </div>
      <span className="text-xs font-semibold text-zinc-400 mt-2 uppercase tracking-wider">{label}</span>
    </div>
  );
};

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [ordersRes, productsRes] = await Promise.all([
          supabase.from("orders").select("*").order("created_at", { ascending: true }),
          supabase.from("products").select("id", { count: "exact" }),
        ]);

        if (ordersRes.data) setOrders(ordersRes.data);
        if (productsRes.count !== null) setProductCount(productsRes.count);
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-zinc-100 border-t-zinc-950 rounded-full animate-spin" />
      </div>
    );
  }

  // --- KPI Stats Calculation ---
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const uniqueCustomers = new Set(orders.map((o) => o.customer_phone)).size;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  const fulfillmentRate = orders.length > 0 ? (deliveredOrders.length / orders.length) * 100 : 0;
  const returnedOrCancelledRate = orders.length > 0 ? (orders.filter(o => o.status === 'cancelled').length / orders.length) * 100 : 0;
  const highValueRatio = orders.length > 0 ? (orders.filter(o => o.total > 1500).length / orders.length) * 10 : 0;
  const growthRate = 18.4;

  const revenueDataMap = new Map();
  orders.forEach(o => {
    const date = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short' });
    if (!revenueDataMap.has(date)) {
      revenueDataMap.set(date, { name: date, Revenue: 0, Profit: 0 });
    }
    const current = revenueDataMap.get(date);
    current.Revenue += o.total;
    current.Profit += (o.total * 0.4);
  });
  const chartData = Array.from(revenueDataMap.values());

  const sizeMap = new Map<string, number>();
  orders.forEach(o => {
    o.items?.forEach(item => {
      if (item.size) {
        const current = sizeMap.get(item.size) || 0;
        sizeMap.set(item.size, current + item.quantity);
      }
    });
  });

  const colors = ['#09090b', '#27272a', '#52525b', '#a1a1aa', '#d4d4d8'];
  const varianceData = Array.from(sizeMap.entries()).map(([size, count], index) => ({
    name: size,
    x: (index + 1) * 20,
    y: count * 10,
    z: Math.max(100, count * 50),
    fill: colors[index % colors.length]
  }));

  if (varianceData.length === 0) {
    varianceData.push({ name: 'N/A', x: 50, y: 50, z: 100, fill: '#f4f4f5' });
  }

  return (
    <div className="space-y-10 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-1000">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pb-2">
        <div>
          <h1 className="text-4xl sm:text-6xl font-display font-bold text-zinc-950 tracking-tighter">
            Executive View
          </h1>
          <p className="text-zinc-500 font-medium tracking-tight mt-2 italic">Real-time performance intelligence for Viltrum Egypt.</p>
        </div>
        <div className="flex items-center gap-4">
           <Link href="/admin/dashboard/orders" className="btn-primary">
              Run Reports
           </Link>
        </div>
      </div>

      {/* TOP ROW: Vital Gauges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Fulfillment", value: fulfillmentRate, color: "#09090b" },
          { label: "MoM Growth", value: growthRate, color: "#09090b" },
          { label: "High-Value", value: highValueRatio, color: "#09090b", max: 10 },
          { label: "Cancellation", value: returnedOrCancelledRate, color: "#ef4444" },
        ].map((gauge, i) => (
          <div key={i} className="bg-white rounded-[2rem] shadow-premium border border-zinc-100 p-4 transition-all hover:shadow-premium-xl active:scale-95 group">
             <Gauge value={gauge.value} label={gauge.label} color={gauge.color} max={gauge.max} />
          </div>
        ))}
      </div>

      {/* MIDDLE ROW: Main Intelligence */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Metric List (Left) */}
        <div className="lg:col-span-4 bg-white rounded-[2.5rem] shadow-premium-xl border border-zinc-100 p-8 flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-10">Asset Performance</h3>
            <div className="space-y-8">
              <div className="flex justify-between items-end border-b border-zinc-50 pb-5">
                <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">Total Revenue</span>
                <span className="text-3xl font-display font-bold text-zinc-950 tracking-tighter">{totalRevenue.toLocaleString()} <span className="text-xs uppercase ml-1">EGP</span></span>
              </div>
              <div className="flex justify-between items-end border-b border-zinc-50 pb-5">
                <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">AOV</span>
                <span className="text-2xl font-display font-bold text-zinc-800 tracking-tight">{avgOrderValue.toFixed(0)} <span className="text-xs uppercase ml-1">EGP</span></span>
              </div>
              <div className="flex justify-between items-end border-b border-zinc-50 pb-5">
                <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-widest">Conversion Count</span>
                <span className="text-2xl font-display font-bold text-zinc-800 tracking-tight">{orders.length}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-12 bg-zinc-950 rounded-3xl p-6 text-white overflow-hidden relative shadow-2xl">
             <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Projected Run Rate</p>
                <p className="text-3xl font-display font-bold mt-2">{(totalRevenue * 1.4).toLocaleString()} <span className="text-[10px] uppercase font-bold opacity-50">EGP</span></p>
             </div>
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-10 -mt-10 rounded-full blur-3xl" />
          </div>
        </div>

        {/* Intelligence Chart (Right) */}
        <div className="lg:col-span-8 bg-white rounded-[2.5rem] shadow-premium-xl border border-zinc-100 p-8">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">Revenue Analytics</h3>
              <div className="flex items-center gap-2">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-950"></div><span className="text-[9px] font-bold text-zinc-500 uppercase">Revenue</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-300"></div><span className="text-[9px] font-bold text-zinc-500 uppercase">Margin</span></div>
              </div>
           </div>
           <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#09090b" stopOpacity={0.08}/>
                    <stop offset="95%" stopColor="#09090b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#a1a1aa' }} dx={-10} />
                <Tooltip 
                  cursor={{stroke: '#09090b', strokeWidth: 1}}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', padding: '15px' }}
                  itemStyle={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="#09090b" strokeWidth={4} fillOpacity={1} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="Profit" stroke="#d4d4d8" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>
      </div>

      {/* BOTTOM ROW: Operational Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Action Center */}
        <div className="bg-white rounded-[2rem] shadow-premium border border-zinc-100 p-8 flex flex-col justify-between">
           <div>
              <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-8">Inventory Risk</h3>
              <div className="space-y-4">
                 <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between group hover:bg-zinc-950 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                       <AlertCircle className="text-amber-500 group-hover:text-amber-400 transition-colors" size={20} />
                       <span className="text-sm font-bold text-zinc-900 group-hover:text-white transition-colors">Awaiting Confirm</span>
                    </div>
                    <span className="text-lg font-bold text-zinc-950 group-hover:text-white transition-colors">{orders.filter(o => o.status === 'pending').length}</span>
                 </div>
                 <div className="p-5 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-between group hover:bg-zinc-950 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                       <ShoppingCart className="text-emerald-500 group-hover:text-emerald-400 transition-colors" size={20} />
                       <span className="text-sm font-bold text-zinc-900 group-hover:text-white transition-colors">Manifested</span>
                    </div>
                    <span className="text-lg font-bold text-zinc-950 group-hover:text-white transition-colors">{orders.filter(o => o.status === 'confirmed').length}</span>
                 </div>
              </div>
           </div>
           <Link href="/admin/dashboard/orders" className="btn-primary w-full mt-10">
              Process Flow
           </Link>
        </div>

        {/* Matrix Visualization */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-premium border border-zinc-100 p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
               <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-8">Performance Matrix</h3>
               <div className="h-[200px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                     <XAxis dataKey="name" hide />
                     <YAxis hide />
                     <Tooltip cursor={{fill: '#f8f8f8'}} contentStyle={{ borderRadius: '15px', border: 'none' }} />
                     <Bar dataKey="Revenue" fill="#09090b" radius={[10, 10, 10, 10]} maxBarSize={15} />
                   </BarChart>
                 </ResponsiveContainer>
               </div>
            </div>
            <div>
               <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em] mb-8">Size Utilization</h3>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <XAxis type="number" dataKey="x" hide />
                      <YAxis type="number" dataKey="y" hide />
                      <ZAxis type="number" dataKey="z" range={[100, 600]} />
                      <Scatter name="Sizes" data={varianceData}>
                        {varianceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={2} stroke="rgba(0,0,0,0.05)" />
                        ))}
                      </Scatter>
                    </ScatterChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                     {varianceData.slice(0, 4).map((v, i) => (
                       <span key={i} className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-zinc-400">
                          <div className="w-2 h-2 rounded-full" style={{background: v.fill}}></div>{v.name}
                       </span>
                     ))}
                  </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
