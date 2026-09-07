const PUBLIC_APEX = "monflorian.com";
const PUBLIC_WWW = "www.monflorian.com";
const NO_INDEX = "noindex, nofollow, nosnippet, noimageindex";
const PUBLIC_PATHS = [
  "/confidentialite",
  "/carnets/japon-10-jours",
  "/guides",
  "/guides/preparer-itineraire-voyage",
  "/guides/japon-10-jours-preparer-voyage",
];
const PUBLIC_HTML_ALIASES = new Map([["/index.html", "/"]]);
for (const path of PUBLIC_PATHS) {
  for (const suffix of ["/", ".html", "/index", "/index.html"]) {
    PUBLIC_HTML_ALIASES.set(`${path}${suffix}`, path);
  }
}
const LEGACY_ENTRY_PATHS = new Set(["/v2", "/v2/", "/v2.html", "/v2/index", "/v2/index.html"]);
const LEGACY_JAPAN_SLUGS = new Set(["japon-a-deux", "le-japon-a-deux"]);
const LEGACY_EXAMPLE_SLUGS = new Set(["portugal-en-train", "sicile-a-table", "rails-et-fjords"]);

function isPrivateOrTechnicalRequest(request, url) {
  return (
    !["GET", "HEAD"].includes(request.method) ||
    url.hostname.endsWith(".workers.dev") ||
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/voyages" ||
    url.pathname.startsWith("/voyages/") ||
    url.pathname === "/.well-known/monflorian-release" ||
    url.searchParams.has("acces") ||
    url.searchParams.has("preuve")
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
  if (["GET", "HEAD"].includes(request.method)) {
    if (PUBLIC_HTML_ALIASES.has(url.pathname)) {
      canonical.pathname = PUBLIC_HTML_ALIASES.get(url.pathname);
      shouldRedirect = true;
    }

    const isLegacyEntry = LEGACY_ENTRY_PATHS.has(url.pathname);
    if (isLegacyEntry) {
      canonical.pathname = "/";
      shouldRedirect = true;
    }
    if (canonical.pathname === "/") {
      if (LEGACY_JAPAN_SLUGS.has(url.searchParams.get("voyage"))) {
        canonical.pathname = "/carnets/japon-10-jours";
      } else if (url.searchParams.has("exemple")) {
        const example = url.searchParams.get("exemple");
        canonical.hash = LEGACY_EXAMPLE_SLUGS.has(example) ? `inspiration-${example}` : "examples";
      }
      for (const key of ["voyage", "exemple"]) {
        if (canonical.searchParams.has(key)) {
          canonical.searchParams.delete(key);
          shouldRedirect = true;
        }
      }
    }
    if (canonical.pathname === "/" || PUBLIC_PATHS.includes(canonical.pathname)) {
      for (const key of ["acces", "preuve"]) {
        if (canonical.searchParams.has(key)) {
          canonical.searchParams.delete(key);
          shouldRedirect = true;
        }
      }
    }
  }
  if (!shouldRedirect) return null;
  if (isPublicHostname) {
    canonical.protocol = "https:";
    canonical.hostname = PUBLIC_APEX;
    canonical.port = "";
  }

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

export function shouldNoIndexStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.hostname.endsWith(".workers.dev") ||
    url.pathname === "/api" ||
    url.pathname.startsWith("/api/") ||
    url.pathname === "/voyages" ||
    url.pathname.startsWith("/voyages/")
  );
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
