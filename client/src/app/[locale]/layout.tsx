import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import "../globals.css";

// 1. Initialize Inter (Sans-serif)
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter", // Defines the CSS variable
});

// 2. Initialize IBM_Plex_Mono (Monospace)
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "700"], // Specify the weights you plan to use
  display: "swap",
  variable: "--font-mono-custom",
});
export const metadata: Metadata = {
  title: "Kun Finance",
  description: "AI-powered cash flow forecasting for small businesses",
};

// params is a Promise in Next.js 15+, so we type it that way and
// "await" it before we can actually read the locale value out of it.
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // If someone visits a locale we don't support (e.g. /fr/dashboard),
  // show a real 404 instead of letting the app render broken.
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Loads the translated strings for this request (uses i18n/request.ts).
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${inter.variable} ${ibmPlexMono.variable}`}>
      <body className="min-h-full flex flex-col">
        {/* Makes translations available to any client component below
            via the useTranslations() hook, without prop-drilling. */}
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
