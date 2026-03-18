import type { NextConfig } from "next";
import { readFileSync } from "fs";

const isProd = process.env.NODE_ENV === "production";

const { version } = JSON.parse(readFileSync("./package.json", "utf-8")) as {
  version: string;
};

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/minion" : "",
  assetPrefix: isProd ? "/minion/" : "",
  productionBrowserSourceMaps: false,
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default nextConfig;
