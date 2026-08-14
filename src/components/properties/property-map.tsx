"use client";

// Mapa para marcar la ubicación de una propiedad (Leaflet + OpenStreetMap,
// gratis y sin API key). El vendedor toca el mapa o arrastra el pin; guardamos
// lat/lng en inputs ocultos que viajan con el form. Leaflet se importa dentro
// del useEffect para no tocar `window` en el SSR.

import { useEffect, useRef, useState } from "react";
import type * as L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Button } from "@/components/ui/button";

// San Miguel de Tucumán: centro por defecto cuando la propiedad no tiene pin.
const DEFAULT_CENTER: [number, number] = [-26.8241, -65.2226];
const DEFAULT_ZOOM = 13;

// Íconos del pin servidos por CDN: evita el problema clásico de rutas de
// assets de Leaflet con los bundlers.
const ICON_BASE = "https://unpkg.com/leaflet@1.9.4/dist/images";

export function PropertyMap({
  initialLat,
  initialLng,
  readOnly = false,
}: {
  initialLat: number | null;
  initialLng: number | null;
  // readOnly: solo muestra el pin (detalle de propiedad). Sin editar ni inputs.
  readOnly?: boolean;
}) {
  const hasInitial = initialLat != null && initialLng != null;
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(
    hasInitial ? { lat: initialLat as number, lng: initialLng as number } : null
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const mod = await import("leaflet");
      // Según el interop del bundler, Leaflet puede venir como default o como namespace.
      const leaflet = (mod.default ?? mod) as typeof import("leaflet");
      if (cancelled || !containerRef.current || mapRef.current) return;

      const icon = leaflet.icon({
        iconUrl: `${ICON_BASE}/marker-icon.png`,
        iconRetinaUrl: `${ICON_BASE}/marker-icon-2x.png`,
        shadowUrl: `${ICON_BASE}/marker-shadow.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const start = pos ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] };
      const map = leaflet.map(containerRef.current).setView([start.lat, start.lng], pos ? 16 : DEFAULT_ZOOM);
      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
          maxZoom: 19,
        })
        .addTo(map);

      const place = (lat: number, lng: number) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = leaflet.marker([lat, lng], { draggable: !readOnly, icon }).addTo(map);
          if (!readOnly) {
            marker.on("dragend", () => {
              const ll = marker.getLatLng();
              setPos({ lat: ll.lat, lng: ll.lng });
            });
          }
          markerRef.current = marker;
        }
        setPos({ lat, lng });
      };

      if (pos) place(pos.lat, pos.lng);
      if (!readOnly) {
        map.on("click", (e: L.LeafletMouseEvent) => place(e.latlng.lat, e.latlng.lng));
      }

      mapRef.current = map;
      // El contenedor puede montarse con tamaño 0 (dentro de una Card): forzamos
      // el recálculo una vez que el layout se asentó.
      setTimeout(() => map.invalidateSize(), 0);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // Solo se inicializa una vez; los cambios de pin se manejan por estado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function quitarPin() {
    if (markerRef.current && mapRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    setPos(null);
  }

  return (
    <div className="space-y-2">
      {!readOnly && (
        <>
          <input type="hidden" name="lat" value={pos?.lat ?? ""} />
          <input type="hidden" name="lng" value={pos?.lng ?? ""} />
        </>
      )}
      <div
        ref={containerRef}
        className="h-64 w-full overflow-hidden border"
        // z-0 evita que los controles de Leaflet tapen menús/overlays del panel.
        style={{ zIndex: 0 }}
      />
      {!readOnly && (
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {pos
              ? `Ubicación marcada: ${pos.lat.toFixed(5)}, ${pos.lng.toFixed(5)}`
              : "Tocá el mapa para marcar la ubicación (opcional)."}
          </span>
          {pos && (
            <Button type="button" variant="ghost" size="sm" onClick={quitarPin}>
              Quitar pin
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
