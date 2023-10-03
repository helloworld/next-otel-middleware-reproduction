import { trace, context, SpanKind } from "@opentelemetry/api";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Get the tracer
  // This tracer is _not_ the same one that is initializer in instrumentation.node.ts
  const tracer = trace.getTracer("test-app");
  console.log("Tracer from middleware:", tracer);

  // Create a span
  const span = tracer.startSpan(
    "NEXT_DEBUG",
    {
      kind: SpanKind.SERVER,
    },
    context.active()
  );

  const ctx = trace.setSpan(context.active(), span);

  return await context.with(ctx, async () => {
    const response = NextResponse.next();
    span.end();
    return response;
  });
}
