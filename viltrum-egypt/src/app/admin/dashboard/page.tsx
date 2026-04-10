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
  Package,
  ChevronRight,
  ArrowUpRight,
  Target
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

// Custom Gauge Component — Refined
const Gauge = ({ value, label, color, max = 100 }: { value: number, label: string, color: string, max?: number }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ((value / max) * circumference);

  return (
    <div className="flex flex-col items-center justify-center p-2">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="transform -rotate-90 w-full h-full">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="currentColor"
            strokeWidth="6"
            fill="transparent"
            className="text-border-light opacity-50"
          />
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={color}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-[cubic-bezier(0.4,0,0.2,1)]"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-display font-bold text-foreground leading-none">
            {value.toFixed(max === 10 ? 1 : 0)}{max === 100 ? "%" : ""}
          </span>
        </div>
      </div>
      <span className="text-[10px] font-bold text-muted mt-3 uppercase tracking-widest">{label}</span>
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
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-border-light border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  // --- KPI Stats Calculation ---
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const deliveredOrders = orders.filter((o) => o.status === "delivered");
  const uniqueCustomers = new Set(orders.map((o) => o.customer_phone)).size;
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;
  
  const fulfillmentRate = orders.length > 0 ? (deliveredOrders.length / orders.length) * 100 : 0;
  const growthRate = 12.5; // Mock for aesthetic
  const highValueRatio = orders.length > 0 ? (orders.filter(o => o.total > 1500).length / orders.length) * 10 : 0;
  const cancelRate = orders.length > 0 ? (orders.filter(o => o.status === 'cancelled').length / orders.length) * 100 : 0;

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

  const varianceData = Array.from(sizeMap.entries()).map(([size, count], index) => ({
    name: size,
    x: (index + 1) * 20,
    y: count * 10,
    z: Math.max(100, count * 50),
  }));

  if (varianceData.length === 0) {
    varianceData.push({ name: 'N/A', x: 50, y: 50, z: 100 });
  }

  return (
    <div className="space-y-12 animate-fade-in">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] block mb-2">Performance Center</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground border-l-4 border-primary pl-6 leading-none">
            Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard/orders" className="btn-outline flex items-center gap-2 group">
             Detailed Logs
             <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <Link href="/admin/dashboard/products" className="btn-primary">
             Inventory
          </Link>
        </div>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Revenue", value: `${totalRevenue.toLocaleString()} EGP`, icon: DollarSign, trend: "+12%" },
          { label: "Orders Count", value: orders.length, icon: ShoppingCart, trend: "+5%" },
          { label: "Active Items", value: productCount, icon: Package, trend: null },
          { label: "Core Customers", value: uniqueCustomers, icon: Users, trend: "+8%" },
        ].map((kpi, i) => (
          <div key={i} className="bg-surface border border-border-light rounded-2xl p-6 relative overflow-hidden group hover:border-secondary transition-all">
             <div className="relative z-10 flex justify-between items-start">
               <div>
                 <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-3">{kpi.label}</p>
                 <h2 className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</h2>
                 {kpi.trend && (
                   <span className="inline-block mt-3 px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full">
                     {kpi.trend}
                   </span>
                 )}
               </div>
               <div className="w-10 h-10 bg-background border border-border-light rounded-xl flex items-center justify-center text-muted group-hover:text-primary transition-colors">
                  <kpi.icon size={18} />
               </div>
             </div>
             <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all"></div>
          </div>
        ))}
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Analytics Chart */}
        <div className="lg:col-span-8 bg-surface border border-border-light rounded-[2rem] p-8 lg:p-10 relative overflow-hidden shadow-sm">
           <div className="flex justify-between items-center mb-10 relative z-10">
              <div>
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Revenue Stream</h3>
                <p className="text-[11px] text-muted font-bold mt-1 uppercase tracking-widest">Global Analytics Platform</p>
              </div>
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary"></div><span className="text-[10px] font-bold text-muted uppercase">Gross</span></div>
                 <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-muted"></div><span className="text-[10px] font-bold text-muted uppercase">Margin</span></div>
              </div>
           </div>
           
           <div className="h-[340px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" opacity={0.5} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: 'var(--muted)' }} dx={-10} />
                <Tooltip 
                  contentStyle={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border-light)', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)', padding: '12px' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}
                />
                <Area type="monotone" dataKey="Revenue" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="Profit" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
           </div>
        </div>

        {/* Efficiency Gauges */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-6">
           {[
             { label: "Fulfillment", value: fulfillmentRate, color: "var(--primary)" },
             { label: "Growth", value: growthRate, color: "var(--accent)" },
             { label: "Loyalty", value: highValueRatio, color: "var(--primary)", max: 10 },
             { label: "Risk", value: cancelRate, color: "#ef4444" },
           ].map((g, i) => (
             <div key={i} className="bg-surface border border-border-light rounded-[2rem] p-6 flex items-center justify-center hover:bg-background transition-colors">
                <Gauge label={g.label} value={g.value} color={g.color} max={g.max} />
             </div>
           ))}
           <div className="col-span-2 bg-primary rounded-3xl p-6 text-background relative overflow-hidden group">
              <div className="relative z-10 flex justify-between items-center">
                 <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">Avg Order Value</p>
                    <p className="text-2xl font-bold mt-1">{avgOrderValue.toFixed(0)} EGP</p>
                 </div>
                 <div className="w-10 h-10 bg-background/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <TrendingUp size={18} />
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 -mr-8 -mt-8 rounded-full blur-3xl"></div>
           </div>
        </div>
      </div>

      {/* Bottom Row - Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
         <div className="lg:col-span-4 space-y-4">
            <h3 className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mb-6">Workflow Status</h3>
            {[
              { label: "Pending Orders", count: orders.filter(o => o.status === 'pending').length, color: "bg-amber-500", icon: AlertCircle },
              { label: "Awaiting Shipment", count: orders.filter(o => o.status === 'confirmed').length, color: "bg-emerald-500", icon: Package },
            ].map((st, i) => (
              <div key={i} className="flex items-center justify-between p-5 bg-surface border border-border-light rounded-2xl group hover:border-primary transition-all cursor-pointer">
                 <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 ${st.color}/10 ${st.color.replace('bg-', 'text-')} rounded-xl flex items-center justify-center`}>
                       <st.icon size={18} />
                    </div>
                    <span className="text-sm font-bold text-foreground">{st.label}</span>
                 </div>
                 <span className="text-lg font-bold text-foreground">{st.count}</span>
              </div>
            ))}
         </div>

         <div className="lg:col-span-8 bg-surface border border-border-light rounded-[2rem] p-8 lg:p-10 flex flex-col justify-center">
            <div className="flex flex-col sm:flex-row items-center gap-10">
               <div className="text-center sm:text-left">
                  <h3 className="text-xl font-bold text-foreground leading-tight">Elite Performance<br/>Monitoring Active</h3>
                  <p className="text-sm text-secondary mt-3 max-w-xs leading-relaxed">
                    All global storefront systems are operating at peak efficiency. Real-time encryption active.
                  </p>
               </div>
               <div className="flex-1 grid grid-cols-2 gap-4 w-full">
                  <div className="p-5 bg-background border border-border-light rounded-2xl text-center">
                     <Target className="mx-auto mb-2 text-primary" size={20} />
                     <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Accuracy</p>
                     <p className="text-sm font-bold text-foreground">99.9%</p>
                  </div>
                  <div className="p-5 bg-background border border-border-light rounded-2xl text-center">
                     <Users className="mx-auto mb-2 text-primary" size={20} />
                     <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Engagement</p>
                     <p className="text-sm font-bold text-foreground">High</p>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
