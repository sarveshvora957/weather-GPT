import { NextRequest, NextResponse } from "next/server";
import { WeatherService, DEFAULT_LOCATION } from "@/lib/weather-service";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const latStr = searchParams.get("lat");
    const lonStr = searchParams.get("lon");

    const lat = latStr ? parseFloat(latStr) : DEFAULT_LOCATION.latitude;
    const lon = lonStr ? parseFloat(lonStr) : DEFAULT_LOCATION.longitude;

    const data = await WeatherService.getFullWeather(lat, lon);
    return NextResponse.json(data);
  } catch (error) {
    console.error("API /api/weather/current error:", error);
    return NextResponse.json(
      { error: "Weather data is temporarily unavailable. Please try again in a moment." },
      { status: 500 }
    );
  }
}
