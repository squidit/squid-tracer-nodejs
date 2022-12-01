const os                              = require('os');

const OpenTelemetryApi                = require('@opentelemetry/api');
const { NodeTracerProvider }          = require('@opentelemetry/sdk-trace-node');
const { Resource }                    = require('@opentelemetry/resources');
const { BatchSpanProcessor }          = require('@opentelemetry/sdk-trace-base');
const { TraceExporter }               = require('@google-cloud/opentelemetry-cloud-trace-exporter');
const { registerInstrumentations }    = require('@opentelemetry/instrumentation');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { SemanticResourceAttributes }  = require('@opentelemetry/semantic-conventions');

const { SquidError }                  = require('./libraries/squid-error-nodejs/squid_error');

const squidTracerUniqueSymbol = Symbol.for('squidTracerSingleton');
const globalSymbols = Object.getOwnPropertySymbols(global);

let tracerSingleton;

function Configure (enabled, projectId, googleCloudCredentials, environment, applicationName, version, applicationRepository, applicationRevisionId)
{
  if (enabled !== true)
    return;

  const hasSymbol = (globalSymbols.indexOf(squidTracerUniqueSymbol) > -1);

  if (!hasSymbol)
  {
    let credentials = {};

    if (typeof googleCloudCredentials === 'string' || googleCloudCredentials instanceof String)
    {
      try
      {
        credentials = {
          credentials : JSON.parse(googleCloudCredentials)
        };
      }
      catch (error)
      {
        credentials = {
          keyFile     : googleCloudCredentials,
          keyFilename : googleCloudCredentials
        };
      }
    }
    else if (typeof googleCloudCredentials === 'object' && googleCloudCredentials !== null)
    {
      credentials = {
        credentials : googleCloudCredentials
      };
    }
    else
    {
      throw SquidError.Create({
        message : 'Invalid credentials provided for the Squid Tracer library',
        code    : 'SQUID_TRACER_INVALID_CREDENTIALS',
        detail  : googleCloudCredentials,
        id      : 0
      });
    }

    const exporter = new TraceExporter({
      projectId      : projectId,
      resourceFilter : /^(service\.name|service\.version|deployment\.environment|host\.name|service\.repository|service\.revision)$/,
      ...credentials
    });

    const provider = new NodeTracerProvider({
      resource : new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]           : applicationName,
        [SemanticResourceAttributes.SERVICE_VERSION]        : version,
        [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT] : environment,
        [SemanticResourceAttributes.HOST_NAME]              : os.hostname(),
        SERVICE_REPOSITORY                                  : applicationRepository,
        SERVICE_REVISION                                    : applicationRevisionId
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

    tracerSingleton = OpenTelemetryApi.trace.getTracer(applicationName);
  }

  return tracerSingleton;
};

// maybe expose the tracer singleton object?
// exports.squidTracer = tracerSingleton;

exports.Configure = Configure;
