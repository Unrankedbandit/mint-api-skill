# Quickstart

Base URL: `https://api.mint.gg/v1`

## Documentation sources

- Use `https://docs.mint.gg/llms.txt` as a compact map of the current public documentation when you need to find the relevant guide.
- Use `https://docs.mint.gg/llms-full.txt` only when a task needs broader context across multiple guides.
- Use `https://api.mint.gg/openapi.json` as the source of truth for the complete endpoint list and exact request and response schemas.

1. Require `MINT_API_KEY` from the environment.
2. Choose a resource and public preset. Omit `generationMode` to use the recommended `auto` workflow.
3. Start the request and save the operation ID.
4. Poll the operation after 2 seconds, multiply the wait by 1.6 up to a 15-second cap, and stop after 30 minutes.
5. Read the asset identified by `operation.resource`, then its file manifest.

Minimal model request:

```bash
curl https://api.mint.gg/v1/models:generate \
  -X POST \
  -H "Authorization: Bearer $MINT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A hand-painted treasure chest",
    "name": "Treasure chest",
    "generationPreset": "standard"
  }'
```

Use `GET /v1/me` when identity is relevant and `GET /v1/usage` before authorized paid testing or when diagnosing Credits. They are not prerequisites for every ordinary generation.

Never invent request fields from memory. Fetch the production OpenAPI contract before using an endpoint not demonstrated here; if a guide summary and the contract differ, follow the contract.
