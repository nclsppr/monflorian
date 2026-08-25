const PUBLIC_APEX = "monflorian.com";
const PUBLIC_WWW = "www.monflorian.com";
const NO_INDEX = "noindex, nofollow, nosnippet, noimageindex";
const PUBLIC_HTML_ROUTES = new Map([
  ["/", "/index.html"],
  ["/confidentialite", "/confidentialite.html"],
]);
const PUBLIC_HTML_ALIASES = new Map([
  ["/index.html", "/"],
  ["/v2", "/"],
  ["/v2/", "/"],
  ["/confidentialite.html", "/confidentialite"],
]);

function isPrivateOrTechnicalRequest(request, url) {
  return (
    !["GET", "HEAD"].includes(request.method) ||
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/voyages" ||
    url.pathname.startsWith("/voyages/") ||
    url.pathname === "/.well-known/monflorian-release"
  );
}

export function canonicalPublicRedirect(request) {
  const url = new URL(request.url);
  const canonical = new URL(url);
  const isPublicHostname = [PUBLIC_APEX, PUBLIC_WWW].includes(url.hostname);
  let shouldRedirect = false;

  if (isPublicHostname && (url.protocol !== "https:" || url.hostname === PUBLIC_WWW)) {
    canonical.protocol = "https:";
    canonical.hostname = PUBLIC_APEX;
    shouldRedirect = true;
  }
  if (
    isPublicHostname &&
    ["GET", "HEAD"].includes(request.method) &&
    PUBLIC_HTML_ALIASES.has(url.pathname)
  ) {
    canonical.pathname = PUBLIC_HTML_ALIASES.get(url.pathname);
    shouldRedirect = true;
  }
  if (!shouldRedirect) return null;
  canonical.protocol = "https:";
  canonical.hostname = PUBLIC_APEX;
  canonical.port = "";

  const isPrivateOrTechnical = isPrivateOrTechnicalRequest(request, url);
  const headers = {
    "Cache-Control": isPrivateOrTechnical ? "no-store" : "public, max-age=3600",
    Location: canonical.toString(),
  };
  if (isPrivateOrTechnical) {
    headers["Referrer-Policy"] = "no-referrer";
    headers["X-Robots-Tag"] = NO_INDEX;
  }

  return new Response(null, {
    status: 308,
    headers,
  });
}

export function staticAssetRequest(request) {
  if (!["GET", "HEAD"].includes(request.method)) return request;
  const url = new URL(request.url);
  const assetPath = PUBLIC_HTML_ROUTES.get(url.pathname);
  if (!assetPath) return request;
  url.pathname = assetPath;
  return new Request(url, request);
}

export function shouldNoIndexStaticAsset(request) {
  const url = new URL(request.url);
  return url.hostname.endsWith(".workers.dev");
}

export function noIndexResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("X-Robots-Tag", NO_INDEX);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
