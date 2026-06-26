/** @type {import('next').NextConfig} */
const nextConfig = {
  // "standalone" is useful for Docker; falls back to the default server otherwise.
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  reactStrictMode: true,
  // Linting runs as a dedicated `turbo lint` task, not as part of the build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "1337" },
      { protocol: "http", hostname: "127.0.0.1", port: "1337" },
      { protocol: "https", hostname: "**" },
    ],
  },
}

export default nextConfig
