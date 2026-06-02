import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";

import type { WhitelistRole } from "@/lib/types";
import { getRequestIp, getStatusText } from "@/lib/http";

const CRON_RATE_LIMIT_KEY_PREFIX = "cron:";
const CRON_RATE_LIMIT_DURATION = 4 * 60 * 60 * 1000;
const CRON_RATE_LIMIT_MAX = 200;
const DEFAULT_RATE_LIMIT_DURATION = 60000;
const DEFAULT_RATE_LIMIT_MAX = 10;

const errorResponse = new Response(
  JSON.stringify({
    message: "Too many requests, please try again later.",
    status: getStatusText(429),
  }),
  {
    headers: { "Content-Type": "application/json" },
    status: 429,
  },
);

export const rateLimitMiddleware = (app: Elysia) =>
  app
    .use(
      rateLimit({
        duration: CRON_RATE_LIMIT_DURATION,
        max: CRON_RATE_LIMIT_MAX,
        generator: (
          request,
          server,
          { whitelistRole }: { whitelistRole: WhitelistRole | null },
        ) => {
          const requestIp =
            getRequestIp({ headers: request.headers, server, request }) ?? "";
          return whitelistRole === "cron"
            ? `${CRON_RATE_LIMIT_KEY_PREFIX}${requestIp}`
            : requestIp;
        },
        skip: (_request, key) => !key?.startsWith(CRON_RATE_LIMIT_KEY_PREFIX),
        errorResponse,
      }),
    )
    .use(
      rateLimit({
        duration: DEFAULT_RATE_LIMIT_DURATION,
        max: DEFAULT_RATE_LIMIT_MAX,
        generator: (
          request,
          server,
          { whitelistRole }: { whitelistRole: WhitelistRole | null },
        ) => {
          const requestIp =
            getRequestIp({ headers: request.headers, server, request }) ?? "";
          return whitelistRole === "cron"
            ? `${CRON_RATE_LIMIT_KEY_PREFIX}${requestIp}`
            : requestIp;
        },
        skip: (_request, key) => key?.startsWith(CRON_RATE_LIMIT_KEY_PREFIX) ?? false,
        errorResponse,
      }),
    );
