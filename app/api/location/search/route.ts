import { NextRequest, NextResponse } from "next/server";
import { WeatherService } from "@/lib/weather-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    const results = await WeatherService.searchLocations(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("API /api/location/search error:", error);
    return NextResponse.json({ error: "Location search failed." }, { status: 500 });
  }
}
