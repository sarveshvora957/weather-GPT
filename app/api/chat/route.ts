import { NextRequest, NextResponse } from "next/server";
import { WeatherAI } from "@/lib/weather-ai";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, conversationId, activeLocation, isDemoMode, userApiKey } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing prompt parameter." }, { status: 400 });
    }

    // Process query with AI Weather Intelligence
    const reply = await WeatherAI.processQuery(prompt, [], {
      activeLocation,
      isDemoMode,
      userApiKey,
    });

    // Store in DB conversation if conversationId is provided
    if (conversationId) {
      db.addMessage(conversationId, {
        id: `msg-user-${Date.now()}`,
        role: "user",
        content: prompt,
        timestamp: new Date().toISOString(),
      });
      db.addMessage(conversationId, reply);
    }

    return NextResponse.json(reply);
  } catch (error) {
    console.error("API /api/chat error:", error);
    return NextResponse.json(
      {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: "Weather data is temporarily unavailable. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
