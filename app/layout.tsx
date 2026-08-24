import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeatherGPT — Conversational AI for Weather Forecasting, Alerts & Climate",
  description:
    "Production-grade conversational AI platform for real-time weather forecasting, severe meteorological alerts, and historical climate intelligence. Built for SIH 2026.",
  keywords: [
    "WeatherGPT",
    "Conversational AI",
    "Weather Forecasting",
    "Climate Information",
    "Severe Weather Alerts",
    "SIH 2026",
    "ECMWF",
    "Open-Meteo",
  ],
  authors: [{ name: "WeatherGPT AI Engineering Team" }],
  openGraph: {
    title: "WeatherGPT — Conversational Meteorological AI",
    description:
      "Transforming complex numerical weather data into actionable conversational answers, radar maps, and smart alerts.",
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
        {children}
      </body>
    </html>
  );
}
