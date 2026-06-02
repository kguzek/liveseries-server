import { Elysia } from "elysia";
import { rateLimit } from "elysia-rate-limit";

import type { WhitelistRole } from "@/lib/types";
import { getStatusText } from "@/lib/http";

const CRON_RATE_LIMIT_KEY_PREFIX = "cron:";
const CRON_RATE_LIMIT_DURATION = 4 * 60 * 60 * 1000;
const CRON_RATE_LIMIT_MAX = 200;
const DEFAULT_RATE_LIMIT_DURATION = 60000;
const DEFAULT_RATE_LIMIT_MAX = 10;

export const rateLimitMiddleware = (app: Elysia) =>
  app.use(
    rateLimit({
      duration: (key) =>
        key.startsWith(CRON_RATE_LIMIT_KEY_PREFIX)
          ? CRON_RATE_LIMIT_DURATION
          : DEFAULT_RATE_LIMIT_DURATION,
      max: (key) =>
        key.startsWith(CRON_RATE_LIMIT_KEY_PREFIX)
          ? CRON_RATE_LIMIT_MAX
          : DEFAULT_RATE_LIMIT_MAX,
      generator: (
        request,
        server,
        { whitelistRole }: { whitelistRole: WhitelistRole | null },
      ) => {
        const requestIp = server?.requestIP(request)?.address ?? "";
        return whitelistRole === "cron"
          ? `${CRON_RATE_LIMIT_KEY_PREFIX}${requestIp}`
          : requestIp;
      },
      errorResponse: new Response(
        JSON.stringify({
          message: "Too many requests, please try again later.",
          status: getStatusText(429),
        }),
        {
          headers: { "Content-Type": "application/json" },
          status: 429,
        },
      ),
    }),
  );
