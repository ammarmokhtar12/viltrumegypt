import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      new URL("https://tvtlblvfzpyqharmoere.supabase.co/storage/v1/object/public/**"),
      new URL("https://*.supabase.co/storage/v1/object/public/**"),
    ],
  },
};

export default nextConfig;
