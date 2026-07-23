#!/usr/bin/env node

import { pollMintOperation } from "./api-client.mjs";

const operationId = process.argv[2];

pollMintOperation(operationId)
  .then((operation) => console.log(JSON.stringify(operation, null, 2)))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
