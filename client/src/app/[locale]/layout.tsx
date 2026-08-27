import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, type Locale } from "@/i18n/config";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
