import Link from "next/link";

interface StoreDataAlertProps {
  message: string;
  variant?: "warning" | "error";
}

export default function StoreDataAlert({
  message,
  variant = "warning",
}: StoreDataAlertProps) {
  const styles =
    variant === "error"
      ? "bg-red-50 border-red-200 text-red-900"
      : "bg-surface border-border-light text-secondary";

  return (
    <div
      role="alert"
      className={`mx-auto max-w-2xl rounded-xl border px-5 py-4 text-center text-sm leading-relaxed ${styles}`}
    >
      <p className="font-medium text-foreground mb-1">Collection unavailable</p>
      <p>{message}</p>
      <p className="mt-3 text-xs text-muted">
        Admins: add products in{" "}
        <Link href="/admin" className="underline hover:text-foreground">
          Dashboard → Products
        </Link>
        , or check Supabase env vars on Vercel.
      </p>
    </div>
  );
}
