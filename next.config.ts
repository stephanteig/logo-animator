import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
// Repo name on GitHub. The site is served at /<repoName>/ on GitHub Pages.
const repoName = "logo-animator";

const nextConfig: NextConfig = {
  // Static export for GitHub Pages
  output: "export",
  // Disable Next.js image optimization (no server in static hosting)
  images: { unoptimized: true },
  // Path the app is served from on GitHub Pages — only in production builds.
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
  // Makes routes resolve as /path/index.html (better behavior on Pages)
  trailingSlash: true,
};

export default nextConfig;
