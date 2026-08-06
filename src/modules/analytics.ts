import { CONFIG } from "../config";

type Params = Record<string, string | number | boolean>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: unknown; queue?: unknown[] };
    _fbq?: unknown;
  }
}

/** Carrega GA4 e Meta Pixel apenas se houver ID configurado. */
export function initAnalytics(): void {
  if (CONFIG.ga4Id) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${CONFIG.ga4Id}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer!.push(arguments);
    };
    window.gtag("js", new Date());
    window.gtag("config", CONFIG.ga4Id);
  }

  if (CONFIG.metaPixelId) {
    /* eslint-disable */
    (function (f: any, b: Document, e: string, v: string) {
      if (f.fbq) return;
      const n: any = (f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      });
      if (!f._fbq) f._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      const t = b.createElement(e) as HTMLScriptElement;
      t.async = true;
      t.src = v;
      b.getElementsByTagName("head")[0]!.appendChild(t);
    })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    /* eslint-enable */
    window.fbq!("init", CONFIG.metaPixelId);
    window.fbq!("track", "PageView");
  }
}

export function track(event: string, params: Params = {}): void {
  window.gtag?.("event", event, params);
}

export function trackLead(params: Params = {}): void {
  window.gtag?.("event", "generate_lead", params);
  window.fbq?.("track", "Lead", params);
}

export function trackContact(params: Params = {}): void {
  window.gtag?.("event", "whatsapp_click", params);
  window.fbq?.("track", "Contact", params);
}

/** UTMs e click ids da sessao, para anexar ao lead. */
export function captureAttribution(): Record<string, string> {
  const KEY = "sardenha:attr";
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];
  const url = new URLSearchParams(location.search);

  const fresh: Record<string, string> = {};
  for (const k of keys) {
    const v = url.get(k);
    if (v) fresh[k] = v;
  }

  try {
    if (Object.keys(fresh).length) {
      sessionStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    const saved = sessionStorage.getItem(KEY);
    return saved ? (JSON.parse(saved) as Record<string, string>) : {};
  } catch {
    return fresh;
  }
}

/** Dispara um evento para cada CTA marcado com data-cta. */
export function bindCtaTracking(): void {
  document.querySelectorAll<HTMLElement>("[data-cta]").forEach((el) => {
    el.addEventListener("click", () => {
      const id = el.dataset.cta!;
      if (id.startsWith("whatsapp")) trackContact({ origem: id });
      else track("cta_click", { cta: id });
    });
  });
}
