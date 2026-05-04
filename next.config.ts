import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/admin/editor.",
        destination: "/admin/editor",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
