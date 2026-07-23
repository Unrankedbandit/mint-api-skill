---
name: mint-api
description: Integrate Mint's production API into applications and agent workflows. Use for Mint API authentication, service-specific generation, operation polling, Preview review, retries, assets, derivatives, files, and Credits.
---

# Mint API

Use Mint's production API as an account-owned asset pipeline.

## Start Safely

1. Read `references/quickstart.md`.
2. When a compact map of the current public docs would help, fetch `https://docs.mint.gg/llms.txt`. Fetch `https://docs.mint.gg/llms-full.txt` only when the task needs broader context across several guides.
3. Read the production OpenAPI contract at `https://api.mint.gg/openapi.json` before using an unfamiliar endpoint or field. It is the source of truth for exact endpoints and schemas.
4. Read `MINT_API_KEY` from the environment. Never print, paste, transmit to an unrelated service, or commit it.
5. Run `node scripts/check-connection.mjs` only when the user authorizes a live identity and Credits check.

## Workflow

1. Choose the service and `fast`/`standard`/`production` preset. Omit `generationMode` to use the recommended `auto` workflow; opt into `review` only when the integration needs a Preview decision.
2. Start the generation. Use `name` only when the user wants a specific title shown in Mint.
3. Save the returned operation ID. When the operation creates an asset, read its type and ID from `operation.resource`.
4. Poll the operation with bounded exponential backoff. Use `scripts/poll-operation.mjs` or equivalent application logic.
5. In `review` mode, stop at `preview_ready`; approve or revise only with the user's intended decision.
6. Handle every terminal status, including `partially_succeeded`.
7. Retrieve the asset and discover its files through manifests rather than guessing file URLs.

Read `references/service-workflows.md` for service workflows and review actions, and `references/assets-and-files.md` for asset delivery.

## Invariants

- API-created resources belong to the Mint account and can appear through API, MCP, and Mint.
- World, 3D Model, and Asset Pack generation accepts either one `imageUrl` or 2–8 `sourceImages`, never both. Materials and Material Packs consume only one `imageUrl`.
- Start Asset Packs with a natural-language `prompt`; Mint plans the individual assets and shared style. Use optional `itemCount`, `assetPackType`, or `styleGuide` only when exact control is needed. If no count is supplied or stated in the prompt, Mint creates 8 assets. If no specialized type fits, Mint uses `general_asset_pack`.
- Use `riggingPose: "t_pose" | "a_pose"` only for 3D Models and Asset Packs. It prepares a full-body, front-facing, empty-handed humanoid Preview for later rigging; it does not rig or animate the asset.
- Convert an account-owned 3D Model with `POST /v1/models/{modelId}:convert`. Send only the requested formats and optional name in the body; never send an external source URL.
- Provider model IDs are not part of the public contract. Send a public preset.
- Treat `totalReserved`, `monthlyReserved`, and `topUpReserved` as pending Credits, not settled spend.
- When an operation reports `billing_required`, show its billing action and preserve the operation ID. After billing is resolved, resume an operation that has a Preview or intermediate resource; if no resource was created, retry the original request with the same `Idempotency-Key`.
- Bound polling, retries, batch size, and total cost. Respect `Retry-After`. Mint allows 600 authenticated requests per minute and 30 paid-work starts per minute per account, shared across the account's API keys.
- Omit `Idempotency-Key` for normal mutations. If an integration will retry an uncertain mutation, generate one stable key before the first attempt and reuse it only for retries of that request.
- Never expose internal URLs, local-testing keys, provider credentials, private documentation, or implementation-only model IDs.
- Keep API keys out of browser and mobile clients. Call Mint from trusted server code.

Read `references/errors-and-retries.md` before designing error handling.
