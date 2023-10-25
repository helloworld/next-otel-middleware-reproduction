// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { trace, SpanKind, context, Span } from "@opentelemetry/api";
import { ClientRequest, ServerResponse } from "http";
import axios from "axios";

type THandler =
  | ((req: NextApiRequest, res: NextApiResponse<unknown>) => void)
  | ((req: NextApiRequest, res: NextApiResponse<unknown>) => Promise<void>);

function handleOutgoingMesssage(
  httpObject: ClientRequest | ServerResponse,
  span: Span
) {
  const spanBodyAttrName = "http.response.body";

  const httpBodyChunks: any = [];
  const oldWrite = httpObject.write.bind(httpObject);
  const oldEnd = httpObject.end.bind(httpObject);

  // @ts-expect-error Both are writeable streams
  httpObject.write = (data, encoding, callback) => {
    httpBodyChunks.push(Buffer.from(data));

    return oldWrite(data, encoding, callback);
  };

  // @ts-expect-error Both are writeable streams
  httpObject.end = (data, encoding, callback) => {
    if (data) {
      httpBodyChunks.push(Buffer.from(data));
    }

    if (httpBodyChunks.length !== 0) {
      span.setAttribute(spanBodyAttrName, handleHttpBody(httpBodyChunks));
    }
    return oldEnd(data, encoding, callback);
  };
}

export function handleHttpBody(httpBodyChunks: Array<Buffer>) {
  let body = Buffer.concat(httpBodyChunks) || "{}";
  return body.toString("utf-8" as BufferEncoding) || "{}";
}

export function __wrap(originalHandler: THandler): THandler {
  return async (req: NextApiRequest, res: NextApiResponse<unknown>) => {
    console.log("Request recorded");

    const tracer = trace.getTracer("@usepreflight/trace");
    const span = tracer.startSpan("ROOT_HTTP_REQUEST_DATA", {
      kind: SpanKind.SERVER,
    });

    trace.setSpan(context.active(), span);

    try {
      handleOutgoingMesssage(res, span);
    } catch (err) {
      console.error("Error with httpResponseHook", err);
    }

    try {
      return originalHandler(req, res);
    } finally {
      span.end();
    }
  };
}

export default __wrap(async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const response = await axios.get(`https://api.github.com/users/helloworld`);
  res.status(200).json(response.data);
});
