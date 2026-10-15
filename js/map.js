/**
 * Voyage - Leaflet Map Service
 * Controls interactive OpenStreetMap view, markers, popups, and radius overlays
 */

const MapService = {
  map: null,
  markersLayer: null,
  centerMarker: null,
  radiusCircle: null,
  currentMarkers: new Map(), // facilityId -> L.marker
  activeMarkerId: null,

  /**
   * Initialize Leaflet Map
   * @param {string} containerId - DOM ID of map container
   * @param {Function} onMarkerClickCallback - Callback when user clicks a marker
   * @param {Function} onMapClickCallback - Callback when user clicks blank space on map
   */
  init(containerId = "map", onMarkerClickCallback = null, onMapClickCallback = null) {
    if (this.map) return;

    const { lat, lon, zoom } = CONFIG.defaultLocation;

    // Create Leaflet map instance
    this.map = L.map(containerId, {
      center: [lat, lon],
      zoom: zoom,
      zoomControl: false // We will position custom zoom control
    });

    // Add standard Leaflet zoom control at top-right
    L.control.zoom({ position: "topright" }).addTo(this.map);

    // OpenStreetMap standard tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Layer group for facility markers
    this.markersLayer = L.layerGroup().addTo(this.map);

    // Store callbacks
    this.onMarkerClickCallback = onMarkerClickCallback;
    this.onMapClickCallback = onMapClickCallback;

    // Listen for map click (allows tourists to search by clicking any point on the map!)
    if (this.onMapClickCallback) {
      this.map.on("click", (e) => {
        const { lat, lng } = e.latlng;
        this.onMapClickCallback(lat, lng);
      });
    }

    // Force map invalidation on resize
    window.addEventListener("resize", () => {
      if (this.map) this.map.invalidateSize();
    });
  },

  /**
   * Set and highlight the searched center point with a pulsing beacon and radius circle
   * @param {number} lat
   * @param {number} lon
   * @param {string} locationName
   * @param {number} radiusMeters
   */
  setSearchCenter(lat, lon, locationInfo, radiusMeters) {
    if (!this.map) return;

    // Remove old center marker and radius circle
    if (this.centerMarker) this.map.removeLayer(this.centerMarker);
    if (this.radiusCircle) this.map.removeLayer(this.radiusCircle);

    const isObj = typeof locationInfo === "object" && locationInfo !== null;
    const name = isObj ? (locationInfo.shortName || locationInfo.displayName) : locationInfo;
    const country = isObj ? locationInfo.country : "";
    const state = isObj ? locationInfo.state : "";

    // Center pin icon for searched location (compact, refined)
    const centerIcon = L.divIcon({
      className: "custom-center-marker-container",
      html: `
        <div class="relative flex items-center justify-center w-6 h-6">
          <div class="absolute w-5 h-5 bg-[#214B3C]/20 rounded-full"></div>
          <div class="relative w-4 h-4 bg-[#214B3C] border-2 border-white rounded-full shadow-xs flex items-center justify-center text-white text-[8px]">
            <i class="fa-solid fa-location-dot"></i>
          </div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    this.centerMarker = L.marker([lat, lon], {
      icon: centerIcon,
      zIndexOffset: 1000
    }).addTo(this.map);

    this.centerMarker.bindPopup(`
      <div class="p-2.5 font-sans">
        <div class="flex items-center gap-1.5 mb-1">
          <span class="inline-block px-1.5 py-0.2 text-[10px] font-semibold text-[#214B3C] bg-[#EAF1ED] border border-[#C5D9CE] rounded">
            Search Center
          </span>
          ${country ? `<span class="inline-block text-[10px] text-slate-500 font-medium">${country}</span>` : ""}
        </div>
        <h4 class="font-semibold text-slate-900 text-xs leading-snug">${name}</h4>
        ${state ? `<p class="text-[11px] text-slate-500 mt-0.5">${state}, ${country}</p>` : ""}
        <p class="text-[10px] text-slate-400 mt-1 font-mono">${lat.toFixed(4)}°, ${lon.toFixed(4)}°</p>
        <p class="text-[11px] text-slate-600 font-medium mt-1">Radius: ${ApiService.formatDistance(radiusMeters)}</p>
      </div>
    `);

    // Radius circle showing coverage boundary
    this.radiusCircle = L.circle([lat, lon], {
      radius: radiusMeters,
      color: "#214B3C",
      fillColor: "#214B3C",
      fillOpacity: 0.05,
      weight: 1.5,
      dashArray: "4, 6"
    }).addTo(this.map);
  },

  /**
   * Render facilities on the map with custom category markers and rich popups
   * @param {Array} facilities - Array of parsed facility objects
   * @param {string} categoryId - Selected category ID
   */
  renderFacilityMarkers(facilities, categoryId) {
    if (!this.map || !this.markersLayer) return;

    this.markersLayer.clearLayers();
    this.currentMarkers.clear();
    this.activeMarkerId = null;

    if (!facilities || facilities.length === 0) return;

    const category = CONFIG.categories[categoryId];

    facilities.forEach((item, index) => {
      const marker = this.createFacilityMarker(item, category, index + 1);
      this.markersLayer.addLayer(marker);
      this.currentMarkers.set(item.id, marker);
    });

    // Fit map bounds to encompass center and all facility markers
    this.fitViewToResults();
  },

  /**
   * Create an individual Leaflet marker with custom category styling
   */
  createFacilityMarker(item, category, rankNumber) {
    const iconHtml = this.getCategoryMarkerHtml(category, rankNumber);

    const customIcon = L.divIcon({
      className: `facility-marker-icon marker-cat-${category.id}`,
      html: iconHtml,
      iconSize: [26, 32],
      iconAnchor: [13, 32],
      popupAnchor: [0, -30]
    });

    const marker = L.marker([item.lat, item.lon], { icon: customIcon });

    // Build popup content
    const popupContent = this.buildPopupHtml(item, category);
    marker.bindPopup(popupContent, {
      maxWidth: 280,
      className: "custom-leaflet-popup"
    });

    // Marker click event (Assessment Requirement: JS Event)
    marker.on("click", () => {
      this.highlightMarker(item.id);
      if (this.onMarkerClickCallback) {
        this.onMarkerClickCallback(item);
      }
    });

    return marker;
  },

  /**
   * HTML template for category map marker (Clean, modern 26x32px pin)
   */
  getCategoryMarkerHtml(category, rankNumber) {
    return `
      <div class="marker-pin-wrapper group" data-category="${category.id}">
        <div class="marker-pin-body flex items-center justify-center w-6 h-6 rounded-full shadow-xs border border-white text-white font-medium text-[10px]" style="background-color: ${category.color}">
          <i class="fa-solid ${category.icon} text-[10px]"></i>
        </div>
        <div class="mx-auto w-0 h-0 border-x-3 border-x-transparent border-t-4" style="border-top-color: ${category.color}"></div>
      </div>
    `;
  },

  /**
   * Build modern HTML for the facility popup
   */
  buildPopupHtml(item, category) {
    const hoursHtml = item.openingHours 
      ? `<div class="text-[11px] text-slate-500 flex items-center gap-1 mt-1"><i class="fa-regular fa-clock text-slate-400 text-[10px]"></i> <span class="truncate">${item.openingHours}</span></div>` 
      : "";

    const phoneHtml = item.phone 
      ? `<div class="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5"><i class="fa-solid fa-phone text-slate-400 text-[10px]"></i> <a href="tel:${item.phone}" class="text-blue-600 hover:underline">${item.phone}</a></div>` 
      : "";

    const wheelchairBadge = item.wheelchair === "yes" 
      ? `<span class="inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-emerald-50 text-emerald-700 text-[9px] font-medium border border-emerald-200">Accessible</span>` 
      : "";

    const feeBadge = item.fee 
      ? `<span class="inline-flex items-center px-1 py-0.2 rounded bg-amber-50 text-amber-700 text-[9px] font-medium border border-amber-200">Fee: ${item.fee}</span>` 
      : "";

    return `
      <div class="facility-popup-card font-sans p-3 space-y-2">
        <div class="flex items-center justify-between gap-2">
          <span class="inline-flex items-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            ${category.singular}
          </span>
          <span class="text-[10.5px] font-semibold text-[#214B3C] bg-[#EAF1ED] px-2 py-0.5 rounded border border-[#C5D9CE]">
            ${item.distanceFormatted} away
          </span>
        </div>

        <h3 class="font-bold text-slate-900 text-xs sm:text-sm leading-snug">${item.name}</h3>

        <p class="text-[11px] text-slate-600 leading-normal flex items-start gap-1">
          <i class="fa-solid fa-location-dot mt-0.5 text-slate-400 flex-shrink-0 text-[10px]"></i>
          <span>${item.address}</span>
        </p>

        ${hoursHtml}
        ${phoneHtml}

        ${(wheelchairBadge || feeBadge) ? `<div class="flex flex-wrap gap-1 pt-0.5">${wheelchairBadge} ${feeBadge}</div>` : ""}

        <div class="pt-2 border-t border-slate-100 flex items-center gap-1.5">
          <a href="${item.directionsUrl}" target="_blank" rel="noopener" class="flex-1 text-center bg-[#214B3C] hover:bg-[#19382D] text-white text-xs font-semibold py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1.5 shadow-2xs">
            <i class="fa-solid fa-diamond-turn-right text-[10px]"></i> Directions
          </a>
          <a href="${item.osmUrl}" target="_blank" rel="noopener" title="Open in OpenStreetMap" class="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium py-1.5 px-2.5 rounded-md transition-colors flex items-center justify-center">
            <i class="fa-solid fa-map text-[10px]"></i>
          </a>
        </div>
      </div>
    `;
  },

  /**
   * Focus, pan, and open the popup for a given facility ID
   * (Triggered when user clicks a result card in the list)
   * @param {number|string} facilityId
   */
  focusFacility(facilityId) {
    const marker = this.currentMarkers.get(facilityId);
    if (!marker || !this.map) return;

    const latLng = marker.getLatLng();

    // Smooth pan and zoom if needed
    const currentZoom = this.map.getZoom();
    const targetZoom = Math.max(currentZoom, 16);

    this.map.flyTo(latLng, targetZoom, {
      duration: 0.8,
      easeLinearity: 0.25
    });

    // Open popup after short delay to let pan begin
    setTimeout(() => {
      marker.openPopup();
      this.highlightMarker(facilityId);
    }, 250);
  },

  /**
   * Visually highlight active marker
   */
  highlightMarker(facilityId) {
    // Remove highlight class from previously active marker
    if (this.activeMarkerId && this.currentMarkers.has(this.activeMarkerId)) {
      const prevMarker = this.currentMarkers.get(this.activeMarkerId);
      const prevEl = prevMarker.getElement();
      if (prevEl) prevEl.classList.remove("marker-active-pulse");
    }

    this.activeMarkerId = facilityId;

    if (this.currentMarkers.has(facilityId)) {
      const marker = this.currentMarkers.get(facilityId);
      const el = marker.getElement();
      if (el) el.classList.add("marker-active-pulse");
    }
  },

  /**
   * Fit map viewport to encompass the center location and all markers
   */
  fitViewToResults() {
    if (!this.map) return;

    const bounds = L.latLngBounds([]);

    if (this.centerMarker) {
      bounds.extend(this.centerMarker.getLatLng());
    }

    this.currentMarkers.forEach(marker => {
      bounds.extend(marker.getLatLng());
    });

    if (bounds.isValid()) {
      this.map.fitBounds(bounds, {
        padding: [40, 40],
        maxZoom: 16
      });
    }
  },

  /**
   * Recenter map to coordinates
   */
  setView(lat, lon, zoom = 14) {
    if (this.map) {
      this.map.setView([lat, lon], zoom);
    }
  }
};

// Export to window
window.MapService = MapService;
