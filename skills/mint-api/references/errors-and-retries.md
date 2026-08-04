# Errors And Retries

Parse Mint's problem response before deciding what to do.

- Authentication failures: stop and ask the user to verify or rotate the key without revealing it.
- Validation failures: parse the `errors` array and correct every listed `path`; do not retry unchanged input. Mint reports up to five issues with a validation `code` and readable `message` in one problem response.
- Payment or insufficient-Credits failures: show `/v1/usage` plus the operation's `billing.actionUrl`; do not start substitute paid work. Preserve a `billing_required` operation. After billing is resolved, resume it when a Preview or intermediate resource exists; otherwise retry the original request with the same `Idempotency-Key`. `totalReserved`, `monthlyReserved`, and `topUpReserved` are pending Credits protected for accepted work, not settled spend.
- Rate limit: inspect `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`; on `429`, respect `Retry-After`, then back off with jitter. Authenticated traffic allows 600 requests per minute per Mint account. Generation and paid lifecycle, retry, derivative, and animation actions allow 30 starts per minute; conversions allow 30 starts per minute. These continuously refilling limits are shared across the account's API keys.
- Retryable server/network failure on a read: retry with bounded backoff.
- Failed operation: use the documented resource retry action if appropriate.

`apiUsage.requestCount` includes billing-blocked authenticated operations. `failedCount` counts terminal asynchronous failures, not validation or `billing_required` responses. `creditsUsed` includes finalized spend only.
- Partial success: keep successful outputs and retry only supported failed items.

## Uncertain mutation retries

Mint creates an internal request key for normal mutations, so ordinary requests do not need an `Idempotency-Key` header.

If the integration will retry a mutation after a lost connection or retryable `5xx`, generate one stable key before the first attempt and pass it as `Idempotency-Key` on every attempt. The same key and request return the existing operation; the same key with changed input returns a conflict. If the first attempt did not include a caller-supplied key and its outcome is unknown, do not retry automatically because another operation may start.

Asset Pack approval reuses items that already started or finished. Repeating the same optimization level returns `409 model-optimization-in-progress` while active or `409 model-already-optimized` after completion; neither response creates another copy or charge. Smart topology and animation are additive outputs: without a caller-supplied retry key, another accepted request can start another output.

Bound retries by attempt count and elapsed time. Log `X-Request-Id`, operation IDs, resource IDs, HTTP status, and the stable problem `type`; never log the API key or provider credentials. Include the request ID when asking Mint support to investigate a failure.
