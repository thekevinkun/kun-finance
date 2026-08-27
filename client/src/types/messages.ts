// This describes the exact shape of common.json, so TypeScript can
// check our translation keys instead of treating them as "any".
// will be use in i18n/request.ts getRequestConfig()
export type Messages = {
  nav: {
    dashboard: string;
    forecast: string;
    transactions: string;
    reports: string;
  };
  ai_assistant: string;
};
