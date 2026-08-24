import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = db.getAdminAnalytics();
  return NextResponse.json(stats);
}
