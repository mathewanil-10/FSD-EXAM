/**
 * Voyage - API Services
 * Handles Geocoding via Nominatim & Facilities via OpenStreetMap Overpass API
 */

const ApiService = {
  /**
   * Geocode a text query (city, locality, landmark) to coordinates using Nominatim
   * @param {string} query
   * @returns {Promise<Array>} Array of geocoded place matches
   */
  async geocodeLocation(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      throw new Error("Please enter a location, city, or landmark name.");
    }

    const fetchUrl = async (q) => {
      const url = `${CONFIG.nominatimEndpoint}?format=json&limit=5&addressdetails=1&q=${encodeURIComponent(q)}`;
      const response = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Nominatim geocoding rate limit reached. Please wait a moment and try again.");
        }
        throw new Error(`Geocoding failed with status code ${response.status}`);
      }
      return await response.json();
    };

    try {
      let rawList = await fetchUrl(trimmed);

      // Handle common spelling variations (e.g. Banglore / Bangalore -> ensure Bengaluru, India is included if missing)
      if (/bang(a|o)?lor/i.test(trimmed)) {
        const hasIndia = rawList.some(item => item.address?.country_code === 'in');
        if (!hasIndia) {
          try {
            const indiaList = await fetchUrl("Bengaluru, Karnataka, India");
            rawList = [...indiaList, ...rawList];
          } catch (e) {
            console.warn("Could not fetch alternate Indian city candidate:", e);
          }
        }
      }

      if (!Array.isArray(rawList) || rawList.length === 0) {
        throw new Error(`No geographic coordinates found for "${trimmed}". Please check the spelling or specify a nearby city or country.`);
      }

      // Deduplicate by approximate coordinates
      const seen = new Set();
      const candidates = [];

      for (const item of rawList) {
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        if (isNaN(lat) || isNaN(lon)) continue;

        const coordKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
        if (seen.has(coordKey)) continue;
        seen.add(coordKey);

        const addr = item.address || {};
        const country = addr.country || "Unknown Country";
        const countryCode = addr.country_code ? addr.country_code.toUpperCase() : "";
        const state = addr.state || addr.region || addr.province || "";
        const city = addr.city || addr.town || addr.municipality || addr.suburb || addr.county || "";
        const shortName = item.name || item.display_name.split(",")[0];

        candidates.push({
          id: item.osm_id || `${lat}_${lon}`,
          displayName: item.display_name,
          shortName: shortName,
          city: city,
          state: state,
          country: country,
          countryCode: countryCode,
          lat: lat,
          lon: lon,
          type: item.type,
          importance: item.importance || 0,
          address: addr
        });
      }

      if (candidates.length === 0) {
        throw new Error(`No valid geographic coordinates found for "${trimmed}". Please try a more specific place name.`);
      }

      return candidates;
    } catch (err) {
      if (err.name === "TypeError" && err.message.includes("fetch")) {
        throw new Error("Network connection issue while contacting OpenStreetMap Nominatim. Check your internet connection.");
      }
      throw err;
    }
  },

  /**
   * Reverse geocode coordinates to a human-readable address with country
   * @param {number} lat
   * @param {number} lon
   * @returns {Promise<Object>}
   */
  async reverseGeocode(lat, lon) {
    try {
      const url = `${CONFIG.nominatimReverseEndpoint}?format=json&addressdetails=1&lat=${lat}&lon=${lon}`;
      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) {
        return {
          displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
          shortName: `Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
          country: "Unknown Country",
          state: "",
          lat,
          lon
        };
      }
      const data = await response.json();
      const addr = data.address || {};
      return {
        displayName: data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        shortName: data.name || (data.display_name ? data.display_name.split(",")[0] : `${lat.toFixed(3)}, ${lon.toFixed(3)}`),
        country: addr.country || "Unknown Country",
        countryCode: addr.country_code ? addr.country_code.toUpperCase() : "",
        state: addr.state || addr.region || "",
        city: addr.city || addr.town || addr.suburb || "",
        lat,
        lon
      };
    } catch (e) {
      return {
        displayName: `${lat.toFixed(4)}, ${lon.toFixed(4)}`,
        shortName: `Location (${lat.toFixed(3)}, ${lon.toFixed(3)})`,
        country: "Unknown Country",
        state: "",
        lat,
        lon
      };
    }
  },

  /**
   * Fetch matching facilities near the location using Overpass API with multi-mirror failover
   * @param {string} categoryId
   * @param {number} centerLat
   * @param {number} centerLon
   * @param {number} radiusInMeters
   * @returns {Promise<Array>} Array of parsed and distance-sorted facilities
   */
  async fetchNearbyFacilities(categoryId, centerLat, centerLon, radiusInMeters = CONFIG.defaultRadius) {
    const category = CONFIG.categories[categoryId];
    if (!category) {
      throw new Error(`Invalid category "${categoryId}".`);
    }

    const query = category.overpassQuery(radiusInMeters, centerLat, centerLon);
    let lastError = null;

    // Iterate through available Overpass endpoints for maximum reliability
    for (const endpoint of CONFIG.overpassEndpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

        const response = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "Accept": "application/json"
          },
          body: `data=${encodeURIComponent(query)}`,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 429 || response.status === 502 || response.status === 504) {
            console.warn(`Overpass server ${endpoint} busy (Status: ${response.status}). Trying fallback server...`);
            continue;
          }
          throw new Error(`Overpass API responded with HTTP ${response.status}`);
        }

        const data = await response.json();
        const elements = data.elements || [];

        // Parse, clean, and enrich elements with strict radius filtering (Requirement #5)
        const parsedResults = this.processOverpassElements(elements, category, centerLat, centerLon, radiusInMeters);

        // Sort by distance (nearest first)
        parsedResults.sort((a, b) => a.distanceMeters - b.distanceMeters);

        return parsedResults;
      } catch (err) {
        console.warn(`Attempt failed on Overpass mirror ${endpoint}:`, err.message);
        lastError = err;
        // Continue to next mirror
      }
    }

    // If all mirrors failed
    if (lastError?.name === "AbortError") {
      throw new Error("The geographic query timed out. The Overpass server took too long to respond. Try reducing the search radius or retry in a moment.");
    }
    throw new Error(`Unable to fetch real-time facilities from OpenStreetMap Overpass servers: ${lastError ? lastError.message : "All mirrors unavailable"}`);
  },

  /**
   * Process raw Overpass JSON elements into structured items
   * Handles Overpass node, way center coordinates, and filters out facilities outside radius
   */
  processOverpassElements(elements, category, centerLat, centerLon, radiusInMeters = null) {
    const seenIds = new Set();
    const results = [];

    for (const el of elements) {
      if (seenIds.has(el.id)) continue;
      seenIds.add(el.id);

      const tags = el.tags || {};
      // Handle node coordinates, way center coordinates, or bounds midpoint
      let lat = el.lat !== undefined ? el.lat : (el.center ? el.center.lat : null);
      let lon = el.lon !== undefined ? el.lon : (el.center ? el.center.lon : null);

      if (lat === null || lon === null) {
        if (el.bounds) {
          lat = (el.bounds.minlat + el.bounds.maxlat) / 2;
          lon = (el.bounds.minlon + el.bounds.maxlon) / 2;
        }
      }

      if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) continue;

      // Distance calculation from searched center point (Requirement #6)
      const distanceMeters = this.calculateHaversineDistance(centerLat, centerLon, lat, lon);

      // EXCLUDE RESULTS OUTSIDE THE SEARCH RADIUS (Requirement #5)
      if (radiusInMeters && distanceMeters > radiusInMeters) {
        continue;
      }

      // Determine human-friendly name
      let name = tags.name || tags["name:en"] || tags.brand || tags.operator;
      if (!name) {
        if (category.id === "toilets") {
          name = tags.fee === "yes" ? "Public Toilet (Paid)" : "Public Restroom";
        } else if (category.id === "atm") {
          name = tags.operator ? `${tags.operator} ATM` : "Cash ATM";
        } else {
          name = `Unnamed ${category.singular}`;
        }
      }

      // Format clean address
      const addressParts = [];
      const street = tags["addr:street"] || tags["contact:street"];
      const houseNumber = tags["addr:housenumber"] || tags["contact:housenumber"];
      const city = tags["addr:city"] || tags["contact:city"];
      const postcode = tags["addr:postcode"] || tags["contact:postcode"];
      const suburb = tags["addr:suburb"] || tags["addr:neighbourhood"];

      if (houseNumber && street) {
        addressParts.push(`${houseNumber} ${street}`);
      } else if (street) {
        addressParts.push(street);
      }

      if (suburb) addressParts.push(suburb);
      if (city) addressParts.push(city);
      if (postcode) addressParts.push(postcode);

      const fullAddress = addressParts.length > 0 
        ? addressParts.join(", ") 
        : tags.description || "Address details not registered in OpenStreetMap";

      // Extra traveler information
      const phone = tags.phone || tags["contact:phone"] || null;
      const website = tags.website || tags["contact:website"] || null;
      const openingHours = tags.opening_hours || null;
      const wheelchair = tags.wheelchair || null;
      const fee = tags.fee || null;
      const operator = tags.operator || null;

      results.push({
        id: el.id,
        osmType: el.type,
        categoryId: category.id,
        categoryName: category.name,
        name,
        lat,
        lon,
        address: fullAddress,
        distanceMeters: Math.round(distanceMeters),
        distanceFormatted: this.formatDistance(distanceMeters),
        phone,
        website,
        openingHours,
        wheelchair,
        fee,
        operator,
        osmUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
        directionsUrl: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`
      });
    }

    return results;
  },

  /**
   * Great-circle distance between two points on the Earth using Haversine formula
   * @param {number} lat1
   * @param {number} lon1
   * @param {number} lat2
   * @param {number} lon2
   * @returns {number} distance in meters
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  /**
   * Format distance in meters to a human readable string
   * @param {number} meters
   * @returns {string}
   */
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    const km = (meters / 1000).toFixed(1);
    return `${km} km`;
  }
};

// Export to window
window.ApiService = ApiService;
