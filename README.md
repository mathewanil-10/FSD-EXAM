# Voyage — Discover What’s Nearby

**Full Stack Development Practical Examination**  
A responsive web application built for tourists, travelers, and explorers to find, verify, and navigate to essential services (Hospitals, Pharmacies, ATMs, and Public Toilets) in unfamiliar locations using live OpenStreetMap geocoding and the Overpass API.

---

## 📌 1. Project Overview & Problem Statement

* **Project Title:** Voyage
* **Tagline / Subtitle:** Discover What’s Nearby.
* **Target Users:** Tourists, backpackers, business travelers, and visitors navigating unfamiliar cities and localities.
* **Problem Solved:** When travelers are in unfamiliar destinations, finding nearby critical services (e.g., an emergency hospital, a 24/7 pharmacy, a working cash ATM, or an accessible public restroom) can be difficult and stressful. Search results often lack precise distances, operating details, or spatial verification. **Voyage** solves this by providing real-time geographic queries, live distance sorting, interactive map inspection, and direct directions.
* **Benchmark Website:** [OpenStreetMap](https://www.openstreetmap.org/)

---

## 🛠️ 2. Technology Stack

| Technology | Purpose | Implementation Details |
| :--- | :--- | :--- |
| **HTML5** | Semantic Structure | Accessible layout, ARIA attributes, responsive layout containers |
| **Tailwind CSS** | Modern Styling & Design | Utility-first CSS via CDN, clean color tokens, responsive flexbox & grid |
| **Vanilla JavaScript (ES6+)** | Logic & Controller | Modular architecture (`config.js`, `api.js`, `map.js`, `ui.js`, `app.js`) without heavy external frameworks |
| **Leaflet.js (v1.9.4)** | Interactive Mapping | Smooth zooming, custom colored SVG markers, radius circles, rich popups |
| **OpenStreetMap Tiles** | Map Basemap | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with OSM attribution |
| **Nominatim API** | Geocoding & Reverse Geocoding | Converts text queries (e.g., "Paris", "Times Square") into coordinates and coordinates to addresses |
| **Overpass API** | Geographic Data Retrieval | Overpass QL queries fetching real-time nodes and building ways with multi-mirror failover |

---

## ✨ 3. Key Features & Functional Requirements

1. **Brand Interface:** Clean, professional UI displaying the brand title *“Voyage”* and subtitle *“Discover What’s Nearby.”*
2. **Category Selectors:** Dedicated buttons for **Hospitals**, **Pharmacies**, **ATMs**, and **Public Toilets**, each with unique color-coded pins, icons, and real-time count badges.
3. **Location Search Input:** Form input supporting cities, localities, addresses, or landmarks (e.g., *"Eiffel Tower"*, *"Central London"*, *"Tokyo Station"*).
4. **Form Submission & Enter Key:** Full form submission handling and instant execution on pressing <kbd>Enter</kbd>.
5. **Input Validation:** Helpful feedback for blank or short queries with inline error warnings and field highlighting.
6. **Nominatim Geocoding:** Converts user location inputs into verified coordinates (`latitude`, `longitude`).
7. **Overpass API Integration:** Generates Overpass QL queries to find amenities within a configurable search radius.
8. **Real JSON Processing:** Parses real API responses, extracts names, street addresses, opening hours, phone numbers, and wheelchair accessibility tags.
9. **Distance-Sorted Results List:** Computes true geodesic distance using the **Haversine formula** and orders results from closest to furthest.
10. **Interactive Leaflet Map:** Displays searched center with a pulsing beacon, a semi-transparent search radius boundary circle, and custom markers.
11. **Bi-directional Map & List Interaction:**
    * Clicking a card in the list flies the map to that marker, opens the popup, and pulses the marker.
    * Clicking a map marker highlights and automatically scrolls the corresponding card into view in the results panel.
12. **Loading States:** Shimmering skeleton placeholders and progress banners (*"Finding coordinates..."*, *"Querying Overpass API..."*).
13. **Error Handling & Multi-Mirror Failover:** Gracefully handles rate limits (HTTP 429), gateway timeouts (HTTP 502/504), network disconnections, and empty queries. Automatically fails over across multiple public Overpass mirrors (`openstreetmap.fr`, `overpass-api.de`, `kumi.systems`).
14. **Welcoming Empty State:** Provides quick-start chips for popular travel hubs (Paris, London, New York, Tokyo, Rome, Bengaluru) and user guidance before the first search.
15. **Responsive Design:** Split-screen layout on desktop; tabbed List/Map view on mobile screens.

---

## 🎯 4. JavaScript Events Implemented (Assessment Requirement)

As required by the practical examination, the application implements multiple meaningful JavaScript events:

1. **`submit` event on Search Form:** Intercepts form submission via `e.preventDefault()`, validates the entered query, triggers the geocoding request, and initiates facility discovery.
2. **`keydown` event on Location Input:** Listens for the <kbd>Enter</kbd> key to trigger instant search, and `input` events to clear validation warnings.
3. **`click` event on Category Buttons:** Toggles the active category filter, updates button styles, and triggers a new Overpass query around the existing location.
4. **`click` event on Facility Result Cards:** Handles card selection, executes `MapService.focusFacility(id)`, flies the Leaflet map smoothly to the location, and opens the marker popup.
5. **`click` event on Leaflet Map Markers:** Triggers popup display, identifies the active facility, and executes `UiService.highlightCard(id)` to scroll the list item into view.
6. **`click` event on Map Blank Space:** Listens to `map.on('click')` so travelers can tap any spot on the map to reverse geocode and search essentials around that exact point.
7. **`click` event on GPS Locate Button:** Triggers `navigator.geolocation.getCurrentPosition()`, converts coordinates to a readable address, and searches essentials nearby.
8. **`change` event on Radius Select Dropdown:** Changes the search radius (1 km, 2 km, 5 km, 10 km) and refreshes results immediately.
9. **`input` event on Results Filter Box:** Instant client-side filtering of the active results list by facility name or street name.

---

## 🗂️ 5. Project File Structure

```
c:\Users\mathe\OneDrive\Documents\FSD(sem 2)\exam/
├── index.html              # Main HTML5 application structure with Tailwind and Leaflet CDN
├── css/
│   └── styles.css          # Custom styling, animations, leaflet overrides, scrollbars
├── js/
│   ├── config.js           # Category definitions, default coordinates, endpoints
│   ├── api.js              # Nominatim geocoding & Overpass queries with multi-mirror failover
│   ├── map.js              # Leaflet initialization, custom SVG markers, popups, radius circle
│   ├── ui.js               # Render cards, skeletons, empty states, toasts, badges
│   └── app.js              # Event listeners, state coordinator, search controller
└── README.md               # Complete documentation for practical exam evaluation
```

---

## 🚀 6. Setup & Execution Instructions

The project is built using standard, lightweight web technologies and does not require complex build steps or node package installations.

### Option A: Using Python (Recommended)
Open a terminal in the project directory and run:
```bash
python -m http.server 8000
```
Then open your browser and navigate to:
```
http://localhost:8000
```

### Option B: Using Node.js
If you have Node.js installed, you can run:
```bash
npx serve .
```
Or start a simple static HTTP server:
```bash
node -e "const http = require('http'), fs = require('fs'), path = require('path'); const server = http.createServer((req, res) => { let filePath = '.' + (req.url === '/' ? '/index.html' : req.url.split('?')[0]); const ext = path.extname(filePath); const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' }[ext] || 'text/plain'; fs.readFile(filePath, (err, content) => { if (err) { res.writeHead(404); res.end('Not Found'); } else { res.writeHead(200, { 'Content-Type': mime }); res.end(content); } }); }); server.listen(8000, () => console.log('Server running on http://localhost:8000'));"
```

### Option C: Direct Browser Opening
You can directly open `index.html` in modern web browsers (Google Chrome, Microsoft Edge, Mozilla Firefox). 
*Note: An HTTP server is recommended to avoid any local `file://` CORS restrictions with certain geolocation features.*

---

## 🌐 7. APIs Used & Query Specifications

### 1. OpenStreetMap Nominatim API
* **Endpoint:** `https://nominatim.openstreetmap.org/search`
* **Format:** JSON
* **Parameters:** `format=json&limit=5&addressdetails=1&q={encodedQuery}`
* **Reverse Geocoding:** `https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}`

### 2. OpenStreetMap Overpass API
* **Primary Mirror:** `https://overpass.openstreetmap.fr/api/interpreter`
* **Secondary Mirror:** `https://overpass-api.de/api/interpreter`
* **Tertiary Mirror:** `https://overpass.kumi.systems/api/interpreter`
* **Sample Overpass QL Query (Pharmacies within 2000m):**
  ```overpass
  [out:json][timeout:20];
  (
    node["amenity"="pharmacy"](around:2000,48.8566,2.3522);
    way["amenity"="pharmacy"](around:2000,48.8566,2.3522);
  );
  out center 40;
  ```

---

## 🧪 8. Testing Procedure & Verification Scenarios

| Test Case | Steps to Perform | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **TC-01: Empty Input Validation** | Click Search button with an empty input field. | Red validation error displayed: *"Please enter a city, area, or landmark"*; input field outlined in red. | PASS |
| **TC-02: Geocoding & Query** | Type *"Paris"* and click Search or press Enter. | Map flies to Paris; pulsing center pin & radius circle appear; real hospitals fetched and displayed. | PASS |
| **TC-03: Category Switching** | Click *"Pharmacies"* button. | Category pill highlights emerald; badge updates; map markers switch to green pill icons; pharmacies list displayed. | PASS |
| **TC-04: Card Click Interaction** | Click any hospital/pharmacy card in the results list. | Map smoothly pans to the selected facility; popup opens with details and directions button; marker bounces. | PASS |
| **TC-05: Marker Click Interaction** | Click any marker on the map. | Leaflet popup displays details; corresponding card in left sidebar is highlighted with blue border and scrolled into view. | PASS |
| **TC-06: Interactive Map Click** | Click on any street/spot on the map. | App triggers reverse geocoding and fetches essential places around the clicked coordinates. | PASS |
| **TC-07: Radius Adjustment** | Change radius dropdown to *"5 km"*. | Search radius circle expands on map; additional facilities within 5km are fetched and counted. | PASS |
| **TC-08: In-Results Live Filter** | Type letters (e.g. *"Saint"*) into the filter box. | Results list filters down in real-time to matching facility names or streets without re-querying the API. | PASS |
| **TC-09: Preset City Chips** | Click *"Tokyo"* or *"London"* chip from empty state. | Instant search executed for that destination; map and list populate with verified facilities. | PASS |
| **TC-10: Mobile Responsiveness** | Resize screen to mobile width (< 768px). | Mobile tab toggle appears; user can smoothly toggle between *"List"* view and *"Map"* view. | PASS |

---

## ⚠️ 9. Limitations & Real-World Considerations

1. **Overpass Server Capacity:** Free public Overpass servers are volunteer-maintained and occasionally experience short load spikes or rate-limiting (HTTP 429/502). The application mitigates this by maintaining a multi-mirror fallback chain (`openstreetmap.fr`, `overpass-api.de`, `kumi.systems`).
2. **Community Tagging Variations:** In OpenStreetMap, address information (`addr:street`, `addr:housenumber`) is crowd-sourced. If a specific venue does not have an explicit street registered, the application gracefully falls back to neighborhood, city, or coordinate metadata.
3. **Browser Geolocation Permissions:** The "Use GPS Location" button requires explicit user permission in HTTPS or localhost environments. If denied, a friendly guidance message instructs the user to enter a location name manually.

---

## 🎓 10. Student Viva / Examination Questions & Answers

**Q1: How does the application calculate the distance between the searched location and the facility?**  
*Answer:* The application implements the **Haversine formula** in `ApiService.calculateHaversineDistance()`. The formula calculates the great-circle distance between two points on a sphere given their longitudes and latitudes:
$$\Delta\sigma = 2 \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)} \right)$$
$$d = R \cdot \Delta\sigma$$
where $R$ is the Earth's radius (approx. $6,371\text{ km}$).

**Q2: What is the difference between Nominatim and Overpass API?**  
*Answer:* **Nominatim** is a search engine for OpenStreetMap data used specifically for *geocoding* (converting text address strings into coordinates) and *reverse geocoding* (converting coordinates into an address). **Overpass API** is a specialized read-only API designed to query OpenStreetMap features by specific tags (such as `amenity=hospital`, `amenity=pharmacy`) and spatial boundaries (such as `around:2000,lat,lon`).

**Q3: How is bi-directional interaction achieved between Leaflet and the DOM?**  
*Answer:* Every parsed facility has a unique OSM ID (`item.id`). In `MapService`, each Leaflet marker is stored in a `Map<id, L.marker>`. Each HTML result card has `data-id="${item.id}"`. When a card is clicked, `MapService.focusFacility(item.id)` pans the map and triggers `marker.openPopup()`. Conversely, when a marker is clicked on the map, its click handler calls `UiService.highlightCard(item.id)`, which applies an active CSS class and executes `scrollIntoView({ behavior: 'smooth' })`.
