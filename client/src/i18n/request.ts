import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale, type Locale } from "./config";

import type { Messages } from "@/types/messages";

// This function runs on every request and tells next-intl which
// translation file to load, based on the locale in the URL.
export default getRequestConfig(async ({ locale }) => {
  // Safety net: if an unsupported locale ever sneaks through
  // (shouldn't happen once middleware is working), fall back to default.
  const resolvedLocale: Locale = locales.includes(locale as Locale)
    ? (locale as Locale)
    : defaultLocale;

  // Load the matching JSON file and cast it to our known shape.
  const messages = (
    await import(`../../public/locales/${resolvedLocale}/common.json`)
  ).default as Messages;

  return {
    locale: resolvedLocale,
    messages,
  };
});
