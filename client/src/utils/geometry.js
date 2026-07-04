// Gjeometria e vend-parkimit: nga qendra + këndi -> poligon 4-këndor në hartë.
const M_PER_DEG_LAT = 111320;

export const SPOT_LENGTH_M = 5.0;
export const SPOT_WIDTH_M = 2.4;

/**
 * Kthen 4 qoshet [lat, lng] të një drejtkëndëshi të rrotulluar.
 * angleDeg = drejtimi i gjatësisë së vendit (0 = veri).
 */
export function spotPolygon(lat, lng, angleDeg, lengthM = SPOT_LENGTH_M, widthM = SPOT_WIDTH_M) {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);

  const half = [
    [+lengthM / 2, +widthM / 2],
    [+lengthM / 2, -widthM / 2],
    [-lengthM / 2, -widthM / 2],
    [-lengthM / 2, +widthM / 2],
  ];
  return half.map(([dl, dw]) => {
    // rrotullimi në planin lokal (east, north)
    const east = dl * sin + dw * cos;
    const north = dl * cos - dw * sin;
    return [lat + north / M_PER_DEG_LAT, lng + east / mPerDegLng];
  });
}

// Pikë e zhvendosur `distanceM` metra në drejtimin `bearingDeg`.
export function destination(lat, lng, bearingDeg, distanceM) {
  const rad = (bearingDeg * Math.PI) / 180;
  const east = Math.sin(rad) * distanceM;
  const north = Math.cos(rad) * distanceM;
  const mPerDegLng = M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
  return { lat: lat + north / M_PER_DEG_LAT, lng: lng + east / mPerDegLng };
}
