import { TraceExporter } from '@google-cloud/opentelemetry-cloud-trace-exporter'
import { type Tracer, trace } from '@opentelemetry/api'
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node'
import { registerInstrumentations } from '@opentelemetry/instrumentation'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base'
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node'
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_HOST_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions/incubating'
import os from 'node:os'
import SquidObservabilityConfigs from 'squid-observability-configs'

const squidTracerUniqueSymbol = Symbol.for('squidTracerSingleton')

type GlobalWithTracer = typeof globalThis & {
  [squidTracerUniqueSymbol]?: Tracer
}

export function Configure(): Tracer {
  const globalWithTracer = globalThis as GlobalWithTracer

  if (!Reflect.has(globalThis, squidTracerUniqueSymbol)) {
    const exporter = new TraceExporter({
      projectId: SquidObservabilityConfigs.projectId,
      resourceFilter: /^(service\.name|service\.version|deployment\.environment(?:\.name)?|host\.name|service\.repository|service\.revision)$/,
      ...SquidObservabilityConfigs.credentials,
    })

    const provider = new NodeTracerProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: SquidObservabilityConfigs.serviceContext.applicationName,
        [ATTR_SERVICE_VERSION]: SquidObservabilityConfigs.serviceContext.version,
        [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: SquidObservabilityConfigs.serviceContext.environment,
        [ATTR_HOST_NAME]: os.hostname(),
        SERVICE_REPOSITORY: SquidObservabilityConfigs.sourceReference.repository,
        SERVICE_REVISION: SquidObservabilityConfigs.sourceReference.revisionId,
      }),
      spanProcessors: [new BatchSpanProcessor(exporter)],
    })

    provider.register()

    registerInstrumentations({
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-mongodb': {
            enhancedDatabaseReporting: true,
          },
        }),
      ],
      tracerProvider: provider,
    })

    globalWithTracer[squidTracerUniqueSymbol] = trace.getTracer(SquidObservabilityConfigs.serviceContext.applicationName)
  }

  return globalWithTracer[squidTracerUniqueSymbol]!
}
