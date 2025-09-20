import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Suppress specific attributes that cause hydration mismatches
  compiler: {
    reactRemoveProperties: {
      properties: ['^data-new-gr-c-s-check-loaded$', '^data-gr-ext-installed$']
    }
  }
};

export default nextConfig;
