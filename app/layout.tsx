import type { Metadata } from "next";
import "./globals.css";
import { WeatherProvider } from "@/components/weather-context";

export const metadata: Metadata = {
  title: "WeatherGPT — Live Real-Time Weather & Meteorological Intelligence",
  description:
    "Modern, accurate real-time weather forecasting, interactive radar, severe alerts, and conversational meteorological AI for India and worldwide locations.",
  keywords: [
    "WeatherGPT",
    "Weather App",
    "India Weather",
    "Forecast",
    "Severe Weather Alerts",
    "Open-Meteo",
    "Radar",
    "Climate",
  ],
  authors: [{ name: "WeatherGPT Team" }],
  openGraph: {
    title: "WeatherGPT — Live Weather & Meteorological Intelligence",
    description:
      "Modern, accurate real-time weather app with instant forecasts, hourly radar, severe alerts, and intelligent weather advice.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased selection:bg-aurora-cyan/30 selection:text-white min-h-screen flex flex-col">
        <WeatherProvider>{children}</WeatherProvider>
      </body>
    </html>
  );
}
