import type { NextConfig } from "next";

/**
 * Dev proxy: the FastAPI server runs on 127.0.0.1:8000 and Next.js on 3000.
 * Proxying /api/* to the backend means the browser never deals with CORS in
 * development. In production, set NEXT_PUBLIC_API_BASE_URL (see lib/config.ts)
 * and this rewrite is simply unused.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET ?? "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  /**
   * FastAPI's list endpoint lives at /contracts/ (trailing slash). Next's
   * default trailing-slash normalization would 308 /api/contracts/ →
   * /api/contracts, which FastAPI then 307s to an absolute backend URL —
   * leaking the proxy target and breaking same-origin requests. Skipping
   * the redirect lets the rewrite hit /contracts/ directly.
   */
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      // Static destinations keep their trailing slash (the `:path*` rewrite
      // normalizes it away, and FastAPI's /contracts/ list route 307s without
      // it — with an absolute Location that would leak the backend origin).
      { source: "/api/contracts", destination: `${apiProxyTarget}/contracts/` },
      { source: "/api/contracts/", destination: `${apiProxyTarget}/contracts/` },
      {
        source: "/api/:path*",
        destination: `${apiProxyTarget}/:path*`,
      },
    ];
  },
};

export default nextConfig;
