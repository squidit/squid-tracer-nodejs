const os                              = require('os');

const OpenTelemetryApi                = require('@opentelemetry/api');
const { NodeTracerProvider }          = require('@opentelemetry/sdk-trace-node');
const { Resource }                    = require('@opentelemetry/resources');
const { BatchSpanProcessor }          = require('@opentelemetry/sdk-trace-base');
const { TraceExporter }               = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const { registerInstrumentations }    = require('@opentelemetry/instrumentation');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { SemanticResourceAttributes }  = require('@opentelemetry/semantic-conventions');

const squidTracerUniqueSymbol = Symbol.for('squidTracerSingleton');
const globalSymbols = Object.getOwnPropertySymbols(global);

const SquidObservabilityConfigs = require('./libraries/squid-observability-configs/squid_observability_configs');

function Configure (enabled)
{
  if (enabled !== true)
    return;

  const hasSymbol = (globalSymbols.indexOf(squidTracerUniqueSymbol) > -1);

  if (!hasSymbol)
  {
    const exporter = new TraceExporter({
      projectId      : SquidObservabilityConfigs.projectId,
      resourceFilter : /^(service\.name|service\.version|deployment\.environment|host\.name|service\.repository|service\.revision)$/,
      ...SquidObservabilityConfigs.credentials
    });

    const provider = new NodeTracerProvider({
      resource : new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]           : SquidObservabilityConfigs.serviceContext.applicationName,
        [SemanticResourceAttributes.SERVICE_VERSION]        : SquidObservabilityConfigs.serviceContext.version,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT] : SquidObservabilityConfigs.serviceContext.environment,
        [SemanticResourceAttributes.HOST_NAME]              : os.hostname(),
        SERVICE_REPOSITORY                                  : SquidObservabilityConfigs.sourceReference.repository,
        SERVICE_REVISION                                    : SquidObservabilityConfigs.sourceReference.revisionId
      })
    });

    // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
    provider.register();
    provider.addSpanProcessor(new BatchSpanProcessor(exporter));

    registerInstrumentations({
      instrumentations : [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-mongodb' : {
            enhancedDatabaseReporting : true
          }
        })
      ],

      tracerProvider : provider
    });

    global[squidTracerUniqueSymbol] = OpenTelemetryApi.trace.getTracer(SquidObservabilityConfigs.serviceContext.applicationName);
  }

  return global[squidTracerUniqueSymbol];
};

// maybe expose the tracer singleton object?
// exports.squidTracer = global[squidTracerUniqueSymbol];

exports.Configure = Configure;
