import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // openai uses node crypto — keep it server-side only
  serverExternalPackages: ["@anthropic-ai/sdk"],
};

export default nextConfig;
