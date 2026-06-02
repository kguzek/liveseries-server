import type { Context } from "elysia";

import type { StatusCode } from "./types";
import { STATUS_CODES } from "./constants";

/** Extracts the request's originating IP address, taking into account proxies. */
export function getRequestIp(
  ctx: Pick<Context, "headers" | "server" | "request"> | Pick<Request, "headers">,
) {
  const headers = ctx.headers;
  const ipHeader =
    headers instanceof Headers
      ? headers.get("cf-connecting-ip") || headers.get("x-forwarded-for")
      : headers["cf-connecting-ip"] || headers["x-forwarded-for"];
  if (!ipHeader)
    return "server" in ctx
      ? ctx.server?.requestIP(ctx.request)?.address.replace(/^::ffff:/, "")
      : undefined;
  if (Array.isArray(ipHeader)) return ipHeader[0];
  return ipHeader.split(",")[0].trim();
}

/** Returns the code followed by the status code name according to RFC2616 § 10 */
export const getStatusText = (code?: number | string) =>
  typeof code === "string" && code
    ? code
    : !code
      ? "<Unknown>"
      : `${code} ${
          code in STATUS_CODES ? STATUS_CODES[code as StatusCode] : "<Unknown>"
        }`;

/** Returns mkv, mp4 or avi if the input filename ends with either of those, or undefined. */
export const getVideoExtension = (filename: string) =>
  filename.match(/\.(mkv|mp4|avi)$/)?.[1];

/** Sets the Cache-Control header in the response so that browsers will be able to cache it for a maximum of `maxAgeMinutes` minutes. */
export const setCacheControl = (ctx: Pick<Context, "headers">, maxAgeMinutes: number) =>
  (ctx.headers["Cache-Control"] = `public, max-age=${maxAgeMinutes * 60}`);
