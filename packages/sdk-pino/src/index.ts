import build from "pino-abstract-transport";

interface OpenLogTransportOptions {
  /** OpenLog API endpoint URL (e.g., http://localhost:4000) */
  apiUrl: string;
  /** Project API key from OpenLog dashboard */
  apiKey: string;
  /** Service name to identify this application */
  service?: string;
  /** Environment (e.g., development, staging, production) */
  environment?: string;
  /** Batch size before flushing logs (default: 10) */
  batchSize?: number;
  /** Flush interval in milliseconds (default: 5000) */
  flushInterval?: number;
  /** Number of retry attempts on failure (default: 3) */
  retries?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

interface LogEntry {
  timestamp: Date;
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
  spanId?: string;
  service?: string;
  environment?: string;
  stackTrace?: string;
  duration?: number;
  statusCode?: number;
  path?: string;
  method?: string;
}

// Pino level numbers to strings
const levelMap: Record<number, string> = {
  10: "debug",
  20: "debug",
  30: "info",
  40: "warn",
  50: "error",
  60: "fatal",
};

export default function openlogTransport(options: OpenLogTransportOptions) {
  const {
    apiUrl,
    apiKey,
    service,
    environment,
    batchSize = 10,
    flushInterval = 5000,
    retries = 3,
    debug = false,
  } = options;

  if (!apiUrl) throw new Error("OpenLog transport: apiUrl is required");
  if (!apiKey) throw new Error("OpenLog transport: apiKey is required");

  const baseUrl = apiUrl.replace(/\/$/, "");
  let buffer: LogEntry[] = [];
  let flushTimer: ReturnType<typeof setInterval> | null = null;

  async function flush(): Promise<void> {
    if (buffer.length === 0) return;

    const logsToSend = [...buffer];
    buffer = [];

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${baseUrl}/api/ingest/batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({ logs: logsToSend }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (debug) {
          console.log(`[OpenLog] Sent ${logsToSend.length} logs successfully`);
        }
        return;
      } catch (error) {
        if (debug) {
          console.error(
            `[OpenLog] Attempt ${attempt}/${retries} failed:`,
            error
          );
        }

        if (attempt === retries) {
          buffer.unshift(...logsToSend);
        } else {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }
  }

  function startFlushTimer(): void {
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(() => flush(), flushInterval);
  }

  return build(
    async function (source) {
      startFlushTimer();

      for await (const obj of source) {
        const entry: LogEntry = {
          timestamp: new Date(obj.time || Date.now()),
          level: levelMap[obj.level] || "info",
          message: obj.msg || "",
          metadata: extractMetadata(obj),
          traceId: obj.traceId,
          spanId: obj.spanId,
          service: obj.service || service,
          environment: obj.environment || environment,
          stackTrace: obj.err?.stack || obj.stack,
          duration: obj.duration || obj.responseTime,
          statusCode: obj.statusCode || obj.res?.statusCode,
          path: obj.path || obj.req?.url,
          method: obj.method || obj.req?.method,
        };

        buffer.push(entry);

        if (buffer.length >= batchSize) {
          await flush();
        }
      }
    },
    {
      async close() {
        if (flushTimer) {
          clearInterval(flushTimer);
          flushTimer = null;
        }
        await flush();
      },
    }
  );
}

function extractMetadata(
  obj: Record<string, unknown>
): Record<string, unknown> {
  const excludeKeys = [
    "level",
    "time",
    "msg",
    "pid",
    "hostname",
    "traceId",
    "spanId",
    "service",
    "environment",
    "err",
    "stack",
    "duration",
    "responseTime",
    "statusCode",
    "res",
    "path",
    "req",
    "method",
  ];

  const metadata: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (!excludeKeys.includes(key)) {
      metadata[key] = value;
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : {};
}

export { OpenLogTransportOptions };
