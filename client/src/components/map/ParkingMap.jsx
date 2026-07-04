import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvent } from 'react-leaflet';
import { LayerSwitcher } from './LayerSwitcher.jsx';
import { SpotShape } from './SpotShape.jsx';
import { TILE_LAYERS, MAP_MAX_ZOOM } from './tileLayers.js';
import { useTheme } from '../../context/ThemeContext.jsx';

// Lëviz butësisht te qendra e re kur ndryshon zona ose vendi i zgjedhur.
function FlyTo({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo([center.lat, center.lng], zoom ?? map.getZoom(), { duration: 0.8 });
  }, [center?.lat, center?.lng, zoom, map]);
  return null;
}

// Kap klikimet në hartë (jo mbi vend) → çzgjedh vendin aktual.
function MapClickHandler({ onDeselect }) {
  useMapEvent('click', () => onDeselect());
  return null;
}


// Ndjek nivelin aktual të zoom-it të hartës.
function ZoomWatcher({ onZoom }) {
  const map = useMap();
  useEffect(() => {
    const update = () => onZoom(map.getZoom());
    update();
    map.on('zoomend', update);
    return () => map.off('zoomend', update);
  }, [map, onZoom]);
  return null;
}

export function ParkingMap({ zone, spots, selectedNumber, onSpotClick, onDeselect, flyTarget, heightClass = 'h-[420px] sm:h-[520px]' }) {
  const [layerKey, setLayerKey] = useState('hybrid');
  const [zoomLevel, setZoomLevel] = useState(zone?.zoomLevel ?? 18);
  const { theme } = useTheme();

  const layer = TILE_LAYERS[layerKey] || Object.values(TILE_LAYERS)[0];
  const base = layer.base || layer.baseByTheme[theme];

  // Numrat shfaqen deri 2 nivele më larg se më parë (prag 16). Nën këtë nivel
  // fshihen që të mos mbivendosen, por drejtkëndëshat me ngjyrë mbeten gjithmonë.
  const showLabels = zoomLevel >= 16;

  if (!zone) return <div className={`card ${heightClass} animate-pulse`} />;

  return (
    <div className={`relative isolate overflow-hidden rounded-2xl border border-line/20 shadow-card ${heightClass}`}>
      <LayerSwitcher value={layerKey} onChange={setLayerKey} />
      <MapContainer
        center={[zone.mapCenter.lat, zone.mapCenter.lng]}
        zoom={zone.zoomLevel}
        maxZoom={MAP_MAX_ZOOM}
        className="h-full w-full"
        zoomControl
      >

        {/*
          maxNativeZoom = niveli i fundit ku ofruesi ka pllaka reale;
          maxZoom = MAP_MAX_ZOOM lejon "overzoom" (Leaflet zmadhon pllakën
          ekzistuese) → asnjë sipërfaqe e bardhë "no data available".
        */}
        <TileLayer
          key={`${layerKey}-${theme}`}
          url={base.url}
          attribution={base.attribution}
          subdomains={base.subdomains || 'abc'}
          maxNativeZoom={base.maxNativeZoom}
          maxZoom={MAP_MAX_ZOOM}
          errorTileUrl="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="
        />
        {layer.overlays.map((o, i) => (
          <TileLayer
            key={`${layerKey}-ov-${i}`}
            url={o.url}
            subdomains={o.subdomains || 'abc'}
            maxNativeZoom={o.maxNativeZoom}
            maxZoom={MAP_MAX_ZOOM}
          />
        ))}



        <FlyTo center={flyTarget?.center || zone.mapCenter} zoom={flyTarget?.zoom ?? zone.zoomLevel} />
        <MapClickHandler onDeselect={() => onDeselect?.()} />
        <ZoomWatcher onZoom={setZoomLevel} />
        {spots.map((s) => (
          <SpotShape
            key={s.id}
            spot={s}
            isSelected={s.number === selectedNumber}
            showLabel={showLabels}
            onClick={onSpotClick}
          />
        ))}
      </MapContainer>
    </div>
  );
}