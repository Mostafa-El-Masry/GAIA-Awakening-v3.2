// next.config.mjs
/** @type {import('next').NextConfig} */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseWsUrl = supabaseUrl?.replace(/^https?/, "wss");
const connectSrc = [
  "'self'",
  "https://sandpack.codesandbox.io",
  "https://*.codesandbox.io",
  "https://*.supabase.co",
  "wss://*.supabase.co",
];

if (supabaseUrl) connectSrc.push(supabaseUrl);
if (supabaseWsUrl) connectSrc.push(supabaseWsUrl);

const galleryCdn =
  process.env.NEXT_PUBLIC_IMG_CDN_BASE ||
  "https://pub-3354a96a3d194a9c95c8e51e1b20944e.r2.dev";
const previewCdn =
  process.env.NEXT_PUBLIC_GAIA_PREVIEWS_URL ||
  "https://pub-f962df99714e4baaac2e2c4a54a7b861.r2.dev";

function hostFrom(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const nextConfig = {
  reactStrictMode: true,
  experimental: {},

  images: {
    remotePatterns: [
      // gallery bucket (images)
      {
        protocol: "https",
        hostname:
          hostFrom(galleryCdn) ||
          "pub-3354a96a3d194a9c95c8e51e1b20944e.r2.dev",
      },
      // previews bucket (video thumbnails/frames)
      {
        protocol: "https",
        hostname:
          hostFrom(previewCdn) ||
          "pub-f962df99714e4baaac2e2c4a54a7b861.r2.dev",
      },
    ],
  },

  // Optional: handy path aliases to your public R2 buckets
  async rewrites() {
    const galleryBase = galleryCdn.replace(/\/$/, "");
    const previewBase = previewCdn.replace(/\/$/, "");
    return [
      {
        source: "/img/:path*",
        destination: `${galleryBase}/:path*`, // gallery
      },
      {
        source: "/media/images/:path*",
        destination: `${galleryBase}/:path*`, // gallery
      },
      {
        source: "/media/previews/:path*",
        destination: `${previewBase}/:path*`, // previews
      },
    ];
  },

  // Security headers (kept broad for dev; tighten later for prod)
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src * 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
              "img-src * 'self' data: blob:",
              "font-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data:",
              `connect-src ${connectSrc.join(" ")}`,
              "frame-src 'self' https://sandpack.codesandbox.io https://*.codesandbox.io blob: data:",
              "worker-src 'self' blob: https://sandpack.codesandbox.io https://*.codesandbox.io",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
