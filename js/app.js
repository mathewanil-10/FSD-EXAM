/**
 * Voyage - Main Application Controller
 * Coordinates API queries, Leaflet map interactions, and UI rendering
 * Full Stack Development Practical Examination
 */

const App = {
  // Application State
  state: {
    currentLocation: null, // { displayName, shortName, country, state, city, lat, lon }
    lastCandidates: [], // Cached disambiguation candidates
    lastQuery: "",
    selectedCategory: "hospital",
    searchRadius: CONFIG.defaultRadius,
    results: [],
    categoryCounts: {},
    isLoading: false,
    activeFacilityId: null,
    mobileActiveTab: "list" // 'list' or 'map'
  },

  /**
   * Application Entry Point
   */
  init() {
    this.cacheDomElements();
    this.initMap();
    this.bindEvents();
    this.initCategories();
    this.initRadiusSelector();
    this.showInitialEmptyState();

    console.log("Voyage initialized successfully.");
  },

  /**
   * Cache critical DOM elements
   */
  cacheDomElements() {
    this.dom = {
      searchForm: document.getElementById("search-form"),
      locationInput: document.getElementById("location-input"),
      searchButton: document.getElementById("search-button"),
      locateMeButton: document.getElementById("btn-locate-me"),
      clearInputButton: document.getElementById("btn-clear-input"),
      radiusSelect: document.getElementById("radius-select"),
      inputFeedback: document.getElementById("input-feedback"),
      categoryContainer: document.getElementById("category-buttons-container"),
      resultsContainer: document.getElementById("results-container"),
      mobileTabListBtn: document.getElementById("tab-btn-list"),
      mobileTabMapBtn: document.getElementById("tab-btn-map"),
      sidebarPanel: document.getElementById("sidebar-panel"),
      mapPanel: document.getElementById("map-panel")
    };
  },

  /**
   * Initialize Leaflet Map with bi-directional event handlers
   */
  initMap() {
    MapService.init(
      "map",
      // Marker Click Callback (Assessment Requirement)
      (item) => {
        this.state.activeFacilityId = item.id;
        UiService.highlightCard(item.id);
      },
      // Map Blank Click Callback (Search clicked spot)
      async (lat, lon) => {
        await this.handleMapSpotClick(lat, lon);
      }
    );
  },

  /**
   * Initialize category selector buttons
   */
  initCategories() {
    UiService.renderCategoryButtons(
      this.state.selectedCategory,
      this.state.categoryCounts,
      // Category Click Callback (Assessment Requirement)
      (categoryId) => this.handleCategoryChange(categoryId)
    );
  },

  /**
   * Initialize radius dropdown selector
   */
  initRadiusSelector() {
    if (!this.dom.radiusSelect) return;

    this.dom.radiusSelect.innerHTML = CONFIG.radiusOptions.map(opt => `
      <option value="${opt.value}" ${opt.value === this.state.searchRadius ? "selected" : ""}>
        ${opt.label}
      </option>
    `).join("");
  },

  /**
   * Show welcoming empty state on launch
   */
  showInitialEmptyState() {
    UiService.renderEmptyState((presetName, lat, lon) => {
      const parts = presetName.split(",");
      const shortName = parts[0].trim();
      const country = parts[1] ? parts[1].trim() : "";
      const locObj = {
        displayName: presetName,
        shortName,
        country,
        state: "",
        lat,
        lon
      };
      this.dom.locationInput.value = presetName;
      if (this.dom.clearInputButton) {
        this.dom.clearInputButton.style.display = "flex";
      }
      this.state.lastCandidates = [locObj];
      this.state.lastQuery = presetName;
      this.executeSearch(locObj);
    });
  },

  /**
   * Bind event listeners
   * Demonstrates diverse event types: submit, click, input, change, keydown
   */
  bindEvents() {
    // 1. Form Submission (Assessment Requirement: Event #1)
    if (this.dom.searchForm) {
      this.dom.searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleSearchSubmit();
      });
    }

    // 2. Input Enter Keydown support
    if (this.dom.locationInput) {
      this.dom.locationInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          this.handleSearchSubmit();
        }
      });

      // Clear inline error on user typing
      this.dom.locationInput.addEventListener("input", () => {
        this.clearInputValidation();
        if (this.dom.clearInputButton) {
          this.dom.clearInputButton.style.display = this.dom.locationInput.value.trim() ? "flex" : "none";
        }
      });
    }

    // 3. Clear input button click
    if (this.dom.clearInputButton) {
      this.dom.clearInputButton.addEventListener("click", () => {
        this.dom.locationInput.value = "";
        this.dom.clearInputButton.style.display = "none";
        this.clearInputValidation();
        this.dom.locationInput.focus();
      });
    }

    // 4. HTML5 Geolocation Click Event
    if (this.dom.locateMeButton) {
      this.dom.locateMeButton.addEventListener("click", () => {
        this.handleGeolocationClick();
      });
    }

    // 5. Radius Change Event
    if (this.dom.radiusSelect) {
      this.dom.radiusSelect.addEventListener("change", (e) => {
        this.state.searchRadius = parseInt(e.target.value, 10);
        if (this.state.currentLocation) {
          // Re-fetch facilities with updated radius
          this.fetchAndRenderFacilities();
        }
      });
    }

    // 6. Mobile View Tab Toggles
    if (this.dom.mobileTabListBtn && this.dom.mobileTabMapBtn) {
      this.dom.mobileTabListBtn.addEventListener("click", () => this.switchMobileTab("list"));
      this.dom.mobileTabMapBtn.addEventListener("click", () => this.switchMobileTab("map"));
    }
  },

  /**
   * Switch tabs for mobile viewports
   */
  switchMobileTab(tab) {
    this.state.mobileActiveTab = tab;
    if (tab === "list") {
      this.dom.mobileTabListBtn.classList.add("bg-white", "text-slate-900", "shadow-sm");
      this.dom.mobileTabListBtn.classList.remove("text-slate-500");
      this.dom.mobileTabMapBtn.classList.remove("bg-white", "text-slate-900", "shadow-sm");
      this.dom.mobileTabMapBtn.classList.add("text-slate-500");

      this.dom.sidebarPanel.classList.remove("hidden");
      this.dom.mapPanel.classList.add("hidden", "md:block");
    } else {
      this.dom.mobileTabMapBtn.classList.add("bg-white", "text-slate-900", "shadow-sm");
      this.dom.mobileTabMapBtn.classList.remove("text-slate-500");
      this.dom.mobileTabListBtn.classList.remove("bg-white", "text-slate-900", "shadow-sm");
      this.dom.mobileTabListBtn.classList.add("text-slate-500");

      this.dom.sidebarPanel.classList.add("hidden", "md:flex");
      this.dom.mapPanel.classList.remove("hidden");

      // Invalidate Leaflet map size so it renders full dimensions
      setTimeout(() => {
        if (MapService.map) MapService.map.invalidateSize();
      }, 100);
    }
  },

  /**
   * Form submit handler
   */
  async handleSearchSubmit() {
    const rawValue = this.dom.locationInput ? this.dom.locationInput.value.trim() : "";

    // Input Validation (Requirement #5)
    if (!rawValue) {
      this.showInputValidation("Please enter a city, area, or landmark (e.g. 'Paris', 'Times Square').");
      return;
    }

    if (rawValue.length < 2) {
      this.showInputValidation("Location name is too short. Please provide a more descriptive place name.");
      return;
    }

    this.clearInputValidation();
    this.setLoading(true, `Finding coordinates for "${rawValue}"...`);

    try {
      // Step 1: Geocoding with Nominatim API (Requirement #6)
      const candidates = await ApiService.geocodeLocation(rawValue);
      this.state.lastCandidates = candidates;
      this.state.lastQuery = rawValue;

      // Ambiguity Check (Requirement #3):
      // If multiple candidates exist across different regions or countries,
      // prompt the user to choose their intended destination explicitly!
      const distinctCountries = new Set(candidates.map(c => c.country).filter(Boolean));
      const isAmbiguous = candidates.length > 1 && (distinctCountries.size > 1 || candidates.length >= 2);

      if (isAmbiguous) {
        this.setLoading(false);
        UiService.renderDisambiguation(candidates, rawValue, (selectedCandidate) => {
          this.selectLocationAndSearch(selectedCandidate);
        });
        return;
      }

      // If unambiguous, select the single best candidate
      await this.selectLocationAndSearch(candidates[0]);
    } catch (err) {
      this.setLoading(false);
      UiService.renderError(err.message, () => this.handleSearchSubmit());
      UiService.showToast(err.message, "error");
    }
  },

  /**
   * Select a candidate location and execute search
   */
  async selectLocationAndSearch(locationObj) {
    this.clearInputValidation();
    if (this.dom.locationInput) {
      this.dom.locationInput.value = `${locationObj.shortName}, ${locationObj.country}`;
      if (this.dom.clearInputButton) {
        this.dom.clearInputButton.style.display = "flex";
      }
    }
    await this.executeSearch(locationObj);
  },

  /**
   * Category change handler (Assessment Requirement: Event #2)
   */
  async handleCategoryChange(newCategoryId) {
    if (this.state.selectedCategory === newCategoryId && this.state.results.length > 0) {
      return;
    }

    this.state.selectedCategory = newCategoryId;
    this.initCategories();

    if (this.state.currentLocation) {
      await this.fetchAndRenderFacilities();
    } else {
      UiService.showToast(`Category set to ${CONFIG.categories[newCategoryId].name}. Enter a location to search.`, "info");
    }
  },

  /**
   * HTML5 Geolocation handler
   */
  handleGeolocationClick() {
    if (!navigator.geolocation) {
      UiService.showToast("Geolocation is not supported by your browser.", "error");
      return;
    }

    this.setLoading(true, "Acquiring your GPS location...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const locObj = await ApiService.reverseGeocode(latitude, longitude);
          this.dom.locationInput.value = `${locObj.shortName}, ${locObj.country}`;
          UiService.showToast("GPS position acquired successfully!", "success");
          this.state.lastCandidates = [locObj];
          await this.executeSearch(locObj);
        } catch (e) {
          const fallbackLoc = {
            displayName: "Your Current Location",
            shortName: "Current Location",
            country: "",
            state: "",
            lat: latitude,
            lon: longitude
          };
          this.state.lastCandidates = [fallbackLoc];
          await this.executeSearch(fallbackLoc);
        }
      },
      (err) => {
        this.setLoading(false);
        let msg = "Unable to retrieve your location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location permission denied. Please enter a city or locality manually.";
        } else if (err.code === err.TIMEOUT) {
          msg = "GPS request timed out. Please enter a location manually.";
        }
        UiService.showToast(msg, "error");
        this.showInputValidation(msg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  },

  /**
   * Handle user clicking anywhere on the map to search essentials there
   */
  async handleMapSpotClick(lat, lon) {
    this.setLoading(true, "Inspecting clicked location...");
    try {
      const locObj = await ApiService.reverseGeocode(lat, lon);
      this.dom.locationInput.value = `${locObj.shortName}, ${locObj.country}`;
      UiService.showToast(`Searching near ${locObj.shortName}`, "info");
      this.state.lastCandidates = [locObj];
      await this.executeSearch(locObj);
    } catch (e) {
      const fallbackLoc = {
        displayName: `Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
        shortName: `Map Point`,
        country: "",
        state: "",
        lat,
        lon
      };
      this.state.lastCandidates = [fallbackLoc];
      await this.executeSearch(fallbackLoc);
    }
  },

  /**
   * Execute search around given coordinates
   */
  async executeSearch(locationInfo, fallbackLat = null, fallbackLon = null) {
    let locationObj = locationInfo;
    if (typeof locationInfo === "string") {
      locationObj = {
        displayName: locationInfo,
        shortName: locationInfo.split(",")[0],
        country: "",
        state: "",
        lat: fallbackLat,
        lon: fallbackLon
      };
    }

    this.state.currentLocation = locationObj;

    // Update map center pin & radius circle (Requirement #10)
    MapService.setSearchCenter(locationObj.lat, locationObj.lon, locationObj, this.state.searchRadius);

    // Fetch facilities
    await this.fetchAndRenderFacilities();
  },

  /**
   * Fetch facilities from Overpass API and update map and list
   */
  async fetchAndRenderFacilities() {
    const loc = this.state.currentLocation;
    const categoryId = this.state.selectedCategory;
    const radius = this.state.searchRadius;
    const category = CONFIG.categories[categoryId];

    const shortName = loc.shortName || loc.displayName.split(",")[0];
    this.setLoading(true, `Querying ${category.name} near ${shortName}...`);

    try {
      // Step 2: Fetch real Overpass API data with exact coordinates (Requirement #4, #7, #8)
      const facilities = await ApiService.fetchNearbyFacilities(categoryId, loc.lat, loc.lon, radius);

      this.state.results = facilities;
      this.state.categoryCounts[categoryId] = facilities.length;
      this.initCategories(); // Update badge counts

      this.setLoading(false);

      if (facilities.length === 0) {
        // Empty results state (Requirement #13)
        MapService.renderFacilityMarkers([], categoryId);
        UiService.renderNoResults(
          shortName,
          category.name,
          radius,
          (newRadius) => {
            this.state.searchRadius = newRadius;
            if (this.dom.radiusSelect) this.dom.radiusSelect.value = newRadius;
            this.fetchAndRenderFacilities();
          }
        );
        return;
      }

      // Step 3: Render map markers (Requirement #10)
      MapService.renderFacilityMarkers(facilities, categoryId);

      // Step 4: Render results list with card click event & switch location button (Requirement #9, #11, #7)
      const hasAlternatives = this.state.lastCandidates && this.state.lastCandidates.length > 1;
      UiService.renderResults(
        facilities,
        categoryId,
        loc,
        radius,
        // Card Click Callback (Assessment Requirement: Event #3)
        (item) => {
          this.state.activeFacilityId = item.id;
          MapService.focusFacility(item.id);

          // On mobile, switch to map view so the user immediately sees the highlighted marker
          if (window.innerWidth < 768 && this.state.mobileActiveTab === "list") {
            this.switchMobileTab("map");
          }
        },
        // Switch Location Callback (Requirement #3, #7)
        () => {
          UiService.renderDisambiguation(
            this.state.lastCandidates,
            this.state.lastQuery || loc.shortName,
            (selected) => this.selectLocationAndSearch(selected)
          );
        },
        hasAlternatives
      );

      UiService.showToast(`Found ${facilities.length} ${category.name.toLowerCase()} within ${ApiService.formatDistance(radius)}`, "success");

    } catch (err) {
      this.setLoading(false);
      console.error("Facility fetch error:", err);
      UiService.renderError(err.message, () => this.fetchAndRenderFacilities());
      UiService.showToast(err.message, "error");
    }
  },

  /**
   * Input validation helpers
   */
  showInputValidation(message) {
    if (this.dom.inputFeedback) {
      this.dom.inputFeedback.textContent = message;
      this.dom.inputFeedback.classList.remove("hidden");
    }
    if (this.dom.locationInput) {
      this.dom.locationInput.classList.add("border-red-400", "focus:ring-red-400");
      this.dom.locationInput.focus();
    }
  },

  clearInputValidation() {
    if (this.dom.inputFeedback) {
      this.dom.inputFeedback.textContent = "";
      this.dom.inputFeedback.classList.add("hidden");
    }
    if (this.dom.locationInput) {
      this.dom.locationInput.classList.remove("border-red-400", "focus:ring-red-400");
    }
  },

  /**
   * Set loading status
   */
  setLoading(isLoading, message = "") {
    this.state.isLoading = isLoading;
    if (this.dom.searchButton) {
      this.dom.searchButton.disabled = isLoading;
      this.dom.searchButton.innerHTML = isLoading 
        ? `<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>` 
        : `<i class="fa-solid fa-magnifying-glass"></i> <span class="hidden sm:inline">Search</span>`;
    }

    if (isLoading) {
      UiService.renderLoading(message);
    }
  }
};

// Initialize application on DOM ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});

// Export to window
window.App = App;
