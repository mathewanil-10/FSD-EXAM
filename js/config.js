/**
 * Voyage - Application Configuration
 * Full Stack Development Practical Examination
 */

const CONFIG = {
  appName: "Voyage",
  subtitle: "Discover What’s Nearby.",
  version: "1.0.0",

  // Default starting view (e.g. London / Westminster)
  defaultLocation: {
    name: "Central London, United Kingdom",
    lat: 51.5074,
    lon: -0.1278,
    zoom: 14
  },

  // Default search radius in meters
  defaultRadius: 2000,

  // Available search radius options
  radiusOptions: [
    { value: 1000, label: "1 km (Walking)" },
    { value: 2000, label: "2 km (Default)" },
    { value: 5000, label: "5 km (Cycling/Driving)" },
    { value: 10000, label: "10 km (Wider Area)" }
  ],

  // Overpass API public endpoints (with automatic failover)
  overpassEndpoints: [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter"
  ],

  // Nominatim Geocoding API endpoint
  nominatimEndpoint: "https://nominatim.openstreetmap.org/search",
  nominatimReverseEndpoint: "https://nominatim.openstreetmap.org/reverse",

  // Essential Categories definition
  categories: {
    hospital: {
      id: "hospital",
      name: "Hospitals",
      singular: "Hospital",
      icon: "fa-hospital",
      svgIcon: "hospital",
      color: "#f87171", // Crimson
      bgColor: "bg-red-950/40",
      textColor: "text-red-400",
      borderColor: "border-red-900/60",
      ringColor: "ring-red-500",
      badgeColor: "bg-red-950/50 text-red-300 border border-red-800/60",
      overpassQuery: (radius, lat, lon) => `
        [out:json][timeout:20];
        (
          node["amenity"~"hospital|clinic"](around:${radius},${lat},${lon});
          way["amenity"~"hospital|clinic"](around:${radius},${lat},${lon});
        );
        out center 40;
      `
    },
    pharmacy: {
      id: "pharmacy",
      name: "Pharmacies",
      singular: "Pharmacy",
      icon: "fa-prescription-bottle-medical",
      svgIcon: "pharmacy",
      color: "#34d399", // Emerald Green
      bgColor: "bg-emerald-950/40",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-900/60",
      ringColor: "ring-emerald-500",
      badgeColor: "bg-emerald-950/50 text-emerald-300 border border-emerald-800/60",
      overpassQuery: (radius, lat, lon) => `
        [out:json][timeout:20];
        (
          node["amenity"="pharmacy"](around:${radius},${lat},${lon});
          way["amenity"="pharmacy"](around:${radius},${lat},${lon});
        );
        out center 40;
      `
    },
    atm: {
      id: "atm",
      name: "ATMs",
      singular: "ATM",
      icon: "fa-money-bill-wave",
      svgIcon: "atm",
      color: "#60a5fa", // Sky / Slate Blue
      bgColor: "bg-blue-950/40",
      textColor: "text-blue-400",
      borderColor: "border-blue-900/60",
      ringColor: "ring-blue-500",
      badgeColor: "bg-blue-950/50 text-blue-300 border border-blue-800/60",
      overpassQuery: (radius, lat, lon) => `
        [out:json][timeout:20];
        (
          node["amenity"~"atm|bank"](around:${radius},${lat},${lon});
          way["amenity"~"atm|bank"](around:${radius},${lat},${lon});
        );
        out center 40;
      `
    },
    toilets: {
      id: "toilets",
      name: "Public Toilets",
      singular: "Public Toilet",
      icon: "fa-restroom",
      svgIcon: "toilets",
      color: "#e5a95d", // Warm Amber / Ochre
      bgColor: "bg-amber-950/40",
      textColor: "text-amber-400",
      borderColor: "border-amber-900/60",
      ringColor: "ring-amber-500",
      badgeColor: "bg-amber-950/50 text-amber-300 border border-amber-800/60",
      overpassQuery: (radius, lat, lon) => `
        [out:json][timeout:20];
        (
          node["amenity"="toilets"](around:${radius},${lat},${lon});
          way["amenity"="toilets"](around:${radius},${lat},${lon});
        );
        out center 40;
      `
    }
  },

  // Popular quick-pick locations for tourists/travelers
  presetLocations: [
    { name: "Florence, Italy", lat: 43.7696, lon: 11.2558 },
    { name: "Paris, France", lat: 48.8566, lon: 2.3522 },
    { name: "London, UK", lat: 51.5074, lon: -0.1278 },
    { name: "Rome, Italy", lat: 41.9028, lon: 12.4964 },
    { name: "Tokyo, Japan", lat: 35.6762, lon: 139.6503 },
    { name: "Bengaluru, India", lat: 12.9716, lon: 77.5946 }
  ]
};

// Export to window
window.CONFIG = CONFIG;
