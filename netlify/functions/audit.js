// LiveWire Intelligence Solutions — real website audit function
// Fetches the target page and runs honest, verifiable checks.
// No fake scores: every point reflects something actually found (or missing) in the HTML.

const TIMEOUT_MS = 12000;

function fetchWithTimeout(url, opts = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(url, { ...opts, signal: controller.signal, redirect: "follow" })
    .finally(() => clearTimeout(id));
}

function normalizeUrl(input) {
  let u = (input || "").trim();
  if (!u) return null;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  try {
    const parsed = new URL(u);
    return parsed;
  } catch {
    return null;
  }
}

async function exists(url) {
  try {
    const res = await fetchWithTimeout(url, { method: "GET", headers: { "User-Agent": "LiveWireAuditBot/1.0" } });
    return res.ok;
  } catch {
    return false;
  }
}

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  let target;
  try {
    const body = JSON.parse(event.body || "{}");
    target = normalizeUrl(body.url);
  } catch {
    target = null;
  }

  if (!target) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Please provide a valid URL." }) };
  }

  let html = "";
  let finalUrl = target.href;
  let httpsOk = target.protocol === "https:";
  let reachable = true;

  try {
    const res = await fetchWithTimeout(target.href, {
      headers: { "User-Agent": "LiveWireAuditBot/1.0 (+website audit)" },
    });
    finalUrl = res.url || target.href;
    httpsOk = finalUrl.startsWith("https:");
    html = await res.text();
  } catch (e) {
    reachable = false;
  }

  if (!reachable) {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        error: "Could not reach that site. Check the URL is correct and the site is live.",
      }),
    };
  }

  const lower = html.toLowerCase();
  const origin = new URL(finalUrl).origin;

  // --- Real checks against the fetched HTML ---
  const jsonLdMatches = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  let schemaTypes = [];
  jsonLdMatches.forEach((block) => {
    const typeMatches = block.match(/"@type"\s*:\s*"([^"]+)"/g) || [];
    typeMatches.forEach((t) => {
      const m = t.match(/"@type"\s*:\s*"([^"]+)"/);
      if (m && !schemaTypes.includes(m[1])) schemaTypes.push(m[1]);
    });
  });

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "";

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : "";

  const h1Count = (lower.match(/<h1[\s>]/g) || []).length;
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const hasOpenGraph = /<meta[^>]+property=["']og:/i.test(html);
  const hasFavicon = /<link[^>]+rel=["'][^"']*icon[^"']*["']/i.test(html);
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imgsWithAlt = imgTags.filter((t) => /\balt\s*=/i.test(t)).length;
  const altCoverage = imgTags.length ? Math.round((imgsWithAlt / imgTags.length) * 100) : 100;

  // --- Companion files (separate fetches) ---
  const [robotsOk, sitemapOk, llmsOk] = await Promise.all([
    exists(origin + "/robots.txt"),
    exists(origin + "/sitemap.xml"),
    exists(origin + "/llms.txt"),
  ]);

  // --- Scoring (each item is a real, weighted finding) ---
  const checks = [];
  const add = (label, pass, weight, detail) => checks.push({ label, pass, weight, detail });

  add("HTTPS secure", httpsOk, 10, httpsOk ? "Site loads over HTTPS." : "Site is not served over HTTPS.");
  add("JSON-LD schema markup", schemaTypes.length > 0, 22,
    schemaTypes.length ? "Found: " + schemaTypes.join(", ") : "No structured data found. This is the #1 AI-readability gap.");
  add("Title tag", title.length >= 10 && title.length <= 65, 10,
    !title ? "Missing title tag." : `Title is ${title.length} chars (ideal 10–65).`);
  add("Meta description", description.length >= 50 && description.length <= 160, 10,
    !description ? "Missing meta description." : `Description is ${description.length} chars (ideal 50–160).`);
  add("Single H1 heading", h1Count === 1, 8,
    h1Count === 0 ? "No H1 found." : h1Count === 1 ? "Exactly one H1." : `${h1Count} H1 tags (should be 1).`);
  add("Mobile viewport", hasViewport, 8, hasViewport ? "Mobile viewport set." : "No mobile viewport meta tag.");
  add("Canonical tag", hasCanonical, 6, hasCanonical ? "Canonical URL declared." : "No canonical tag.");
  add("Open Graph tags", hasOpenGraph, 6, hasOpenGraph ? "Social sharing tags present." : "No Open Graph tags.");
  add("Image alt coverage", altCoverage >= 80, 6, `${altCoverage}% of images have alt text.`);
  add("robots.txt", robotsOk, 4, robotsOk ? "robots.txt found." : "No robots.txt at root.");
  add("XML sitemap", sitemapOk, 6, sitemapOk ? "sitemap.xml found." : "No sitemap.xml at root.");
  add("llms.txt (emerging)", llmsOk, 2, llmsOk ? "llms.txt present." : "No llms.txt (optional, future-proofing).");

  const earned = checks.filter((c) => c.pass).reduce((s, c) => s + c.weight, 0);
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const score = Math.round((earned / total) * 100);

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      url: finalUrl,
      score,
      schemaTypes,
      checks,
      scannedAt: new Date().toISOString(),
    }),
  };
};
