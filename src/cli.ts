#!/usr/bin/env node
// This file is part of cxsd, copyright (c) 2015-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import "source-map-support/register";

import * as cmd from "commander";
import handleConvert from "./";

cmd.version(require("../package.json").version)
  .arguments("<url>")
  .description("XSD download and conversion tool")
  .option(
    "-L, --allow-local <boolean> (default true)",
    "Allow or disallow fetching files from local filesystem"
  )
  .option(
    "-H, --force-host <host>",
    'Fetch all xsd files from <host>\n    (original host is passed in GET parameter "host")'
  )
  .option(
    "-P, --force-port <port>",
    "Connect to <port> when using --force-host"
  )
  // .option('-c, --cache-xsd <path>', 'Cache downloaded XSD filed under <path>')
  .option("-t, --out-ts <path>", "Output TypeScript definitions under <path>")
  .option("-j, --out-js <path>", "Output JavaScript modules under <path>")
  .action(handleConvert)
  .parse(process.argv);

if (process.argv.length < 3) cmd.help();