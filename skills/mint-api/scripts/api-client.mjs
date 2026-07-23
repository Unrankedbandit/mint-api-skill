const DEFAULT_BASE_URL = "https://api.mint.gg/v1";
const TERMINAL_STATUSES = new Set([
  "preview_ready",
  "succeeded",
  "partially_succeeded",
  "failed",
  "canceled",
]);

export function readMintApiConfig(env = process.env) {
  const apiKey = env.MINT_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("MINT_API_KEY is required in the environment.");
  }
  const baseUrl = (env.MINT_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
  const parsed = new URL(baseUrl);
  if (parsed.protocol !== "https:") {
    throw new Error("MINT_API_BASE_URL must use HTTPS.");
  }
  return { apiKey, baseUrl };
}

export async function mintApiRequest(pathname, options = {}) {
  const config = options.config || readMintApiConfig(options.env);
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const response = await fetchImpl(`${config.baseUrl}${pathname}`, {
    method: options.method || "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${config.apiKey}`,
      ...(options.body !== undefined
        ? { "Content-Type": "application/json" }
        : {}),
      ...(options.idempotencyKey
        ? { "Idempotency-Key": options.idempotencyKey }
        : {}),
      ...options.headers,
    },
    ...(options.body !== undefined
      ? { body: JSON.stringify(options.body) }
      : {}),
  });
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { detail: text.slice(0, 500) };
    }
  }
  const requestId = response.headers.get("x-request-id");
  const rateLimit = {
    limit: response.headers.get("x-ratelimit-limit"),
    remaining: response.headers.get("x-ratelimit-remaining"),
    resetAt: response.headers.get("x-ratelimit-reset"),
  };
  if (!response.ok) {
    const detail = body?.detail || body?.title || response.statusText;
    const error = new Error(`Mint API ${response.status}: ${detail}`);
    error.status = response.status;
    error.retryAfter = response.headers.get("retry-after");
    error.requestId = requestId;
    error.rateLimit = rateLimit;
    error.problem = body;
    error.validationErrors = Array.isArray(body?.errors) ? body.errors : [];
    throw error;
  }
  return { body, response, requestId, rateLimit };
}

export function isTerminalOperation(operation) {
  return TERMINAL_STATUSES.has(operation?.status);
}

export async function pollMintOperation(operationId, options = {}) {
  if (!operationId || !/^[A-Za-z0-9_-]+$/.test(operationId)) {
    throw new Error("A valid operation ID is required.");
  }
  const timeoutMs = options.timeoutMs ?? 30 * 60 * 1_000;
  const maxDelayMs = options.maxDelayMs ?? 15_000;
  const initialDelayMs = options.initialDelayMs ?? 2_000;
  const sleep = options.sleep || ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  const startedAt = options.now?.() ?? Date.now();
  let delayMs = initialDelayMs;

  while (true) {
    const { body } = await mintApiRequest(`/operations/${operationId}`, options);
    if (isTerminalOperation(body)) return body;
    const now = options.now?.() ?? Date.now();
    if (now - startedAt >= timeoutMs) {
      throw new Error(`Timed out waiting for Mint operation ${operationId}.`);
    }
    await sleep(delayMs);
    delayMs = Math.min(maxDelayMs, Math.ceil(delayMs * 1.6));
  }
}
