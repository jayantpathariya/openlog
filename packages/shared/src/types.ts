// ============================================================================
// LOG TYPES
// ============================================================================

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  id?: string;
  timestamp: Date | string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, unknown>;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  service?: string;
  environment?: string;
  stackTrace?: string;
  tags?: string[];
  duration?: number;
  statusCode?: number;
  path?: string;
  method?: string;
  userId?: string;
}

export interface LogBatch {
  logs: LogEntry[];
}

// ============================================================================
// PROJECT TYPES
// ============================================================================

export interface Project {
  id: string;
  name: string;
  description?: string;
  apiKey: string;
  userId: string;
  settings?: ProjectSettings;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ProjectSettings {
  retentionDays?: number;
  environments?: string[];
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  isAdmin: boolean;
  createdAt: Date | string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsOverview {
  totalLogs: number;
  errorCount: number;
  errorRate: number;
  logsByLevel: Record<LogLevel, number>;
  topServices: Array<{ service: string; count: number }>;
  recentErrors: LogEntry[];
}

export interface TimeSeriesPoint {
  timestamp: string;
  count: number;
  errorCount?: number;
}

export interface ServiceMetrics {
  service: string;
  totalLogs: number;
  errorCount: number;
  errorRate: number;
  avgDuration?: number;
  lastActive?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface LogQuery {
  projectId: string;
  search?: string;
  levels?: LogLevel[];
  services?: string[];
  environments?: string[];
  traceId?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

export interface SavedSearch {
  id: string;
  userId: string;
  projectId: string;
  name: string;
  query: LogQuery;
  createdAt: Date | string;
}
