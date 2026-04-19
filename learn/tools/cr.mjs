#!/usr/bin/env node

import { runCli } from "./review-html.js";

runCli(process.argv.slice(2)).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`cr: ${message}`);
  process.exit(2);
});
