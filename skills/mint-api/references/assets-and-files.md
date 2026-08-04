# Assets And Files

`GET /v1/assets` is the unified account catalog. Typed routes read Worlds, 3D Models, Asset Packs, Materials, Images, Audio, and reference images.

API-created assets belong to the Mint account and can appear through the API, Mint MCP, and Mint. The operation or API key that created an asset is not its ownership boundary.

When work creates an asset, `operation.resource` provides its Mint type and ID. Operations do not include `mintUrl`; retrieve the asset or its file manifest for human-facing and download links.

Operation responses contain only fields relevant to that operation. Treat them as compact lifecycle status objects; do not expect World operations to contain Model conversion or file metadata.

Persist asset IDs. Do not treat an operation ID, provider request ID, or transient download URL as the asset identity.

Permanently delete an account-owned asset with
`DELETE /v1/assets/{assetId}`. It covers Worlds, 3D Models, Asset Packs,
Materials, Material Packs, Images, Audio, and reference images created through
the API, Mint MCP, or Mint. Success is bodyless `204`; a missing, malformed,
foreign, or already deleted ID is `404 asset-not-found`. Active generation or
derivative work returns `409 asset-has-active-work`, so wait and retry.
Deletion does not use `Idempotency-Key`; a repeated successful deletion
naturally becomes `404`.

Pack deletion cascades to direct items: deleting an Asset Pack also deletes its
direct Models, and deleting a Material Pack also deletes its direct Materials.
Independently cataloged derivatives such as Image edits and smart-topology
Models survive deletion of their source or pack with obsolete links cleared.
Deleting one Asset Pack output remains target-only and preserves its source pack
and Models. Physical file cleanup may continue asynchronously after the logical
asset disappears.

Mint calls an individual downloadable file an artifact in route and field names. Treat it as a file belonging to the asset, not as a separate resource workflow. Discover deliverables through:

- `/v1/assets/{assetType}/{assetId}/artifacts`
- `/v1/assets/{assetType}/{assetId}/artifact-manifest`
- `/v1/assets/{assetType}/{assetId}/artifacts/{artifactId}`
- `/v1/artifact-manifests` for supported batches

Manifests provide filenames, MIME types, sizes when known, and download URLs. Refresh a manifest if a URL expires or a derivative finishes later.

World manifests use `integrationMode: "remote_stream"`. Load the RAD stream from
`runtime.runtimeUrl` and the invisible collider from
`runtime.collider.runtimeUrl`. The `artifacts` array contains the available
Preview image; it intentionally does not duplicate the streamed runtime files.

For model derivatives, preserve the original model and use returned derivative fields or related resources. For Asset Packs, inspect item status and preserve successful files during partial failure.
