export const TILE_LAYERS = {
  street: {
    label: 'Rrugët',
    base: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      subdomains: ['a', 'b', 'c'],
      attribution: '© OpenStreetMap contributors',
      maxNativeZoom: 19,
    },
    overlays: [],
  },
  satelitore: {
    label: 'Satelitore',
    // Satelit Esri + emra/rrugë Esri (ish-"Hibride").
    base: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: 'Esri, Maxar, Earthstar Geographics',
      maxNativeZoom: 18,
    },
    overlays: [
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}',
        maxNativeZoom: 18,
      },
      {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
        maxNativeZoom: 18,
      },
    ],
  },
};

// Zoom-i maksimal i lejuar në ndërfaqe (mbi maxNativeZoom bëhet overzoom).
export const MAP_MAX_ZOOM = 22;