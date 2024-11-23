import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App.tsx';
import './index.css';
import './i18n';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://94ab86b714a47352875bf124c0d47366@o4508344514052096.ingest.us.sentry.io/4508344525062145",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  environment: import.meta.env.MODE,
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 1.0,
  tracePropagationTargets: [
    /^https:\/\/lakayalert\.com/,
    /^https:\/\/api\.lakayalert\.com/,
    /^http:\/\/localhost/,
    /^http:\/\/127\.0\.0\.1/
  ],
  replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysOnErrorSampleRate: 1.0,
});

const SentryApp = Sentry.withProfiler(App);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SentryApp />
  </StrictMode>
);