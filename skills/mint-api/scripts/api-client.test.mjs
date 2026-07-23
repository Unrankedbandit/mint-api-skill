import assert from "node:assert/strict";
import test from "node:test";
import {
  mintApiRequest,
  pollMintOperation,
  readMintApiConfig,
} from "./api-client.mjs";

const config = {
  apiKey: "test-key-that-is-never-printed",
  baseUrl: "https://api.mint.gg/v1",
};

function jsonResponse(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

test("requires an API key and HTTPS", () => {
  assert.throws(() => readMintApiConfig({}), /MINT_API_KEY/);
  assert.throws(
    () =>
      readMintApiConfig({
        MINT_API_KEY: "secret",
        MINT_API_BASE_URL: "http://api.example.com/v1",
      }),
    /HTTPS/,
  );
});

test("sends bearer auth and an optional retry key", async () => {
  let request;
  await mintApiRequest("/models:generate", {
    config,
    method: "POST",
    idempotencyKey: "model-001",
    body: { prompt: "A crate" },
    fetchImpl: async (url, init) => {
      request = { url, init };
      return jsonResponse({ object: "operation", id: "op_1" }, 202);
    },
  });
  assert.equal(request.url, "https://api.mint.gg/v1/models:generate");
  assert.equal(request.init.headers.Authorization, `Bearer ${config.apiKey}`);
  assert.equal(request.init.headers["Idempotency-Key"], "model-001");
});

test("omits retry keys from normal mutations", async () => {
  let request;
  await mintApiRequest("/models:generate", {
    config,
    method: "POST",
    body: { prompt: "A crate" },
    fetchImpl: async (url, init) => {
      request = { url, init };
      return jsonResponse({ object: "operation", id: "op_1" }, 202);
    },
  });

  assert.equal(request.init.headers["Idempotency-Key"], undefined);
});

test("polls with bounded backoff until a terminal state", async () => {
  const statuses = ["queued", "running", "succeeded"];
  const delays = [];
  let now = 0;
  const operation = await pollMintOperation("op_1", {
    config,
    now: () => now,
    sleep: async (ms) => {
      delays.push(ms);
      now += ms;
    },
    fetchImpl: async () =>
      jsonResponse({ object: "operation", id: "op_1", status: statuses.shift() }),
  });
  assert.equal(operation.status, "succeeded");
  assert.deepEqual(delays, [2_000, 3_200]);
});

test("preserves retry metadata on API errors", async () => {
  await assert.rejects(
    mintApiRequest("/usage", {
      config,
      fetchImpl: async () =>
        jsonResponse(
          {
            title: "Rate limited",
            detail: "Try later",
            errors: [
              { path: "body.prompt", code: "too_small", message: "Required" },
            ],
          },
          429,
          {
            "Retry-After": "10",
            "X-Request-Id": "request-123",
            "X-RateLimit-Limit": "30",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": "1784688000",
          },
        ),
    }),
    (error) =>
      error.status === 429 &&
      error.retryAfter === "10" &&
      error.requestId === "request-123" &&
      error.rateLimit.limit === "30" &&
      error.validationErrors[0].path === "body.prompt",
  );
});
