import { NextRequest, NextResponse } from "next/server";
import { WeatherService, DEFAULT_LOCATION } from "@/lib/weather-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lonStr = searchParams.get("lon");
    const city = searchParams.get("city") || DEFAULT_LOCATION.name;
    const country = searchParams.get("country") || DEFAULT_LOCATION.country;

    const lat = latStr ? parseFloat(latStr) : DEFAULT_LOCATION.latitude;
    const lon = lonStr ? parseFloat(lonStr) : DEFAULT_LOCATION.longitude;

    const data = await WeatherService.getHistoricalClimate(lat, lon, city, country);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API /api/weather/climate error:", error);
    return NextResponse.json(
      { error: "Climate data is temporarily unavailable." },
      { status: 500 }
    );
  }
}
