const BACKEND_URL = process.env.BACKEND_API_URL;
const API_KEY = process.env.API_KEY;

const ALLOWED_ROUTES = new Set([
  "GET /dashboard/stats",
  "GET /dashboard/visits",
  "GET /dashboard/reviews",
  "GET /dashboard/logs",
  "POST /recognize-face",
  "POST /register-customer",
  "POST /classify-product",
  "POST /analyze-sentiment",
  "POST /chatbot",
]);

const WINDOW_MS = 60_000;
const BODY_LIMIT = 4 * 1024 * 1024;

// Best-effort rate limiting per warm serverless instance.
// This is not a substitute for a shared, distributed rate limiter.
function checkRateLimit(req, res, route) {
  const forwarded = req.headers["x-forwarded-for"];
  const ip = String(
    req.headers["x-real-ip"] ||
    (Array.isArray(forwarded) ? forwarded[0] : forwarded) ||
    req.socket.remoteAddress ||
    "unknown"
  ).split(",")[0].trim();

  let bucket = "general";
  let limit = 60;

  if (route === "/register-customer") {
    bucket = "registration";
    limit = 5;
  } else if (
    route === "/recognize-face" ||
    route === "/classify-product"
  ) {
    bucket = "image";
    limit = 15;
  } else if (
    route === "/analyze-sentiment" ||
    route === "/chatbot"
  ) {
    bucket = "text";
    limit = 30;
  }

  if (!globalThis.smartRetailRateLimits) {
    globalThis.smartRetailRateLimits = new Map();
  }

  const store = globalThis.smartRetailRateLimits;
  const key = `${ip}:${bucket}`;
  const now = Date.now();

  let entry = store.get(key);

  if (!entry || now - entry.start >= WINDOW_MS) {
    entry = { start: now, count: 0 };
    store.set(key, entry);
  }

  if (store.size > 1000) {
    for (const [storedKey, value] of store.entries()) {
      if (now - value.start >= WINDOW_MS) {
        store.delete(storedKey);
      }
    }
  }

  res.setHeader("X-RateLimit-Limit", String(limit));
  res.setHeader(
    "X-RateLimit-Remaining",
    String(Math.max(0, limit - entry.count))
  );

  if (entry.count >= limit) {
    res.setHeader("Retry-After", "60");
    res.status(429).json({
      detail: "Too many requests. Please try again later.",
    });
    return false;
  }

  entry.count += 1;
  return true;
}

async function readBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;

    if (size > BODY_LIMIT) {
      const error = new Error("Request body exceeds 4 MB.");
      error.statusCode = 413;
      throw error;
    }

    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

export async function proxyToBackend(req, res, route) {
  if (!["GET", "POST"].includes(req.method)) {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ detail: "Method not allowed." });
  }

  if (!BACKEND_URL || !API_KEY) {
    return res.status(503).json({
      detail: "Backend proxy is not configured.",
    });
  }

  const routeKey = `${req.method} ${route}`;

  if (!ALLOWED_ROUTES.has(routeKey)) {
    return res.status(404).json({ detail: "API route not allowed." });
  }

  if (!checkRateLimit(req, res, route)) {
    return;
  }

  try {
    const body =
      req.method === "GET" ? undefined : await readBody(req);

    const queryIndex = req.url.indexOf("?");
    const queryString =
      queryIndex >= 0 ? req.url.slice(queryIndex) : "";

    const baseUrl = BACKEND_URL.replace(/\/+$/, "");
    const upstreamUrl = `${baseUrl}${route}${queryString}`;

    const headers = new Headers({
      "X-API-Key": API_KEY,
    });

    if (req.headers["content-type"]) {
      headers.set("Content-Type", req.headers["content-type"]);
    }

    if (req.headers["accept"]) {
      headers.set("Accept", req.headers["accept"]);
    }

    const upstream = await fetch(upstreamUrl, {
      method: req.method,
      headers,
      body,
      cache: "no-store",
    });

    res.status(upstream.status);
    res.setHeader("Cache-Control", "no-store");

    const contentType = upstream.headers.get("content-type");
    if (contentType) {
      res.setHeader("Content-Type", contentType);
    }

    const responseBody = Buffer.from(
      await upstream.arrayBuffer()
    );

    return res.end(responseBody);
  } catch (error) {
    if (error.statusCode === 413) {
      return res.status(413).json({ detail: error.message });
    }

    console.error("API proxy request failed:", error.message);

    return res.status(502).json({
      detail: "The backend service could not complete the request.",
    });
  }
}