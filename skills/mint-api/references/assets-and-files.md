# Assets And Files

`GET /v1/assets` is the unified account catalog. Typed routes read Worlds, 3D Models, Asset Packs, Materials, Images, Audio, reference images, and Studio projects.

API-created assets belong to the Mint account and can appear through the API, Mint MCP, and Mint. The operation or API key that created an asset is not its ownership boundary.

When work creates an asset, `operation.resource` provides its Mint type and ID. Operations do not include `mintUrl`; retrieve the asset or its file manifest for human-facing and download links.

Operation responses contain only fields relevant to that operation. Treat them as compact lifecycle status objects; do not expect World operations to contain Model conversion or file metadata.

Persist asset IDs. Do not treat an operation ID, provider request ID, or transient download URL as the asset identity.

Mint calls an individual downloadable file an artifact in route and field names. Treat it as a file belonging to the asset, not as a separate resource workflow. Discover deliverables through:

- `/v1/assets/{assetType}/{assetId}/artifacts`
- `/v1/assets/{assetType}/{assetId}/artifact-manifest`
- `/v1/assets/{assetType}/{assetId}/artifacts/{artifactId}`
- `/v1/artifact-manifests` for supported batches

Manifests provide filenames, MIME types, sizes when known, and download URLs. Refresh a manifest if a URL expires or a derivative finishes later.

For model derivatives, preserve the original model and use returned derivative fields or related resources. For Asset Packs, inspect item status and preserve successful files during partial failure.
