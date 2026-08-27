"use client";

// Use router and pathname define on i18n navigaton
import { useRouter, usePathname } from "@/i18n/navigation";

// Get existing language that being define on i18n config
import { locales, type Locale } from "@/i18n/config";

const LanguageToggle = ({ locale }: { locale: Locale }) => {
  const router = useRouter();
  const pathname = usePathname();

  const onSelectLanguage = (selectedLocale: Locale) => {
    // TODO: this drops query params (e.g. ?category=payroll) on switch.
    // Fine for now, revisit if a filtered page needs to survive a language change.

    // next-intl's router already knows the current path and target locale —
    // it handles the URL swap AND signals the cookie write internally.
    router.replace(pathname, { locale: selectedLocale });
  };

  return (
    <div className="w-full flex items-center justify-center gap-2 text-sm font-medium">
      {/* Map through exiting language define in config file */}
      {locales.map((loc, index) => (
        <span key={loc} className="flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">|</span>}
          <button
            type="button"
            onClick={() => onSelectLanguage(loc)}
            aria-current={locale === loc ? "true" : undefined}
            className={
              locale === loc
                ? "font-bold text-accent"
                : "text-ink-muted cursor-pointer hover:text-ink"
            }
          >
            {loc.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
};

export default LanguageToggle;
