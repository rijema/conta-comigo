import { getRequestConfig } from "next-intl/server";

const locales = ["pt", "en"] as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const locale = locales.includes(requestedLocale as (typeof locales)[number])
    ? requestedLocale!
    : "pt";

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
