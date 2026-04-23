import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  output: process.env.DOCKER_BUILD === "1" ? "standalone" : undefined,
  images: {
    unoptimized: true,
  },
};

export default withNextIntl(nextConfig);
