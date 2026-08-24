import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { UserCustomAlert } from "@/types/weather";

export const dynamic = "force-dynamic";

export async function GET() {
  const alerts = db.getCustomAlerts();
  return NextResponse.json(alerts);
}

export async function POST(req: NextRequest) {
  try {
    const alert: UserCustomAlert = await req.json();
    const updated = db.saveCustomAlert(alert);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to save alert" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = db.deleteCustomAlert(id);
  return NextResponse.json(updated);
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const updated = db.toggleCustomAlert(id);
  return NextResponse.json(updated);
}
