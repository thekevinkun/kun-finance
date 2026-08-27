// This is a configuration file for internationalization (i18n) in a TypeScript project.
// It defines the supported locales and the default locale for the application.

// The `locales` constant is an array of supported locale strings,
// which in this case are "id" (Indonesian) and "en" (English).
export const locales = ["id", "en"] as const;

// The `Locale` type is defined as a union type of the values in the `locales` array.
export type Locale = (typeof locales)[number];

// The `defaultLocale` constant is set to "id",
// indicating that Indonesian is the default language for the application.
export const defaultLocale: Locale = "id";
