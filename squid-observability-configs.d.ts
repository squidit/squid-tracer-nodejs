declare module 'squid-observability-configs' {
  interface SquidObservabilityConfigsExports {
    readonly projectId: string
    readonly credentials: Record<string, unknown>
    readonly serviceContext: {
      readonly applicationName: string
      readonly environment: string
      readonly service: string
      readonly version: string
    }
    readonly sourceReference: {
      readonly repository: string
      readonly revisionId: string
    }
  }
  const SquidObservabilityConfigs: SquidObservabilityConfigsExports
  export default SquidObservabilityConfigs
}
