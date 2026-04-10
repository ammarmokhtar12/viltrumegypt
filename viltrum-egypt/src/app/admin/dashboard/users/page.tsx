"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Mail, Calendar, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export default function RegisteredEmailsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          setProfiles(data);
        }
      } catch (err) {
        console.error("Failed to fetch profiles:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-950 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-8 border-b border-zinc-100">
        <div>
           <Link href="/admin/dashboard" className="text-zinc-400 hover:text-zinc-950 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest mb-4 transition-colors">
              <ArrowLeft size={14} />
              Dashboard
           </Link>
           <h1 className="text-4xl sm:text-5xl font-display font-bold text-zinc-950 tracking-tight">
             Registered Emails
           </h1>
           <p className="text-zinc-500 text-base mt-2 font-medium tracking-tight">Manage the users who joined the Viltrum revolution.</p>
        </div>
        <div className="bg-white px-8 py-5 rounded-3xl shadow-premium border border-zinc-100 flex items-center gap-5">
           <div className="w-12 h-12 bg-zinc-950 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <Users size={24} />
           </div>
           <div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Total Users</p>
              <p className="text-3xl font-display font-bold text-zinc-950 leading-tight">{profiles.length}</p>
           </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-[2.5rem] shadow-premium-xl border border-zinc-100 overflow-hidden">
        {/* Search Bar */}
        <div className="p-8 border-b border-zinc-50 bg-zinc-50/30">
           <div className="max-w-md relative group">
              <Search size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-300 group-focus-within:text-zinc-950 transition-colors" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="viltrum-input pl-14"
              />
           </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-8 py-6 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">User</th>
                <th className="px-8 py-6 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Email</th>
                <th className="px-8 py-6 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Joined Date</th>
                <th className="px-8 py-6 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <Mail className="text-zinc-200" size={48} />
                       <p className="text-zinc-400 font-medium italic">No registered users found matching your search.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => (
                  <tr key={p.id} className="admin-table-row group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 text-zinc-950 flex items-center justify-center font-bold text-sm shadow-sm group-hover:bg-zinc-950 group-hover:text-white transition-all">
                          {p.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <p className="font-bold text-zinc-950">{p.full_name || "Anonymous User"}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-zinc-500 font-medium tracking-tight">{p.email}</p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-zinc-400 font-medium">
                         <Calendar size={14} />
                         {new Date(p.created_at).toLocaleDateString("en-US", {
                           year: "numeric",
                           month: "short",
                           day: "numeric"
                         })}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="status-tag bg-emerald-50 text-emerald-600 border border-emerald-100/50 shadow-sm">
                          Active User
                       </span>
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
