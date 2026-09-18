import type { NextConfig } from "next";

function supabaseRemotePatterns(): NonNullable<
  NextConfig["images"]
>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    {
      protocol: "https",
      hostname: "**.supabase.co",
      pathname: "/storage/v1/**",
    },
  ];

  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (raw) {
    try {
      const url = new URL(raw);
      if (url.hostname) {
        patterns.unshift({
          protocol: url.protocol.replace(":", "") as "http" | "https",
          hostname: url.hostname,
          pathname: "/storage/v1/**",
        });
      }
    } catch {
      // Ignore invalid env URLs and keep the wildcard pattern.
    }
  }

  return patterns;
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseRemotePatterns(),
  },
};

export default nextConfig;
