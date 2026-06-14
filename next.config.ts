import type { NextConfig } from "next"

const isProd = process.env.NODE_ENV === "production"
// Zmień "generatory" na nazwę repozytorium na GitHub
const repoName = "generatory"

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? `/${repoName}` : "",
  assetPrefix: isProd ? `/${repoName}/` : "",
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? `/${repoName}` : "",
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
}

export default nextConfig
