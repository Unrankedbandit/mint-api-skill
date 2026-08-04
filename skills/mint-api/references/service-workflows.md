# Service Workflows

Choose the service first. Keep generation, review, retry, derivatives, and retrieval together in the application's code for that asset type.

## 3D Models

Use the Model routes for generation, Preview review/revision, retry, optimization, smart topology, and conversion. Optimization updates the model's optimized file. Repeating the same level while it is active returns `409 model-optimization-in-progress`; repeating a completed same-level optimization returns `409 model-already-optimized`. Neither conflict starts new work or charges again. Smart topology creates a new derivative, so protect uncertain retries with a stable `Idempotency-Key`. Convert with `POST /v1/models/{modelId}:convert`; the body contains `targetFormats` and an optional `name`. Use the separate Animation routes for motion outputs.

For `POST /v1/models/{modelId}:animate`, send only animation selection and optional height. Use `scope` and `itemIds` only with `POST /v1/asset-packs/{assetPackId}:animate`.
Each accepted animation request can create another output; use a stable retry key when an integration may repeat an uncertain request.

## Asset Packs

Start with a natural-language `prompt`; Mint infers the category, shared style, count, and individual item plan. Use `itemCount`, `assetPackType`, or `styleGuide` only as optional overrides. If neither the field nor the prompt gives a count, Mint creates 8 assets. If no specialized category fits, Mint uses `general_asset_pack`. Preserve successful items when some fail.

Approving items that already started or finished reuses their current final work. Mint starts only requested Preview-ready items that have not started.

## Worlds

World generation supports Preview review/revision and failed-generation retry. Retrieve the World and its runtime files after success.

## Materials, Images, and Audio

Materials and Material Packs accept one `imageUrl`, not `sourceImages` or `generationMode`. Images support finished generation, non-destructive edits, and reference-image upload. Audio uses its operation-specific generation fields. Read OpenAPI for each exact schema.

## Shared generation rules

Worlds, 3D Models, Asset Packs, Materials, Material Packs, Images, and Audio have generation action routes. Read OpenAPI for the exact request schema.

- Use `name` for an optional human-readable Mint title. Do not send `displayName`.
- Omit `generationMode` for the recommended `auto` workflow. Set `review` only when explicit Preview inspection is required.
- Worlds, 3D Models, and Asset Packs accept one `imageUrl` or 2–8 `sourceImages`, never both.
- Materials and Material Packs accept one `imageUrl`, not `sourceImages`.
- Only 3D Models and Asset Packs accept `riggingPose: "t_pose" | "a_pose"`.

Public presets are `fast` for iteration and lower cost, `standard` for the balanced default, and `production` for the highest available quality. Provider model IDs are not part of the public contract.

## Poll

Handle:

- `queued` and `running`: keep polling.
- `preview_ready`: stop and request/perform the review decision.
- `billing_required`: show the required and available Credits plus `billing.actionUrl`. After billing is resolved, call `POST /v1/operations/{operationId}:resume` when a Preview or intermediate resource exists; otherwise retry the original request with the same `Idempotency-Key`.
- `succeeded`: retrieve the asset and its files.
- `partially_succeeded`: retrieve successful items and report failures.
- `failed`: inspect the problem and use an explicit retry action when supported.

An operation can remain `running` after provider work completes while its Credit reservation settles. Treat `succeeded` or `partially_succeeded` as final only when the operation exposes no reserved Credits.
- `canceled`: stop; do not silently restart.

Start near two seconds, use exponential backoff with jitter, cap around 15 seconds, and set a total deadline appropriate for the job. Prefer the `Location` header and operation ID returned by Mint.

## Review

Use operation `:approve` or `:revise` routes when tracking by operation ID. Operation approval has no request body; revision requires concrete `feedback`.

World and 3D Model approval also have no request body. Asset Pack approval optionally accepts `itemIds`. Route-specific revision bodies accept only fields relevant to that resource; 3D Model and Asset Pack revision can use `riggingPose`.

Never interpret silence as approval. If the user must choose whether to approve or revise, wait for an explicit answer.
