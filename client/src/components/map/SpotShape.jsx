import { useMemo } from 'react';
import { Polygon, Circle, Marker } from 'react-leaflet';
import L from 'leaflet';
import { spotPolygon } from '../../utils/geometry.js';

// Ngjyrat e drejtkëndëshit sipas gjendjes:
//   1) i zgjedhur → jeshile e ndezur (glow)
//   2) po skadon (≤10 min) → portokalli
//   3) i zënë → i kuq
//   4) i qasshëm (aftësi të kufizuara) → blu
//   5) i lirë → jeshil
function styleFor(spot, isSelected) {
  if (isSelected) {
    return { color: '#7EF52F', fillColor: '#A6FD6C', fillOpacity: 0.25, weight: 2.5 };
  }
  if (spot.status !== 'free' && spot.expiringSoon) {
    return { color: '#FDBA74', fillColor: '#F97316', fillOpacity: 0.45, weight: 2.5 };
  }
  if (spot.status !== 'free') {
    return { color: '#FB7185', fillColor: '#E11D48', fillOpacity: 0.4, weight: 2 };
  }
  if (spot.type === 'accessible') {
    return { color: '#93C5FD', fillColor: '#3B82F6', fillOpacity: 0.45, weight: 2 };
  }
  return { color: '#6EE7B7', fillColor: '#10B981', fillOpacity: 0.38, weight: 2 };
}

export function SpotShape({ spot, isSelected, showLabel = true, onClick }) {
  const positions = useMemo(
    () => spotPolygon(spot.lat, spot.lng, spot.angleDeg),
    [spot.lat, spot.lng, spot.angleDeg]
  );

  const icon = useMemo(() => {
    const cls = [
      isSelected ? 'is-selected' : '',
      spot.type === 'accessible' ? 'is-accessible' : '',
      spot.status !== 'free' && !isSelected && !spot.expiringSoon ? 'is-taken' : '',
      spot.expiringSoon && !isSelected ? 'is-expiring' : '',
      spot.mine ? 'is-mine' : '',
    ].join(' ');
    const content = spot.type === 'accessible' ? '♿' : spot.number;
    return L.divIcon({
      className: 'spot-label',
      html: `<div class="${cls}">${content}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }, [spot.number, spot.type, spot.status, spot.expiringSoon, spot.mine, isSelected]);

  const handlers = { click: () => onClick?.(spot) };

  return (
    <>
      {/* "Makina ime është këtu": unazë e dukshme cyan rreth vendit tim. */}
      {spot.mine && (
        <Circle
          center={[spot.lat, spot.lng]}
          radius={5}
          pathOptions={{ color: '#22D3EE', weight: 3, fill: false }}
          interactive={false}
        />
      )}
      <Polygon positions={positions} pathOptions={styleFor(spot, isSelected)} eventHandlers={handlers} />
      {(showLabel || isSelected || spot.mine) && (
        <Marker position={[spot.lat, spot.lng]} icon={icon} eventHandlers={handlers} />
      )}
    </>
  );
}