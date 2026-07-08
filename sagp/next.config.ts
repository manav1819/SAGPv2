import type { NextConfig } from "next";

const allowedServerActionOrigins = [
  "localhost:3000",
  "127.0.0.1:3000",
  "*.app.github.dev",
  "*.githubpreview.dev",
];

if (process.env.NEXT_PUBLIC_APP_URL) {
  try {
    allowedServerActionOrigins.push(new URL(process.env.NEXT_PUBLIC_APP_URL).host);
  } catch {
    // Ignore invalid local env values; Next will still use the static dev origins above.
  }
}

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      allowedOrigins: [...new Set(allowedServerActionOrigins)],
    },
  },
};

export default nextConfig;
