"use client";

import dynamic from "next/dynamic";
import DarkWrap from "@/components/DarkWrap";

const AdminProductsPage = dynamic(
  () => import("@/app/admin/dashboard/products/page"),
  { loading: () => <div className="flex items-center justify-center py-32"><div className="w-10 h-10 border-2 border-zinc-700 border-t-red-500 rounded-full animate-spin" /></div> }
);

export default function CommandCenterProductsPage() {
  return <DarkWrap><AdminProductsPage /></DarkWrap>;
}
