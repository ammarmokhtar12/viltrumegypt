"use client";

import dynamic from "next/dynamic";
import DarkWrap from "@/components/DarkWrap";

const AdminCustomersPage = dynamic(
  () => import("@/app/admin/dashboard/customers/page"),
  { loading: () => <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" /></div> }
);

export default function CommandCenterCustomersPage() {
  return <DarkWrap><AdminCustomersPage /></DarkWrap>;
}
