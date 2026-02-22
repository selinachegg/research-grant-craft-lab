/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Turbopack (default in Next.js 16) handles fs/path exclusion automatically.
  // Empty config declared explicitly to silence the webpack/turbopack conflict warning.
  turbopack: {},
  // Kept for webpack builds (next build, CI)
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, fs: false, path: false };
    }
    return config;
  },
};

module.exports = nextConfig;
