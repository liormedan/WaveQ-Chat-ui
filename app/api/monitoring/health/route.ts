import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authConfig } from '@/app/(auth)/auth.config';

// Health check response types
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  responseTime: number;
  uptime: number;
  environment: string;
  version: string;
  checks: {
    database: DatabaseCheck;
    external: ExternalServiceCheck[];
    system: SystemCheck;
  };
  metrics: {
    memory: MemoryMetrics;
    performance: PerformanceMetrics;
  };
}

interface DatabaseCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  connectionPool: {
    active: number;
    idle: number;
    total: number;
  };
}

interface ExternalServiceCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  endpoint: string;
  error?: string;
}

interface SystemCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  cpu: {
    usage: number;
    load: number;
  };
  memory: {
    used: number;
    total: number;
    free: number;
  };
  disk: {
    used: number;
    total: number;
    free: number;
  };
}

interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  rss: number;
}

interface PerformanceMetrics {
  averageResponseTime: number;
  requestsPerSecond: number;
  errorRate: number;
  activeConnections: number;
}

/**
 * Enhanced health check endpoint
 */
export async function GET() {
  const startTime = Date.now();

  try {
    // Basic system information
    const uptime = process.uptime();
    const environment = process.env.NODE_ENV || 'development';
    const version = process.env.npm_package_version || '1.0.0';

    // Check database connectivity
    const databaseCheck = await checkDatabase();

    // Check external services
    const externalChecks = await checkExternalServices();

    // Check system resources
    const systemCheck = await checkSystemResources();

    // Calculate overall status
    const overallStatus = calculateOverallStatus([
      databaseCheck.status,
      ...externalChecks.map((check) => check.status),
      systemCheck.status,
    ]);

    const responseTime = Date.now() - startTime;

    // Get memory metrics
    const memoryMetrics = getMemoryMetrics();

    // Get performance metrics (simulated for now)
    const performanceMetrics = getPerformanceMetrics();

    const response: HealthCheckResponse = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime,
      uptime,
      environment,
      version,
      checks: {
        database: databaseCheck,
        external: externalChecks,
        system: systemCheck,
      },
      metrics: {
        memory: memoryMetrics,
        performance: performanceMetrics,
      },
    };

    return NextResponse.json(response, {
      status: overallStatus === 'unhealthy' ? 503 : 200,
    });
  } catch (error) {
    console.error('Health check failed:', error);

    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        error: 'Health check failed',
        checks: {
          database: {
            status: 'unhealthy',
            responseTime: -1,
            connectionPool: { active: 0, idle: 0, total: 0 },
          },
          external: [],
          system: {
            status: 'unhealthy',
            cpu: { usage: 0, load: 0 },
            memory: { used: 0, total: 0, free: 0 },
            disk: { used: 0, total: 0, free: 0 },
          },
        },
        metrics: {
          memory: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 },
          performance: {
            averageResponseTime: 0,
            requestsPerSecond: 0,
            errorRate: 0,
            activeConnections: 0,
          },
        },
      },
      { status: 503 },
    );
  }
}

/**
 * Lightweight health check for network monitoring
 */
export async function HEAD() {
  try {
    const startTime = Date.now();

    // Quick database check
    const dbCheck = await checkDatabase();
    const responseTime = Date.now() - startTime;

    const status = dbCheck.status === 'unhealthy' ? 503 : 200;

    return new NextResponse(null, {
      status,
      headers: {
        'X-Response-Time': responseTime.toString(),
        'X-Health-Status': dbCheck.status,
      },
    });
  } catch (error) {
    return new NextResponse(null, { status: 503 });
  }
}

/**
 * Check database connectivity and performance
 */
async function checkDatabase(): Promise<DatabaseCheck> {
  const startTime = Date.now();

  try {
    // Import database utilities
    const { db } = await import('@/lib/db/schema');

    // Simple query to test connectivity
    const result = await db.execute('SELECT 1 as test');

    const responseTime = Date.now() - startTime;

    // Determine status based on response time
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (responseTime > 5000) {
      status = 'unhealthy';
    } else if (responseTime > 1000) {
      status = 'degraded';
    }

    return {
      status,
      responseTime,
      connectionPool: {
        active: 1, // Placeholder - would need actual pool metrics
        idle: 5,
        total: 6,
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      connectionPool: {
        active: 0,
        idle: 0,
        total: 0,
      },
    };
  }
}

/**
 * Check external services
 */
async function checkExternalServices(): Promise<ExternalServiceCheck[]> {
  const services = [
    {
      name: 'Auth Service',
      endpoint: '/api/auth/session',
    },
    {
      name: 'Chat API',
      endpoint: '/api/chat',
    },
  ];

  const checks: ExternalServiceCheck[] = [];

  for (const service of services) {
    try {
      const startTime = Date.now();
      const response = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}${service.endpoint}`,
        {
          method: 'HEAD',
          headers: {
            'User-Agent': 'Health-Check/1.0',
          },
        },
      );

      const responseTime = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      if (!response.ok) {
        status = 'unhealthy';
      } else if (responseTime > 2000) {
        status = 'degraded';
      }

      checks.push({
        name: service.name,
        status,
        responseTime,
        endpoint: service.endpoint,
      });
    } catch (error) {
      checks.push({
        name: service.name,
        status: 'unhealthy',
        responseTime: -1,
        endpoint: service.endpoint,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return checks;
}

/**
 * Check system resources
 */
async function checkSystemResources(): Promise<SystemCheck> {
  const memUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  // Calculate memory usage percentages
  const memoryUsed = memUsage.heapUsed;
  const memoryTotal = memUsage.heapTotal;
  const memoryFree = memoryTotal - memoryUsed;

  // Determine memory status
  const memoryUsagePercent = (memoryUsed / memoryTotal) * 100;
  let memoryStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (memoryUsagePercent > 90) {
    memoryStatus = 'unhealthy';
  } else if (memoryUsagePercent > 75) {
    memoryStatus = 'degraded';
  }

  // Simulate CPU and disk metrics (in a real app, you'd use system monitoring libraries)
  const cpuUsagePercent = Math.random() * 30; // Simulated CPU usage
  const diskUsagePercent = Math.random() * 60; // Simulated disk usage

  let systemStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
  if (memoryStatus === 'unhealthy' || cpuUsagePercent > 80) {
    systemStatus = 'unhealthy';
  } else if (memoryStatus === 'degraded' || cpuUsagePercent > 60) {
    systemStatus = 'degraded';
  }

  return {
    status: systemStatus,
    cpu: {
      usage: cpuUsagePercent,
      load: cpuUsagePercent / 100,
    },
    memory: {
      used: memoryUsed,
      total: memoryTotal,
      free: memoryFree,
    },
    disk: {
      used: diskUsagePercent * 1000000000, // Simulated disk usage
      total: 1000000000000, // 1TB
      free: (100 - diskUsagePercent) * 10000000000,
    },
  };
}

/**
 * Calculate overall health status
 */
function calculateOverallStatus(
  statuses: ('healthy' | 'degraded' | 'unhealthy')[],
): 'healthy' | 'degraded' | 'unhealthy' {
  if (statuses.some((status) => status === 'unhealthy')) {
    return 'unhealthy';
  }
  if (statuses.some((status) => status === 'degraded')) {
    return 'degraded';
  }
  return 'healthy';
}

/**
 * Get memory metrics
 */
function getMemoryMetrics(): MemoryMetrics {
  const memUsage = process.memoryUsage();

  return {
    heapUsed: memUsage.heapUsed,
    heapTotal: memUsage.heapTotal,
    external: memUsage.external,
    rss: memUsage.rss,
  };
}

/**
 * Get performance metrics (simulated)
 */
function getPerformanceMetrics(): PerformanceMetrics {
  // In a real application, these would be tracked over time
  return {
    averageResponseTime: Math.random() * 500 + 100, // 100-600ms
    requestsPerSecond: Math.random() * 50 + 10, // 10-60 RPS
    errorRate: Math.random() * 0.05, // 0-5%
    activeConnections: Math.floor(Math.random() * 100) + 10, // 10-110 connections
  };
}
