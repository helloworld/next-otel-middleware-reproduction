We are trying to create OpenTelemetry spans for incoming HTTP requests to the Next.js server. Next.js already creates spans for incoming HTTP requests to the Next.js server, but we are trying to create our own that are associated with the root spans created by the Next.js framework that have additional information about the request. Specifically, our goal is to record request and response headers and bodies.

We attemped to do this by creating a middleware that creates spans for incoming HTTP requests to the Next.js server. Unfortunately, this middleware is not working as expected:

- By fetching a tracer in `middleware.ts`, the Next.js framework seems to create a duplicate root span to the root span created by the Next.js framework (see [3] and [4]).

- When we attempt to get the tracer in `middleware.ts`, the returned object mirrors what one gets when Otel hasn't been initialized properly and does not match the tracer in `node.instrumentation.ts`` (see [1] and [2]).

- The spans created in `middleware.ts` don't end up getting exported. This is obviously because of the point above—the tracer we fetch is not the same as the one defined in `node.instrumentation.ts`

Any guidance on how to get Otel working within Next.js middleware or alternative suggestions (to create spans with request/response header/body information outside of middleware) would be greatly appreciated.

## Reproduction Steps

1. Run `npm install`.
2. Run `./reproduction.sh`. This will build the app, start the server, make an API request to `/api/hello`. All output will be logged to `output.log`.
3. Inspect the contents of `output.log`.

## Relevant Files

- [middleware.ts](src/middleware.ts) uses Otel within the middleware and attempts to create a span within the context of a request.
- [instrumentation.node.ts](src/instrumentation.node.ts) sets up the Otel Node SDK and initializes tracing.

## Relevant Output

[1] Tracer from `middleware.ts`:

https://github.com/helloworld/next-otel-middleware-reproduction/blob/master/output.log#L70-L75

```
Tracer from middleware: ProxyTracer {
  _provider: ProxyTracerProvider {  },
  name: 'test-app',
  version: undefined,
  options: undefined
}
```

[2] Tracer from `instrumentation.node.ts`:

https://github.com/helloworld/next-otel-middleware-reproduction/blob/master/output.log#L13-L69

```
Tracer from instrumentation.node.ts: <ref *1> Tracer {
  _tracerProvider: NodeTracerProvider {
    _registeredSpanProcessors: [ [SimpleSpanProcessor] ],
    _tracers: Map(1) { 'test-app@:' => [Circular *1] },
    resource: Resource {
      _attributes: [Object],
      asyncAttributesPending: true,
      _syncAttributes: [Object],
      _asyncAttributesPromise: [Promise]
    },
    _config: {
      sampler: [ParentBasedSampler],
      forceFlushTimeoutMillis: 30000,
      generalLimits: [Object],
      spanLimits: [Object],
      resource: [Resource]
    },
    activeSpanProcessor: MultiSpanProcessor { _spanProcessors: [Array] }
  },
  _sampler: ParentBasedSampler {
    _root: AlwaysOnSampler {},
    _remoteParentSampled: AlwaysOnSampler {},
    _remoteParentNotSampled: AlwaysOffSampler {},
    _localParentSampled: AlwaysOnSampler {},
    _localParentNotSampled: AlwaysOffSampler {}
  },
  _generalLimits: { attributeValueLengthLimit: Infinity, attributeCountLimit: 128 },
  _spanLimits: {
    attributeValueLengthLimit: Infinity,
    attributeCountLimit: 128,
    linkCountLimit: 128,
    eventCountLimit: 128,
    attributePerEventCountLimit: 128,
    attributePerLinkCountLimit: 128
  },
  _idGenerator: RandomIdGenerator {
    generateTraceId: [Function: generateId],
    generateSpanId: [Function: generateId]
  },
  resource: Resource {
    _attributes: {
      'service.name': 'test-app',
      'telemetry.sdk.language': 'nodejs',
      'telemetry.sdk.name': 'opentelemetry',
      'telemetry.sdk.version': '1.17.0'
    },
    asyncAttributesPending: true,
    _syncAttributes: {
      'service.name': 'test-app',
      'telemetry.sdk.language': 'nodejs',
      'telemetry.sdk.name': 'opentelemetry',
      'telemetry.sdk.version': '1.17.0'
    },
    _asyncAttributesPromise: Promise { <pending> }
  },
  instrumentationLibrary: { name: 'test-app', version: undefined, schemaUrl: undefined }
}
```

[3] Span from `middleware.ts`

https://github.com/helloworld/next-otel-middleware-reproduction/blob/master/output.log#L76-L95

[4] Span from Next.js framework

https://github.com/helloworld/next-otel-middleware-reproduction/blob/master/output.log#L171-L192
