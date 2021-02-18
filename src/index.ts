// This file is part of cxsd, copyright (c) 2015-2016 BusFaster Ltd.
// Released under the MIT license, see LICENSE.

import "source-map-support/register";

import { Cache, FetchOptions } from "@wikipathways/cget";

import { Context } from "./xsd/Context";
import { Namespace } from "./xsd/Namespace";
import { Loader } from "./xsd/Loader";
import { exportNamespace } from "./xsd/Exporter";
import { AddImports } from "./schema/transform/AddImports";
import { Sanitize } from "./schema/transform/Sanitize";
import * as schema from "./schema";

interface IOptions {
  allowLocal: boolean;
  forceHost?: string;
  forcePort?: number;
  outJs: string;
  outTs: string;
}

const applyDefaultOptions = (partialOptions: Partial<IOptions>) => {
  const newOptions = partialOptions;

  if(partialOptions.allowLocal == undefined) {
    newOptions.allowLocal = true;
  }

  if(partialOptions.outJs == undefined) {
    newOptions.outJs = "xmlns";
  }

  if(partialOptions.outTs == undefined) {
    newOptions.outTs = "xmlns";
  }

  return newOptions as IOptions;
};

export default async function handleConvert(schemaFile: string, opts: Partial<IOptions>) {
  const { outTs, outJs, ...fetchOptions } = applyDefaultOptions(opts);

  var schemaContext = new schema.Context();
  var xsdContext = new Context(schemaContext);

  if (fetchOptions.forceHost !== undefined) {
    Cache.patchRequest();
  }

  var jsCache = new Cache(outJs, { indexName: "_index.js" });
  var tsCache = new Cache(outTs, { indexName: "_index.d.ts" });

  var loader = new Loader(xsdContext, fetchOptions);

  const namespace = await loader.import(schemaFile);

  try {
    exportNamespace(xsdContext.primitiveSpace, schemaContext);
    exportNamespace(xsdContext.xmlSpace, schemaContext);

    var spec = exportNamespace(namespace, schemaContext);

    var addImports = new AddImports(spec);
    var sanitize = new Sanitize(spec);

    // Find ID numbers of all types imported from other namespaces.
    var importsAdded = await addImports.exec();
    // Rename types to valid JavaScript class names, adding a prefix or suffix to duplicates.
    await sanitize.exec();
    await sanitize.finish();
    await addImports.finish(importsAdded);
    new schema.JS(spec, jsCache).exec();
    new schema.TS(spec, tsCache).exec();
  } catch (err) {
    console.error(err);
    console.log("Stack:");
    console.error(err.stack);
  }
}
