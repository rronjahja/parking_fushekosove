import { useMemo } from 'react';
import { Polygon, Marker } from 'react-leaflet';
import L from 'leaflet';
import { spotPolygon } from '../../utils/geometry.js';

// Ngjyrat sipas statusit dhe tipit (seksioni 4 i specifikimit).
function styleFor(spot, isSelected) {
  if (isSelected) return { color: '#FBBF24', fillColor: '#FBBF24', fillOpacity: 0.45, weight: 2.5 };
  if (spot.status !== 'free') return { color: '#FB7185', fillColor: '#E11D48', fillOpacity: 0.4, weight: 2 };
  if (spot.type === 'accessible') return { color: '#93C5FD', fillColor: '#3B82F6', fillOpacity: 0.45, weight: 2 };
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
      spot.status !== 'free' && !isSelected ? 'is-taken' : '',
    ].join(' ');
    const content = spot.type === 'accessible' ? '♿' : spot.number;
    return L.divIcon({
      className: 'spot-label',
      html: `<div class="${cls}">${content}</div>`,
      iconSize: [22, 22],
      iconAnchor: [11, 11],
    });
  }, [spot.number, spot.type, spot.status, isSelected]);

  const handlers = { click: () => onClick?.(spot) };

  return (
    <>
      {/* Drejtkëndëshi me ngjyrë shfaqet GJITHMONË (edhe kur zvogëlohet harta). */}
      <Polygon positions={positions} pathOptions={styleFor(spot, isSelected)} eventHandlers={handlers} />
      {/* Numri shfaqet vetëm kur zoom-i është mjaftueshëm - ndryshe do të mbivendosej.
          Vendi i zgjedhur e mban gjithmonë numrin. */}
      {(showLabel || isSelected) && (
        <Marker position={[spot.lat, spot.lng]} icon={icon} eventHandlers={handlers} />
      )}
    </>
  );
}