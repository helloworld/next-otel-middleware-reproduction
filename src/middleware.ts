import { trace } from "@opentelemetry/api";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  // Get the tracer
  // This tracer is _not_ the same one that is initializer in instrumentation.node.ts
  const tracer = trace.getTracer("test-app");
  console.log("Tracer from middleware:", tracer);

  return NextResponse.next();
}
