#!/usr/bin/env node

import { runCli } from "./code-review-engine.js";

runCli(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`code-review: ${message}`);
  process.exit(2);
});
