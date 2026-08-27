import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// The `createNextIntlPlugin` function is used to create a Next.js plugin for internationalization (i18n).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {};

// The `withNextIntl` function is called with the `nextConfig` object to enhance it with internationalization capabilities.
export default withNextIntl(nextConfig);
