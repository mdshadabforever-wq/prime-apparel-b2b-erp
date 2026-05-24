import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // 1. Audit database connectivity by executing a quick query
    const startDb = Date.now();
    const productCount = await db.product.count();
    const dbLatency = Date.now() - startDb;

    // 2. Resource check metrics
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds: Number(uptime.toFixed(2)),
      database: {
        status: "connected",
        latencyMs: dbLatency,
        activeSKUs: productCount
      },
      resources: {
        memoryHeapUsedMb: Number((memoryUsage.heapUsed / 1024 / 1024).toFixed(2)),
        memoryHeapTotalMb: Number((memoryUsage.heapTotal / 1024 / 1024).toFixed(2))
      }
    });
  } catch (error: any) {
    console.error("Health check failure:", error);
    return NextResponse.json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message || "Uncaught server exception during health audit."
    }, { status: 503 });
  }
}
