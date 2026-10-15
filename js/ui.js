/**
 * Voyage - UI Renderer Service
 * Editorial Travel-Tech Aesthetic
 * Warm ivory surfaces, deep forest green accents, charcoal typography, rich imagery
 */

const UiService = {
  elements: {
    categoryContainer: document.getElementById("category-buttons-container"),
    resultsContainer: document.getElementById("results-container"),
    resultsHeader: document.getElementById("results-heading"),
    locationInput: document.getElementById("location-input"),
    radiusSelect: document.getElementById("radius-select"),
    toastContainer: document.getElementById("toast-container")
  },

  /**
   * Render category selector buttons
   * Styled to match the 2-column editorial grid
   */
  renderCategoryButtons(activeCategoryId, counts = {}, onCategoryClick) {
    const container = document.getElementById("category-buttons-container");
    if (!container) return;

    container.innerHTML = "";

    Object.values(CONFIG.categories).forEach(cat => {
      const isActive = cat.id === activeCategoryId;
      const count = counts[cat.id];
      const countBadge = count !== undefined 
        ? `<span class="category-count ${isActive ? 'active-count' : ''}">(${count})</span>` 
        : "";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `category-card-btn ${isActive ? 'active selected' : ''}`;
      btn.dataset.category = cat.id;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");

      btn.innerHTML = `
        <span class="cat-indicator-dot" style="background-color: ${cat.color}"></span>
        <i class="fa-solid ${cat.icon} cat-icon"></i>
        <span class="cat-name">${cat.name}</span>
        ${countBadge}
      `;

      btn.addEventListener("click", () => {
        if (onCategoryClick) onCategoryClick(cat.id);
      });

      container.appendChild(btn);
    });
  },

  /**
   * Render image-rich travel discovery welcome/empty state
   * Features high-resolution travel photography, dark gradient overlay, and popular destination chips
   */
  renderEmptyState(onPresetSelect) {
    const container = document.getElementById("results-container");
    if (!container) return;

    container.innerHTML = `
      <div class="welcome-panel">
        <!-- Hero Image Card with Dark Gradient Overlay -->
        <div class="hero-image-card">
          <img 
            src="assets/hero-travel.jpg" 
            onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80'" 
            alt="Historic European Street" 
            class="hero-img"
          />
          <div class="hero-gradient-overlay">
            <div class="hero-badge">
              <i class="fa-solid fa-compass"></i>
              <span>Voyage Discovery</span>
            </div>
            <h3 class="hero-title">Discover what’s around you.</h3>
            <p class="hero-subtitle">
              Locate verified hospitals, pharmacies, ATMs, and public amenities in any neighborhood worldwide.
            </p>
          </div>
        </div>

        <!-- Popular Destination Suggestions -->
        <div class="popular-hubs-box">
          <div class="popular-hubs-header">
            <span class="popular-hubs-title">Popular Destinations</span>
            <span class="popular-hubs-hint">Click to search</span>
          </div>
          <div class="preset-chips-wrap">
            ${CONFIG.presetLocations.map(p => `
              <button 
                type="button" 
                class="preset-city-chip" 
                data-name="${p.name}" 
                data-lat="${p.lat}" 
                data-lon="${p.lon}"
              >
                <i class="fa-solid fa-location-dot chip-icon"></i>
                <span>${p.name.split(",")[0]}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Map Discovery Tip -->
        <div class="map-interactive-tip">
          <i class="fa-solid fa-crosshairs tip-icon"></i>
          <span>Click anywhere on the map to search nearby amenities directly.</span>
        </div>
      </div>
    `;

    // Bind preset chip click handlers
    container.querySelectorAll(".preset-city-chip").forEach(chip => {
      chip.addEventListener("click", () => {
        const name = chip.dataset.name;
        const lat = parseFloat(chip.dataset.lat);
        const lon = parseFloat(chip.dataset.lon);
        if (onPresetSelect) onPresetSelect(name, lat, lon);
      });
    });
  },

  /**
   * Render loading state with modern shimmer placeholders
   */
  renderLoading(statusText = "Querying OpenStreetMap data...") {
    const container = document.getElementById("results-container");
    if (!container) return;

    container.innerHTML = `
      <div class="loading-state-wrap">
        <!-- Live status bar -->
        <div class="loading-status-bar">
          <div class="loading-spinner"></div>
          <div class="loading-status-text">
            <strong>${statusText}</strong>
            <span>Fetching live geodata from OpenStreetMap Overpass API</span>
          </div>
        </div>

        <!-- Skeleton placeholders -->
        <div class="skeletons-list">
          ${[1, 2, 3, 4].map(() => `
            <div class="card-skeleton">
              <div class="skeleton-header">
                <div class="skeleton-pill w-24"></div>
                <div class="skeleton-pill w-16"></div>
              </div>
              <div class="skeleton-line w-3/4 h-4"></div>
              <div class="skeleton-line w-full h-3"></div>
              <div class="skeleton-footer">
                <div class="skeleton-pill w-20"></div>
                <div class="skeleton-pill w-16"></div>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  },

  /**
   * Render no results found state
   */
  renderNoResults(locationName, categoryName, radiusMeters, onExpandRadius) {
    const container = document.getElementById("results-container");
    if (!container) return;

    const formattedRadius = ApiService.formatDistance(radiusMeters);

    container.innerHTML = `
      <div class="empty-state-notice">
        <div class="notice-icon-circle amber">
          <i class="fa-solid fa-magnifying-glass-location"></i>
        </div>
        <h3 class="notice-title">No ${categoryName} Found</h3>
        <p class="notice-desc">
          We couldn't locate any registered ${categoryName.toLowerCase()} within 
          <strong>${formattedRadius}</strong> of <strong>${locationName}</strong>.
        </p>
        <button type="button" id="btn-expand-radius" class="action-btn-expand">
          <i class="fa-solid fa-arrows-maximize"></i> Expand Search to 5 km
        </button>
      </div>
    `;

    const expandBtn = document.getElementById("btn-expand-radius");
    if (expandBtn && onExpandRadius) {
      expandBtn.addEventListener("click", () => onExpandRadius(5000));
    }
  },

  /**
   * Render error state with retry option
   */
  renderError(errorMessage, onRetry) {
    const container = document.getElementById("results-container");
    if (!container) return;

    container.innerHTML = `
      <div class="empty-state-notice error">
        <div class="notice-icon-circle red">
          <i class="fa-solid fa-triangle-exclamation"></i>
        </div>
        <h3 class="notice-title">Unable to Complete Request</h3>
        <p class="notice-desc">${errorMessage}</p>
        ${onRetry ? `
          <button type="button" id="btn-error-retry" class="action-btn-retry">
            <i class="fa-solid fa-rotate-right"></i> Try Again
          </button>
        ` : ""}
      </div>
    `;

    const retryBtn = document.getElementById("btn-error-retry");
    if (retryBtn && onRetry) {
      retryBtn.addEventListener("click", onRetry);
    }
  },

  /**
   * Render location disambiguation options when multiple candidates are found
   */
  renderDisambiguation(candidates, query, onSelectCandidate) {
    const container = document.getElementById("results-container");
    if (!container) return;

    container.innerHTML = `
      <div class="disambiguation-card">
        <div class="disambiguation-header">
          <h3 class="disambiguation-title">Multiple Locations Found</h3>
          <p class="disambiguation-desc">
            Found ${candidates.length} places for "<strong>${query}</strong>". Please select your destination:
          </p>
        </div>

        <div class="candidates-list">
          ${candidates.map((c, i) => `
            <button 
              type="button" 
              class="candidate-item-btn" 
              data-index="${i}"
            >
              <div class="candidate-info">
                <div class="candidate-name-row">
                  <span class="candidate-name">${c.shortName}</span>
                  <span class="candidate-country-badge">${c.country || 'Region'}</span>
                  ${c.state ? `<span class="candidate-state">(${c.state})</span>` : ''}
                </div>
                <p class="candidate-full-address">${c.displayName}</p>
                <span class="candidate-coords">${c.lat.toFixed(4)}°, ${c.lon.toFixed(4)}°</span>
              </div>
              <div class="candidate-action">
                <span>Select</span>
                <i class="fa-solid fa-arrow-right"></i>
              </div>
            </button>
          `).join("")}
        </div>
      </div>
    `;

    // Bind candidate click handlers
    container.querySelectorAll(".candidate-item-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const index = parseInt(btn.dataset.index, 10);
        const selected = candidates[index];
        if (selected && onSelectCandidate) {
          onSelectCandidate(selected);
        }
      });
    });
  },

  /**
   * Render facility results list
   */
  renderResults(facilities, categoryId, locationInfo, radiusMeters, onCardClick, onChangeLocationClick = null, hasAlternatives = false) {
    const container = document.getElementById("results-container");
    if (!container) return;

    const category = CONFIG.categories[categoryId];
    const totalCount = facilities.length;

    const isObj = typeof locationInfo === "object" && locationInfo !== null;
    const shortName = isObj ? (locationInfo.shortName || locationInfo.displayName) : locationInfo;
    const country = isObj ? locationInfo.country : "";
    const state = isObj ? locationInfo.state : "";
    const lat = isObj ? locationInfo.lat : null;
    const lon = isObj ? locationInfo.lon : null;

    container.innerHTML = `
      <div class="results-wrapper">
        <!-- Verified Location Verification Bar -->
        <div class="verified-loc-bar">
          <div class="verified-loc-details">
            <span class="verified-pulse-dot"></span>
            <div class="verified-text-wrap">
              <div class="verified-name-row">
                <span class="verified-location-name">${shortName}</span>
                ${country ? `<span class="verified-country-tag">${country}</span>` : ""}
              </div>
              <p class="verified-coords-line">
                ${state ? `${state} • ` : ""}${lat !== null ? `${lat.toFixed(4)}°, ${lon.toFixed(4)}°` : ""}
              </p>
            </div>
          </div>
          ${hasAlternatives ? `
            <button type="button" id="btn-change-location" class="btn-switch-location">
              <i class="fa-solid fa-arrows-rotate"></i> Switch
            </button>
          ` : ""}
        </div>

        <!-- Results Overview Bar -->
        <div class="results-meta-bar">
          <div>
            <h3 class="results-meta-title">
              <span>${category.name}</span>
              <span class="results-meta-count">${totalCount} found</span>
            </h3>
            <p class="results-meta-subtitle">Within ${ApiService.formatDistance(radiusMeters)} radius</p>
          </div>
          <span class="results-meta-sort">Sorted by distance</span>
        </div>

        <!-- Quick filter input -->
        <div class="results-filter-wrap">
          <i class="fa-solid fa-magnifying-glass filter-icon"></i>
          <input 
            type="text" 
            id="results-filter-input" 
            placeholder="Filter by name or street..." 
            class="results-filter-field" 
          />
        </div>

        <!-- Scrollable list of facility cards -->
        <div id="facility-cards-list" class="facility-cards-stack">
          ${facilities.map((item, index) => this.buildFacilityCardHtml(item, category, index + 1)).join("")}
        </div>
      </div>
    `;

    // Bind change location button
    const changeLocBtn = container.querySelector("#btn-change-location");
    if (changeLocBtn && onChangeLocationClick) {
      changeLocBtn.addEventListener("click", onChangeLocationClick);
    }

    // Bind card clicks
    const cards = container.querySelectorAll(".facility-result-card");
    cards.forEach(card => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("a")) return;
        const facilityId = parseInt(card.dataset.id, 10);
        this.highlightCard(facilityId);
        if (onCardClick) {
          const item = facilities.find(f => f.id === facilityId);
          if (item) onCardClick(item);
        }
      });
    });

    // Bind filter input
    const filterInput = document.getElementById("results-filter-input");
    if (filterInput) {
      filterInput.addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase().trim();
        cards.forEach(card => {
          const text = card.textContent.toLowerCase();
          card.style.display = text.includes(query) ? "block" : "none";
        });
      });
    }
  },

  /**
   * Build single facility card HTML
   * Clean editorial card with clear hierarchy and authentic OSM geodata
   */
  buildFacilityCardHtml(item, category, rank) {
    const addressHtml = item.address && item.address !== "Address not specified"
      ? `<p class="facility-address">
           <i class="fa-solid fa-location-dot address-pin-icon"></i>
           <span>${item.address}</span>
         </p>`
      : "";

    const hoursHtml = item.openingHours 
      ? `<div class="facility-meta-item">
           <i class="fa-regular fa-clock"></i> 
           <span>${item.openingHours}</span>
         </div>` 
      : "";

    const phoneHtml = item.phone 
      ? `<div class="facility-meta-item">
           <i class="fa-solid fa-phone"></i> 
           <a href="tel:${item.phone}">${item.phone}</a>
         </div>` 
      : "";

    const tags = [];
    if (item.wheelchair === "yes") {
      tags.push(`<span class="feature-tag wheelchair"><i class="fa-solid fa-wheelchair"></i> Step-free</span>`);
    }
    if (item.fee) {
      tags.push(`<span class="feature-tag fee">Fee: ${item.fee}</span>`);
    }

    return `
      <article class="facility-result-card" data-id="${item.id}" id="card-${item.id}">
        <!-- Top bar: Category badge + Distance -->
        <div class="facility-card-top">
          <div class="facility-category-label">
            <span class="cat-dot" style="background-color: ${category.color}"></span>
            <span class="cat-name-tag">${category.singular}</span>
          </div>
          <span class="facility-distance-badge">
            <i class="fa-solid fa-person-walking"></i> ${item.distanceFormatted}
          </span>
        </div>

        <!-- Primary Name -->
        <h4 class="facility-name">${item.name}</h4>

        <!-- Real details from API -->
        ${addressHtml}
        ${hoursHtml}
        ${phoneHtml}

        ${tags.length > 0 ? `<div class="facility-tags-row">${tags.join("")}</div>` : ""}

        <!-- Actions -->
        <div class="facility-actions-bar">
          <button type="button" class="btn-focus-map">
            <i class="fa-solid fa-crosshairs"></i> View on map
          </button>
          <a href="${item.directionsUrl}" target="_blank" rel="noopener" class="link-directions" title="Navigate on OpenStreetMap">
            <span>Directions</span>
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      </article>
    `;
  },

  /**
   * Visually highlight and smoothly scroll a card into view
   */
  highlightCard(facilityId) {
    document.querySelectorAll(".facility-result-card.card-active").forEach(c => {
      c.classList.remove("card-active");
    });

    const targetCard = document.getElementById(`card-${facilityId}`);
    if (targetCard) {
      targetCard.classList.add("card-active");
      targetCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  },

  /**
   * Toast notification
   */
  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `voyage-toast toast-${type}`;

    const icon = type === "error" 
      ? "fa-circle-xmark" 
      : type === "success" 
        ? "fa-circle-check" 
        : "fa-circle-info";

    toast.innerHTML = `
      <i class="fa-solid ${icon} toast-icon"></i>
      <span class="toast-text">${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("visible");
    });

    setTimeout(() => {
      toast.classList.remove("visible");
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }
};

// Export to window
window.UiService = UiService;
