// This is what rewrites /dashboard to id/dashboard in the URL,
// but it does not change the actual route handling in Next.js.

import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

// The `createMiddleware` function is used to create a middleware for
// handling internationalization (i18n) in a Next.js application.
export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "always", // forces /id/... and /en/... always in the URL
});

// The `config` object defines the matcher for the middleware
// specifying which routes should be handled by this middleware.
export const config = {
  // Matcher regex excludes paths containing a dot (.*\\..*) from being intercepted by the middleware
  // Why? Because we don't want to intercept requests for static files (like images, CSS, JS) or API routes.
  // What can cause? If we intercept requests for static files or API routes, it could lead to unexpected behavior,
  // such as serving the wrong content or breaking the functionality of the application.
  // By excluding these paths, we ensure that the middleware only processes relevant routes for internationalization.
  // The matcher pattern is defined as follows:
  // - /((?!api|_next|.*\\..*).*) matches any path that does not start with
  // "api", "_next", or contain a dot (indicating a file extension).
  // - This ensures that the middleware only processes routes that are relevant for internationalization,
  // while allowing static files and API routes to be handled normally.
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
