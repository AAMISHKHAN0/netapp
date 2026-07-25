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
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

module.exports = nextConfig;
