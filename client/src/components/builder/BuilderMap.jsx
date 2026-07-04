import { useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { spotPolygon } from '../../utils/geometry.js';

// Harta e Ndërtuesit: markera të tërhiqshëm (drag & drop) mbi imazh satelitor.
// - Zvarrit markerin -> vendi zhvendoset.
// - Në mënyrën "Shto", kliko në hartë -> shtohet vend i ri aty.
// - Qendra + zoom-i i hartës raportohen lart (për "Vendos qendrën & zoom-in këtu").
// (Poligonet janë jo-interaktive që klikimi të mos dyfishohet.)

const TYPE_COLORS = {
  standard: { stroke: '#6EE7B7', fill: '#10B981', pin: '#047857' },
  accessible: { stroke: '#93C5FD', fill: '#3B82F6', pin: '#1D4ED8' },
};

function MapEvents({ mode, onAddAt, onMapCenter, onMapZoom, onDeselect }) {
  const map = useMapEvents({
    click(e) {
      if (mode === 'add') onAddAt(e.latlng);
      else onDeselect();
    },
    moveend() {
      onMapCenter(map.getCenter());
      onMapZoom(map.getZoom());
    },
    zoomend() {
      onMapZoom(map.getZoom());
    },
  });
  return null;
}

function BuilderSpot({ spot, isSelected, onSelect, onMove }) {
  const colors = TYPE_COLORS[spot.type] || TYPE_COLORS.standard;

  const positions = useMemo(
    () => spotPolygon(spot.lat, spot.lng, spot.angleDeg),
    [spot.lat, spot.lng, spot.angleDeg]
  );

  const icon = useMemo(() => {
    const bg = isSelected ? '#B45309' : colors.pin;
    const border = isSelected ? '#FBBF24' : 'rgba(255,255,255,.9)';
    const glyph = spot.type === 'accessible' ? '♿' : spot.number;
    return L.divIcon({
      className: 'builder-pin',
      html: `<div style="background:${bg};border-color:${border}">${glyph}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }, [spot.number, spot.type, isSelected, colors.pin]);

  return (
    <>
      <Polygon
        positions={positions}
        interactive={false}
        pathOptions={{
          color: isSelected ? '#FBBF24' : colors.stroke,
          fillColor: isSelected ? '#FBBF24' : colors.fill,
          fillOpacity: 0.35,
          weight: isSelected ? 2.5 : 1.5,
        }}
      />
      <Marker
        position={[spot.lat, spot.lng]}
        icon={icon}
        draggable
        eventHandlers={{
          click: () => onSelect(spot.localId),
          dragstart: () => onSelect(spot.localId),
          dragend: (e) => {
            const { lat, lng } = e.target.getLatLng();
            onMove(spot.localId, lat, lng);
          },
        }}
      />
    </>
  );
}

export function BuilderMap({
  zone, spots, selectedLocalId, mode,
  onSelect, onMove, onAddAt, onMapCenter, onMapZoom, onDeselect,
}) {
  return (
    <div className="relative isolate h-full min-h-[480px] overflow-hidden rounded-2xl border border-line/20 shadow-card">
      <MapContainer
        key={zone.id}
        center={[zone.mapCenter.lat, zone.mapCenter.lng]}
        zoom={zone.zoomLevel}
        maxZoom={22}
        className="h-full w-full"
      >
        {/* Esri satelit + emra/rrugë, me overzoom → pa sipërfaqe të bardhë. */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri, Maxar, Earthstar Geographics"
          maxNativeZoom={18}
          maxZoom={22}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={18}
          maxZoom={22}
        />
        <MapEvents
          mode={mode}
          onAddAt={onAddAt}
          onMapCenter={onMapCenter}
          onMapZoom={onMapZoom}
          onDeselect={onDeselect}
        />
        {spots.map((s) => (
          <BuilderSpot
            key={s.localId}
            spot={s}
            isSelected={s.localId === selectedLocalId}
            onSelect={onSelect}
            onMove={onMove}
          />
        ))}
      </MapContainer>

      {mode === 'add' && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[500] mx-auto w-fit rounded-full bg-amber px-4 py-1.5 text-xs font-bold text-[#2B1A02] shadow">
          Kliko në hartë për të shtuar vend të ri
        </div>
      )}
    </div>
  );
}