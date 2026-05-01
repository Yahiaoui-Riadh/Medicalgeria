"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapPickerProps {
  initialPos?: { lat: number; lng: number };
  onChange: (pos: { lat: number; lng: number }) => void;
}

function LocationMarker({ pos, setPos, onChange }: { pos: any, setPos: any, onChange: any }) {
  useMapEvents({
    click(e) {
      setPos(e.latlng);
      onChange(e.latlng);
    },
  });

  return pos === null ? null : <Marker position={pos} />;
}

export default function MapPicker({ initialPos, onChange }: MapPickerProps) {
  const [position, setPosition] = useState(initialPos || { lat: 36.737, lng: 3.086 });

  return (
    <div style={{ height: "300px", width: "100%", borderRadius: "12px", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
      <MapContainer 
        center={position} 
        zoom={13} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker pos={position} setPos={setPosition} onChange={onChange} />
      </MapContainer>
    </div>
  );
}
