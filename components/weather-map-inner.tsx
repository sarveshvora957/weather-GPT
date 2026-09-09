"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Custom glowing pulsing marker for selected map coordinates
const customPinIcon = L.divIcon({
  className: "custom-leaflet-marker",
  html: `
    <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(56, 189, 248, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="width: 18px; height: 18px; border-radius: 50%; background: #38bdf8; border: 3px solid #0a152d; box-shadow: 0 0 16px #38bdf8; position: relative; z-index: 10;"></div>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Click handler component inside MapContainer
function MapEventsHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Controller to smoothly animate map center changes
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

interface WeatherMapInnerProps {
  center: [number, number];
  zoom: number;
  activeLayer: "standard" | "radar" | "temp" | "wind" | "clouds";
  radarTilePath: string | null;
  onMapClick: (lat: number, lng: number) => void;
  selectedLocation: { name: string; lat: number; lng: number } | null;
}

export default function WeatherMapInner({
  center,
  zoom,
  activeLayer,
  radarTilePath,
  onMapClick,
  selectedLocation,
}: WeatherMapInnerProps) {
  const markerPos: [number, number] = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : center;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", background: "#0a152d" }}
      >
        <MapViewController center={center} zoom={zoom} />
        <MapEventsHandler onMapClick={onMapClick} />

        {/* 1. Base Tile Layer (OpenStreetMap / Carto Dark Voyager) */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* 2. Weather Overlay Layers */}
        {activeLayer === "radar" && radarTilePath && (
          <TileLayer
            key="radar-layer"
            attribution='Radar data &copy; <a href="https://www.rainviewer.com">RainViewer</a>'
            url={`https://tilecache.rainviewer.com${radarTilePath}/256/{z}/{x}/{y}/2/1_1.png`}
            opacity={0.8}
            zIndex={20}
          />
        )}

        {activeLayer === "clouds" && (
          <TileLayer
            key="clouds-layer"
            attribution='Satellite &copy; <a href="https://www.rainviewer.com">RainViewer</a>'
            url="https://tilecache.rainviewer.com/v2/satellite/latest/256/{z}/{x}/{y}/0/0_0.png"
            opacity={0.65}
            zIndex={20}
          />
        )}

        {/* Active Pin Marker */}
        <Marker position={markerPos} icon={customPinIcon}>
          {selectedLocation && (
            <Popup className="custom-popup" closeButton={false}>
              <div className="p-1 text-slate-900 font-bold text-xs text-center">
                📍 {selectedLocation.name}
              </div>
            </Popup>
          )}
        </Marker>
      </MapContainer>
    </div>
  );
}
