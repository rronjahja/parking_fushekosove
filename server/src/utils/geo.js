// Ndihmes gjeografik: zhvendosje ne metra -> koordinata gjeografike.
const EARTH_M_PER_DEG_LAT = 111320;

export function offsetMeters(lat, lng, dxEastM, dyNorthM) {
  const dLat = dyNorthM / EARTH_M_PER_DEG_LAT;
  const dLng = dxEastM / (EARTH_M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180));
  return { lat: lat + dLat, lng: lng + dLng };
}

// Pika e destinacionit sipas nje drejtimi (bearing ne grade, 0 = veri) dhe distances ne metra.
export function destination(lat, lng, bearingDeg, distanceM) {
  const rad = (bearingDeg * Math.PI) / 180;
  const dxEast = Math.sin(rad) * distanceM;
  const dyNorth = Math.cos(rad) * distanceM;
  return offsetMeters(lat, lng, dxEast, dyNorth);
}
