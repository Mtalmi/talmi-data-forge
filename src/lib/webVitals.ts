/**
 * Core Web Vitals monitoring — tracks LCP, CLS, INP, FCP, TTFB
 * Logs to console in dev, could be extended to send to analytics.
 */
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals';

function logMetric(metric: Metric) {
  const label = `[WebVital] ${metric.name}`;
  const value = metric.name === 'CLS' ? metric.value.toFixed(3) : `${Math.round(metric.value)}ms`;
  const rating = metric.rating; // 'good' | 'needs-improvement' | 'poor'

  if (rating === 'poor') {
    console.warn(`${label}: ${value} (${rating})`);
  } else if (import.meta.env.DEV) {
    console.log(`${label}: ${value} (${rating})`);
  }
}

export function initWebVitals() {
  onCLS(logMetric);
  onINP(logMetric);
  onLCP(logMetric);
  onFCP(logMetric);
  onTTFB(logMetric);
}
