import Transport, { TransportStreamOptions } from "winston-transport";

interface OpenLogTransportOptions extends TransportStreamOptions {
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

export class OpenLogTransport extends Transport {
  private apiUrl: string;
  private apiKey: string;
  private service?: string;
  private environment?: string;
  private batchSize: number;
  private flushInterval: number;
  private retries: number;
  private debug: boolean;
  private buffer: LogEntry[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor(options: OpenLogTransportOptions) {
    super(options);

    if (!options.apiUrl) {
      throw new Error("OpenLogTransport: apiUrl is required");
    }
    if (!options.apiKey) {
      throw new Error("OpenLogTransport: apiKey is required");
    }

    this.apiUrl = options.apiUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = options.apiKey;
    this.service = options.service;
    this.environment = options.environment;
    this.batchSize = options.batchSize ?? 10;
    this.flushInterval = options.flushInterval ?? 5000;
    this.retries = options.retries ?? 3;
    this.debug = options.debug ?? false;

    // Start flush timer
    this.startFlushTimer();
  }

  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  log(info: Record<string, unknown>, callback: () => void): void {
    setImmediate(() => {
      this.emit("logged", info);
    });

    const entry: LogEntry = {
      timestamp: new Date(),
      level: (info.level as string) || "info",
      message: (info.message as string) || "",
      metadata: this.extractMetadata(info),
      traceId: info.traceId as string | undefined,
      spanId: info.spanId as string | undefined,
      service: (info.service as string) || this.service,
      environment: (info.environment as string) || this.environment,
      stackTrace: info.stack as string | undefined,
      duration: info.duration as number | undefined,
      statusCode: info.statusCode as number | undefined,
      path: info.path as string | undefined,
      method: info.method as string | undefined,
    };

    this.buffer.push(entry);

    if (this.buffer.length >= this.batchSize) {
      this.flush();
    }

    callback();
  }

  private extractMetadata(
    info: Record<string, unknown>
  ): Record<string, unknown> {
    const excludeKeys = [
      "level",
      "message",
      "timestamp",
      "traceId",
      "spanId",
      "service",
      "environment",
      "stack",
      "duration",
      "statusCode",
      "path",
      "method",
    ];

    const metadata: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(info)) {
      if (!excludeKeys.includes(key)) {
        metadata[key] = value;
      }
    }

    return Object.keys(metadata).length > 0 ? metadata : {};
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const logsToSend = [...this.buffer];
    this.buffer = [];

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const response = await fetch(`${this.apiUrl}/api/ingest/batch`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": this.apiKey,
          },
          body: JSON.stringify({ logs: logsToSend }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        if (this.debug) {
          console.log(`[OpenLog] Sent ${logsToSend.length} logs successfully`);
        }

        return;
      } catch (error) {
        if (this.debug) {
          console.error(
            `[OpenLog] Attempt ${attempt}/${this.retries} failed:`,
            error
          );
        }

        if (attempt === this.retries) {
          // Put logs back in buffer after all retries failed
          this.buffer.unshift(...logsToSend);
          this.emit("error", error);
        } else {
          // Wait before retrying (exponential backoff)
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    await this.flush();
  }
}

export default OpenLogTransport;
