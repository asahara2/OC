import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // UI tests build with isolated fixture credentials; never overwrite .next.
  distDir: process.env.OC_UI_TEST === "1" ? ".next-ui" : ".next",
  typescript: { tsconfigPath: process.env.OC_UI_TEST === "1" ? "tests/ui/tsconfig.json" : "tsconfig.json" },
  poweredByHeader: false,
  reactStrictMode: true,
  // Keeps Vercel/Next file tracing scoped to this repository when a parent
  // directory happens to contain another JavaScript lockfile.
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
