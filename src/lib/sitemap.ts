export const sitemapRouteInventoryVersion = 1;

const PUBLIC_ORIGIN = "https://gestaomotocapro.com.br";

const PUBLIC_ROUTES = ["/"] as const;

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function buildSitemapXml() {
  const urls = PUBLIC_ROUTES.map((path) => {
    const url = new URL(path, PUBLIC_ORIGIN).href;
    return `  <url>\n    <loc>${escapeXml(url)}</loc>\n  </url>`;
  }).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}