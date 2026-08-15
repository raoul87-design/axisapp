/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.openfoodfacts.org" },
      { protocol: "https", hostname: "static.openfoodfacts.org" },
    ],
  },
  async redirects() {
    // Old axisapp.nl domains -> stayd.nl. /api/* stays on both hosts (external
    // callers like cron-job.org and Twilio don't reliably follow 308s), and the
    // Google Search Console verification file stays reachable without a redirect.
    return [
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "app.axisapp.nl" }],
        destination: "https://app.stayd.nl/:path",
        permanent: true,
      },
      {
        source: "/:path((?!api/|google26cad0bafb2760f3\\.html).*)",
        has: [{ type: "host", value: "axisapp.nl" }],
        destination: "https://stayd.nl/:path",
        permanent: true,
      },
      {
        source: "/:path((?!api/|google26cad0bafb2760f3\\.html).*)",
        has: [{ type: "host", value: "www.axisapp.nl" }],
        destination: "https://stayd.nl/:path",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
