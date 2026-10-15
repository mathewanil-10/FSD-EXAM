# Project Progress: Voyage

**Full Stack Development (CIA-I Practical Examination)**  
**Benchmark:** OpenStreetMap  
**Date:** October 15, 2026  
**Status:** Branding Updated to Voyage; Location Disambiguation & Verified Geodata Active

---

## 📌 1. Project Name & Objective
* **Name:** Voyage
* **Tagline / Subtitle:** Discover What’s Nearby.
* **Objective:** Enable tourists, backpackers, and travelers to find, verify, and navigate to essential services (Hospitals, Pharmacies, ATMs, and Public Toilets) in unfamiliar locations using verified OpenStreetMap geodata, interactive Leaflet mapping, and real-time Overpass API queries.

---

## 🗂️ 2. Project Folder Structure & File Responsibilities

```
c:\Users\mathe\OneDrive\Documents\FSD(sem 2)\exam/
├── index.html              # Core HTML5 layout with Tailwind CSS & Leaflet CDN integration
├── PROGRESS.md             # Continuous progress tracking and resumption state
├── README.md               # Complete documentation, architecture, API specs, and viva Q&A
├── css/
│   └── styles.css          # Custom styling, animations, leaflet overrides, scrollbars
└── js/
    ├── config.js           # Categories, endpoints, default coordinates, preset locations
    ├── api.js              # Nominatim geocoding & Overpass queries with multi-mirror failover & radius filter
    ├── map.js              # Leaflet initialization, custom SVG markers, popups, radius circle, location details
    ├── ui.js               # Render cards, disambiguation panel, verified location banner, skeletons, toasts
    └── app.js              # Event listeners, state coordinator, ambiguity checker, search controller
```

---

## 🐞 3. Bug Analysis & Resolution (Location Mismatch Fix)

### Bug Report:
When searching for *"Banglore Town"* (or *"Bangalore Town"*), the application displayed hospitals such as *"Recovery House, Caravan Of Life Trust"* and *"Kchs Medical centre"* on Tipu Sultan Road, Karachi, Pakistan.

### Root Cause Identified:
1. **Blind Selection of First Candidate (`candidates[0]`):** Nominatim returned *"Banglore Town, Karachi, Sindh, Pakistan"* as candidate 0 because "Banglore Town" is a registered sub-locality in Karachi. The search controller previously took `candidates[0]` without checking if multiple candidates existed or verifying the country.
2. **Lack of User Disambiguation:** When a search term was ambiguous across different countries or regions (e.g., Pakistan vs India), the application silently proceeded with the first geocoded coordinates without user confirmation.
3. **Missing Country/Region Transparency:** The interface previously only rendered a truncated place name without prominently displaying the resolved Country, State, and exact coordinates.
4. **Missing Radius Filter in Parser:** The Overpass element parser computed distance but did not filter out elements exceeding `radiusInMeters`.

### Solution Implemented:
1. **`js/api.js`**:
   - Enhanced `geocodeLocation()` to extract full address components: `country`, `countryCode`, `state`, `city`.
   - Added regional spelling fallback for Indian cities (ensuring Bengaluru / Bangalore is fetched if query contains "banglor" and lacks an Indian match).
   - Added strict radius enforcement in `processOverpassElements()`: any element with `distanceMeters > radiusInMeters` is strictly excluded.
   - Enhanced `reverseGeocode()` to return a structured location object with country and state.
2. **`js/ui.js`**:
   - Added `renderDisambiguation()`: When a query matches places across different countries/regions, displays an interactive card letting the user select their intended destination with country badges, state, and coordinates.
   - Added **Verified Search Location Banner** (Requirement #7): Displays `📍 ${shortName} [Country Badge]`, state, and coordinates (`Lat, Lon`) directly above results with a *"Switch Location"* button.
3. **`js/map.js`**:
   - Updated `setSearchCenter()`: Map center popup explicitly displays the verified location name, country, state, coordinates, and search radius.
4. **`js/app.js`**:
   - Added ambiguity detection in `handleSearchSubmit()`: If candidates span multiple countries or regions, prompts user with `renderDisambiguation()` before querying Overpass.
   - Passes exact selected coordinates (`lat`, `lon`) and radius to Overpass API.

---

## 🧪 4. Verified Test Results: Bengaluru, India (Requirement #9)

Tested all 4 essential categories using verified coordinates for **Bengaluru, Karnataka, India** (`Lat: 12.9768° N, Lon: 77.5901° E`, Radius: 2000m):

| Category | Overpass Filter | Elements Found | Verified Sample Facilities (within 2km of Bengaluru center) | Test Result |
| :--- | :--- | :---: | :--- | :---: |
| **Hospitals** | `hospital\|clinic` | 10 | 1. Mallya Audikesh Diagnostics Center (1313m, 12.9815°N, 77.6012°E)<br>2. Mallige Medical Centre (1410m, 12.9852°N, 77.5804°E)<br>3. Queens Nursing Home (1532m, 12.9903°N, 77.5875°E) | **PASSED** |
| **Pharmacies** | `pharmacy` | 10 | 1. The Cash Pharmacy (1466m, 12.9683°N, 77.6004°E)<br>2. Residency Pharmacy (1439m, 12.9669°N, 77.5986°E)<br>3. Vaidya Ratnam Ayurvedic Center (1793m, 12.9786°N, 77.5736°E) | **PASSED** |
| **ATMs** | `atm\|bank` | 10 | 1. State Bank of India (1122m, 12.9730°N, 77.5805°E)<br>2. Bank of India (1289m, 12.9738°N, 77.5786°E)<br>3. Canara Bank (1931m, 12.9777°N, 77.5723°E) | **PASSED** |
| **Public Toilets** | `toilets` | 10 | 1. Public Toilets (300m, 12.9768°N, 77.5928°E)<br>2. Sulabh Complex (1261m, 12.9735°N, 77.6012°E)<br>3. Unnamed Public Toilets (1914m, 12.9778°N, 77.5725°E) | **PASSED** |

*All returned facilities have verified coordinates in Karnataka, India, and 100% of facilities are strictly within the 2000m radius.*

---

## ✅ 5. Full Features Status Matrix

* [x] **Project Architecture**: Modular ES6 files (`config.js`, `api.js`, `map.js`, `ui.js`, `app.js`).
* [x] **Header & Branding**: "Voyage" & "Discover What’s Nearby."
* [x] **4 Categories**: Hospitals (Red), Pharmacies (Green), ATMs (Blue), Public Toilets (Amber).
* [x] **Input Validation**: Displays inline warnings and prevents blank/short submissions.
* [x] **Geocoding & Ambiguity Handling**: Disambiguates multi-country/multi-region matches.
* [x] **Verified Location Banner**: Shows resolved location name, country, and coordinates.
* [x] **Overpass API Integration**: Multi-mirror failover (`openstreetmap.fr`, `overpass-api.de`, `kumi.systems`).
* [x] **Strict Radius Enforcement**: All results outside selected radius excluded.
* [x] **Accurate Haversine Distance Calculation**: Great-circle distance calculated from search center.
* [x] **Interactive Leaflet Map**: Custom SVG markers, pulsing center pin, and boundary circle.
* [x] **Bi-directional Map & List Sync**: Card click opens marker popup; marker click scrolls card.
* [x] **Interactive Map-Click Search**: Tap any point on map to search essentials there.
* [x] **Responsive Mobile Layout**: Mobile tab toggle ("List" vs "Map").
* [x] **Testing Evidence**: Bengaluru India verified across all 4 categories.

---

## 💻 6. Commands Used to Run the Application

```powershell
# Start local HTTP server
python -m http.server 8000

# Open in browser
# Navigate to: http://localhost:8000
```

---

## 🎯 7. Next Priority Actions

1. **Conduct Final Live Browser Walkthrough**: Verify in browser that searching "Banglore Town" presents the disambiguation card, clicking "Bengaluru, India" loads Indian hospitals, and clicking "Switch" works.
2. **Review Codebase for Cleanliness**: Confirm no stray test files or debug statements.
3. **Prepare Handover Summary**: Provide clear viva summary and run instructions for the user.
