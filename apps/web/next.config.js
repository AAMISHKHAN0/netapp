/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@smartisp/database",
    "@smartisp/types",
    "@smartisp/auth",
    "@smartisp/utils",
    "@smartisp/billing",
    "@smartisp/notifications",
  ],
  serverExternalPackages: ["@prisma/client", "@smartisp/database"],
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
