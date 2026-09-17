window.DRAGONROUTE_CONFIG = Object.freeze({
  nominatim: "https://nominatim.openstreetmap.org",
  osrm: "https://router.project-osrm.org",
  fuelApi: "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records",
  leafletCss: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css",
  leafletJs: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js",
  tileUrl: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  corridorRadiusKm: 12,
  routeSampleEveryKm: 30,
  maxFuelSamples: 24,
  maxCandidates: 20
});
