var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var squid_tracer_exports = {};
__export(squid_tracer_exports, {
  Configure: () => Configure
});
module.exports = __toCommonJS(squid_tracer_exports);
var import_opentelemetry_cloud_trace_exporter = require("@google-cloud/opentelemetry-cloud-trace-exporter");
var import_api = require("@opentelemetry/api");
var import_auto_instrumentations_node = require("@opentelemetry/auto-instrumentations-node");
var import_instrumentation = require("@opentelemetry/instrumentation");
var import_resources = require("@opentelemetry/resources");
var import_sdk_trace_base = require("@opentelemetry/sdk-trace-base");
var import_sdk_trace_node = require("@opentelemetry/sdk-trace-node");
var import_semantic_conventions = require("@opentelemetry/semantic-conventions");
var import_node_os = __toESM(require("node:os"), 1);
var import_squid_observability_configs = __toESM(require("squid-observability-configs"), 1);
const squidTracerUniqueSymbol = /* @__PURE__ */ Symbol.for("squidTracerSingleton");
function Configure() {
  const globalWithTracer = globalThis;
  if (!Reflect.has(globalThis, squidTracerUniqueSymbol)) {
    const exporter = new import_opentelemetry_cloud_trace_exporter.TraceExporter({
      projectId: import_squid_observability_configs.default.projectId,
      resourceFilter: /^(service\.name|service\.version|deployment\.environment|host\.name|service\.repository|service\.revision)$/,
      ...import_squid_observability_configs.default.credentials
    });
    const provider = new import_sdk_trace_node.NodeTracerProvider({
      resource: (0, import_resources.resourceFromAttributes)({
        [import_semantic_conventions.SemanticResourceAttributes.SERVICE_NAME]: import_squid_observability_configs.default.serviceContext.applicationName,
        [import_semantic_conventions.SemanticResourceAttributes.SERVICE_VERSION]: import_squid_observability_configs.default.serviceContext.version,
        [import_semantic_conventions.SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: import_squid_observability_configs.default.serviceContext.environment,
        [import_semantic_conventions.SemanticResourceAttributes.HOST_NAME]: import_node_os.default.hostname(),
        SERVICE_REPOSITORY: import_squid_observability_configs.default.sourceReference.repository,
        SERVICE_REVISION: import_squid_observability_configs.default.sourceReference.revisionId
      }),
      spanProcessors: [new import_sdk_trace_base.BatchSpanProcessor(exporter)]
    });
    provider.register();
    (0, import_instrumentation.registerInstrumentations)({
      instrumentations: [
        (0, import_auto_instrumentations_node.getNodeAutoInstrumentations)({
          "@opentelemetry/instrumentation-mongodb": {
            enhancedDatabaseReporting: true
          }
        })
      ],
      tracerProvider: provider
    });
    globalWithTracer[squidTracerUniqueSymbol] = import_api.trace.getTracer(import_squid_observability_configs.default.serviceContext.applicationName);
  }
  return globalWithTracer[squidTracerUniqueSymbol];
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Configure
});
//# sourceMappingURL=squid-tracer.cjs.map