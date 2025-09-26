import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // GitHub Pages deployment configuration
  basePath: process.env.NODE_ENV === 'production' ? '/Slope-Channel-Design' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/Slope-Channel-Design/' : '',
};

export default nextConfig;
