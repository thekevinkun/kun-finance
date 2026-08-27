import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale } from "./config";

// These are locale-aware replacements for next/navigation's
// useRouter, usePathname, and Link. Using these (not next/navigation
// directly) is what lets next-intl detect a locale switch and persist
// it as the NEXT_LOCALE cookie.
export const { Link, useRouter, usePathname } = createNavigation({
  locales,
  defaultLocale,
});
