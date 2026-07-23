#!/usr/bin/env node

import { mintApiRequest } from "./api-client.mjs";

export async function checkMintConnection(options = {}) {
  const [{ body: identity }, { body: usage }] = await Promise.all([
    mintApiRequest("/me", options),
    mintApiRequest("/usage", options),
  ]);
  return { identity, usage };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  checkMintConnection()
    .then(({ identity, usage }) => {
      console.log(
        JSON.stringify(
          {
            connected: true,
            apiKey: identity?.apiKey ?? null,
            owner: identity?.owner ?? null,
            credits: usage?.credits ?? null,
          },
          null,
          2,
        ),
      );
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : String(error));
      process.exitCode = 1;
    });
}
