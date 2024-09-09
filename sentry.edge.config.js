import * as Sentry from "@sentry/nextjs";

const isDev = process.env.NEXT_PUBLIC_VERCEL_ENV === "development";

Sentry.init({
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV,
  debug: isDev,
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  autoSessionTracking: false,
  sendClientReports: false,
  maxBreadcrumbs: 20,
});
