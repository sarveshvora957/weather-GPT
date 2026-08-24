import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { LocationData } from "@/types/weather";

export const dynamic = "force-dynamic";

export async function GET() {
  const locations = db.getSavedLocations();
  return NextResponse.json(locations);
}

export async function POST(req: NextRequest) {
  try {
    const loc: LocationData = await req.json();
    const updated = db.addSavedLocation(loc);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Failed to save location" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name");
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });

  const updated = db.removeSavedLocation(name);
  return NextResponse.json(updated);
}
