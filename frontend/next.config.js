/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a self-contained .next/standalone build (server.js + only the
  // node_modules it actually needs) — used by the Docker image so the final
  // runtime layer doesn't have to ship the whole node_modules tree.
  output: "standalone",
};

module.exports = nextConfig;
