"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Users, Mail, Calendar, Search, ArrowLeft, ShieldCheck, UserCheck } from "lucide-react";
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
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-border-light border-t-foreground rounded-full animate-spin" />
          <span className="text-[10px] tracking-[0.25em] text-muted uppercase font-bold">
            Scanning Userbase
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-fade-in max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-8 pb-4">
        <div>
          <span className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] block mb-2">Authenticated Base</span>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground border-l-4 border-primary pl-6 leading-none">
            Registered
          </h1>
          <p className="text-secondary text-sm font-medium mt-4 italic">User accounts and authentication records for the platform.</p>
        </div>
        <div className="flex items-center gap-3 bg-surface border border-border-light px-5 py-3 rounded-2xl">
           <UserCheck size={18} className="text-primary" />
           <div>
              <p className="text-[9px] text-muted font-bold uppercase tracking-wider">Total Members</p>
              <p className="text-lg font-bold text-foreground leading-none mt-0.5">{profiles.length}</p>
           </div>
        </div>
      </div>

      {/* Main Content Card */}
      <div className="bg-surface border border-border-light rounded-[2rem] overflow-hidden shadow-sm">
        {/* Search Bar */}
        <div className="p-6 border-b border-border-light bg-background/50">
           <div className="max-w-md relative group">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted group-focus-within:text-foreground transition-all" />
              <input
                type="text"
                placeholder="Search by identity or email domain..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="viltrum-input pl-11 !min-h-[2.5rem]"
              />
           </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Identity</th>
                <th>Communication Channel</th>
                <th>Activation Date</th>
                <th className="text-right">Access Level</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                       <Mail className="text-muted opacity-20" size={40} />
                       <p className="text-sm font-bold text-muted tracking-widest uppercase italic">The user cloud is empty</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-background border border-border-light text-foreground flex items-center justify-center font-bold text-xs shadow-sm">
                          {p.full_name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <p className="font-bold text-foreground text-sm">{p.full_name || "Anonymous User"}</p>
                      </div>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-secondary">{p.email}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-muted uppercase tracking-widest">
                         <Calendar size={12} />
                         {new Date(p.created_at).toLocaleDateString("en-GB", {
                           year: "numeric",
                           month: "short",
                           day: "numeric"
                         })}
                      </div>
                    </td>
                    <td className="text-right">
                       <div className="flex items-center justify-end gap-2">
                          <span className="px-2.5 py-1 text-[9px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-lg uppercase tracking-wider">
                             Member Account
                          </span>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Info Flag */}
      <div className="p-6 bg-surface border border-border-light rounded-2xl flex items-center gap-4">
         <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <ShieldCheck size={20} />
         </div>
         <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Global Authentication Layer</p>
            <p className="text-xs font-bold text-foreground mt-0.5">All user data is encrypted and managed via Supabase Auth services.</p>
         </div>
      </div>
    </div>
  );
}
