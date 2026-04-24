import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true, // Required for static export
  },
  experimental: {
    browsersListForSwc: true,
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      const sc = config.optimization?.splitChunks;
      if (sc && typeof sc === "object") {
        sc.maxInitialRequests = 4;
      }
    }
    return config;
  },
};

export default nextConfig;
