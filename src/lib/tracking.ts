import { readConsent, requiresConsent } from "@/lib/marketing-consent";

const PIXEL_ID = "1409495857462088";
const GA_ID = import.meta.env['VITE_GA4_MEASUREMENT_ID'] as string | undefined;
const ENABLED = import.meta.env['VITE_MARKETING_TRACKING_ENABLED'] === 'true';
type MetaWindow = Window & { fbq?: (...args: unknown[]) => void; dataLayer?: unknown[] };
let region = "XX";
let initialized = false;
let active = false;
let lastPage = "";
const UTMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"] as const;

export function captureAttribution() {
  try {
    const url = new URL(window.location.href);
    const values = Object.fromEntries(UTMS.flatMap(key => { const value = url.searchParams.get(key); return value && value.length <= 200 ? [[key, value]] : []; }));
    if (Object.keys(values).length) sessionStorage.setItem("gmp:campaign", JSON.stringify(values));
  } catch { /* Attribution must never interrupt navigation. */ }
}

export function campaignParameters(): Record<string, string> {
  try { return JSON.parse(sessionStorage.getItem("gmp:campaign") ?? "{}") as Record<string, string>; }
  catch { return {}; }
}

export function setTrackingRegion(value: string) { region = value; refreshTracking(); }

function permitted() { const choice = readConsent(); return ENABLED && choice?.accepted !== false && (!requiresConsent(region) || choice?.accepted === true); }

function install() {
  if (initialized) return;
  initialized = true;
  const w = window as MetaWindow;
  // Queue events until the asynchronously loaded Pixel becomes available.
  const queue: unknown[][] = [];
  const fbq = (...args: unknown[]) => { queue.push(args); };
  Object.assign(fbq, { callMethod: undefined, queue, loaded: true, version: "2.0" });
  w.fbq = fbq;
  const pixel = document.createElement("script");
  pixel.async = true;
  pixel.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(pixel);
  w.fbq("init", PIXEL_ID);
  if (GA_ID) {
    w.dataLayer = w.dataLayer ?? [];
    w.dataLayer.push(["js", new Date()]);
    w.dataLayer.push(["config", GA_ID, { send_page_view: false }]);
    const ga = document.createElement("script"); ga.async = true;
    ga.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
    document.head.appendChild(ga);
  }
}

export function refreshTracking() {
  const allow = permitted();
  if (allow) install();
  active = allow;
  if (initialized) {
    (window as MetaWindow).fbq?.("consent", allow ? "grant" : "revoke");
    if (GA_ID) (window as MetaWindow).dataLayer?.push(["consent", "update", { ad_storage: allow ? "granted" : "denied", analytics_storage: allow ? "granted" : "denied" }]);
  }
}

export function trackPage(path: string) {
  captureAttribution();
  refreshTracking();
  const key = `${path}${window.location.search}`;
  if (key === lastPage) return;
  lastPage = key;
  if (!active) return;
  (window as MetaWindow).fbq?.("track", "PageView");
  (window as MetaWindow).dataLayer?.push(["event", "page_view", { page_path: path }]);
  if (path === "/") {
    (window as MetaWindow).fbq?.("track", "ViewContent", { content_name: "Gestão Motoca Pro", content_type: "product" });
    (window as MetaWindow).dataLayer?.push(["event", "view_item", { item_name: "Gestão Motoca Pro" }]);
  }
}

export function trackEvent(event: "Lead" | "InitiateCheckout", data: Record<string, string> = {}) {
  refreshTracking();
  if (!active) return;
  (window as MetaWindow).fbq?.("track", event, data);
  (window as MetaWindow).dataLayer?.push(["event", event === "Lead" ? "sign_up" : "begin_checkout", data]);
}

export function trackClick(label: string) {
  if (!active) return;
  (window as MetaWindow).fbq?.("trackCustom", "cta_click", { label });
  (window as MetaWindow).dataLayer?.push(["event", "cta_click", { label }]);
}