/* USA full-viewport map: accurate states + cities + live time zones.
   Sources:
   - State polygons: ./us-states.json (Natural Earth via PublicaMundi, WGS84)
   - No tile layer: plain ocean background, fully self-contained, no API key
   - City coords: US Census / GNIS (WGS84, 4dp)
   - Times: browser Intl API with IANA zones (DST-aware, correct "now")
*/

const TIME_ZONES = [
  { id: "hawaii",   label: "Hawaii",   iana: "Pacific/Honolulu",  color: "#0d9488", abbr: "HT" },
  { id: "alaska",   label: "Alaska",   iana: "America/Anchorage", color: "#dc2626", abbr: "AKT" },
  { id: "pacific",  label: "Pacific",  iana: "America/Los_Angeles", color: "#15803d", abbr: "PT" },
  { id: "mountain", label: "Mountain", iana: "America/Denver",   color: "#c2410c", abbr: "MT" },
  { id: "central",  label: "Central",  iana: "America/Chicago",  color: "#0284c7", abbr: "CT" },
  { id: "eastern",  label: "Eastern",  iana: "America/New_York", color: "#eab308", abbr: "ET" },
];
const TZ_BY_ID = Object.fromEntries(TIME_ZONES.map(t => [t.id, t]));

// Primary time zone per state (majority of population/area).
// split:true means the state legally spans two zones — popups + city markers give exact time.
const STATE_TZ = {
  "Alabama": { tz: "central" }, "Alaska": { tz: "alaska" }, "Arizona": { tz: "mountain", note: "No DST — stays MST year-round" },
  "Arkansas": { tz: "central" }, "California": { tz: "pacific" }, "Colorado": { tz: "mountain" },
  "Connecticut": { tz: "eastern" }, "Delaware": { tz: "eastern" }, "District of Columbia": { tz: "eastern" },
  "Florida": { tz: "eastern", split: "Eastern / Central (Panhandle)", note: "Panhandle west of Apalachicola River is Central" },
  "Georgia": { tz: "eastern" }, "Hawaii": { tz: "hawaii", note: "No DST" },
  "Idaho": { tz: "mountain", split: "Mountain / Pacific (north)", note: "Northern panhandle (Coeur d'Alene, Moscow) is Pacific" },
  "Illinois": { tz: "central" }, "Indiana": { tz: "eastern", split: "Eastern / Central (NW & SW)", note: "NW (Gary) + SW (Evansville) are Central" },
  "Iowa": { tz: "central" }, "Kansas": { tz: "central", split: "Central / Mountain (far west)", note: "4 far-west counties are Mountain" },
  "Kentucky": { tz: "eastern", split: "Eastern / Central (west)", note: "Western half (Louisville westward) is Central" },
  "Louisiana": { tz: "central" }, "Maine": { tz: "eastern" }, "Maryland": { tz: "eastern" },
  "Massachusetts": { tz: "eastern" }, "Michigan": { tz: "eastern", split: "Eastern / Central (UP tip)", note: "Western Upper Peninsula is Central" },
  "Minnesota": { tz: "central" }, "Mississippi": { tz: "central" }, "Missouri": { tz: "central" },
  "Montana": { tz: "mountain" }, "Nebraska": { tz: "central", split: "Central / Mountain (west)", note: "Western panhandle is Mountain" },
  "Nevada": { tz: "pacific" }, "New Hampshire": { tz: "eastern" }, "New Jersey": { tz: "eastern" },
  "New Mexico": { tz: "mountain" }, "New York": { tz: "eastern" }, "North Carolina": { tz: "eastern" },
  "North Dakota": { tz: "central", split: "Central / Mountain (SW)", note: "SW corner is Mountain" },
  "Ohio": { tz: "eastern" }, "Oklahoma": { tz: "central" }, "Oregon": { tz: "pacific", split: "Pacific / Mountain (east edge)", note: "Malheur County (east) is Mountain" },
  "Pennsylvania": { tz: "eastern" }, "Rhode Island": { tz: "eastern" }, "South Carolina": { tz: "eastern" },
  "South Dakota": { tz: "central", split: "Central / Mountain (west)", note: "West of Missouri River area is Mountain" },
  "Tennessee": { tz: "central", split: "Central / Eastern (east)", note: "East (Knoxville, Chattanooga) is Eastern" },
  "Texas": { tz: "central", split: "Central / Mountain (far west)", note: "El Paso + far west are Mountain" },
  "Utah": { tz: "mountain" }, "Vermont": { tz: "eastern" }, "Virginia": { tz: "eastern" },
  "Washington": { tz: "pacific" }, "West Virginia": { tz: "eastern" }, "Wisconsin": { tz: "central" },
  "Wyoming": { tz: "mountain" },
};

const STATE_ABBR = { Alabama:"AL",Alaska:"AK",Arizona:"AZ",Arkansas:"AR",California:"CA",Colorado:"CO",Connecticut:"CT",Delaware:"DE","District of Columbia":"DC",Florida:"FL",Georgia:"GA",Hawaii:"HI",Idaho:"ID",Illinois:"IL",Indiana:"IN",Iowa:"IA",Kansas:"KS",Kentucky:"KY",Louisiana:"LA",Maine:"ME",Maryland:"MD",Massachusetts:"MA",Michigan:"MI",Minnesota:"MN",Mississippi:"MS",Missouri:"MO",Montana:"MT",Nebraska:"NE",Nevada:"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND",Ohio:"OH",Oklahoma:"OK",Oregon:"OR",Pennsylvania:"PA","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD",Tennessee:"TN",Texas:"TX",Utah:"UT",Vermont:"VT",Virginia:"VA",Washington:"WA","West Virginia":"WV",Wisconsin:"WI",Wyoming:"WY" };

// Major cities — accurate WGS84 coords (city center, US Census/GNIS to ~4dp).
// iana per city gives exact local time even inside split states. tier 1 = always labeled.
const CITIES = [
  { name: "New York", state: "NY", lat: 40.7128, lon: -74.0060, iana: "America/New_York", tier: 1 },
  { name: "Los Angeles", state: "CA", lat: 34.0522, lon: -118.2437, iana: "America/Los_Angeles", tier: 1 },
  { name: "Chicago", state: "IL", lat: 41.8781, lon: -87.6298, iana: "America/Chicago", tier: 1 },
  { name: "Houston", state: "TX", lat: 29.7604, lon: -95.3698, iana: "America/Chicago", tier: 1 },
  { name: "Phoenix", state: "AZ", lat: 33.4484, lon: -112.0740, iana: "America/Phoenix", tier: 1 },
  { name: "Philadelphia", state: "PA", lat: 39.9526, lon: -75.1652, iana: "America/New_York", tier: 1 },
  { name: "San Antonio", state: "TX", lat: 29.4241, lon: -98.4936, iana: "America/Chicago", tier: 1 },
  { name: "San Diego", state: "CA", lat: 32.7157, lon: -117.1611, iana: "America/Los_Angeles", tier: 1 },
  { name: "Dallas", state: "TX", lat: 32.7767, lon: -96.7970, iana: "America/Chicago", tier: 1 },
  { name: "San Jose", state: "CA", lat: 37.3382, lon: -121.8863, iana: "America/Los_Angeles", tier: 1 },
  { name: "Austin", state: "TX", lat: 30.2672, lon: -97.7431, iana: "America/Chicago", tier: 1 },
  { name: "Seattle", state: "WA", lat: 47.6062, lon: -122.3321, iana: "America/Los_Angeles", tier: 1 },
  { name: "Denver", state: "CO", lat: 39.7392, lon: -104.9903, iana: "America/Denver", tier: 1 },
  { name: "Boston", state: "MA", lat: 42.3601, lon: -71.0589, iana: "America/New_York", tier: 1 },
  { name: "Atlanta", state: "GA", lat: 33.7490, lon: -84.3880, iana: "America/New_York", tier: 1 },
  { name: "Miami", state: "FL", lat: 25.7617, lon: -80.1918, iana: "America/New_York", tier: 1 },
  { name: "Detroit", state: "MI", lat: 42.3314, lon: -83.0458, iana: "America/Detroit", tier: 1 },
  { name: "Minneapolis", state: "MN", lat: 44.9778, lon: -93.2650, iana: "America/Chicago", tier: 1 },
  { name: "Las Vegas", state: "NV", lat: 36.1699, lon: -115.1398, iana: "America/Los_Angeles", tier: 1 },
  { name: "Portland", state: "OR", lat: 45.5152, lon: -122.6784, iana: "America/Los_Angeles", tier: 2 },
  { name: "San Francisco", state: "CA", lat: 37.7749, lon: -122.4194, iana: "America/Los_Angeles", tier: 1 },
  { name: "Columbus", state: "OH", lat: 39.9612, lon: -82.9988, iana: "America/New_York", tier: 2 },
  { name: "Charlotte", state: "NC", lat: 35.2271, lon: -80.8431, iana: "America/New_York", tier: 2 },
  { name: "Indianapolis", state: "IN", lat: 39.7684, lon: -86.1581, iana: "America/Indiana/Indianapolis", tier: 2 },
  { name: "Nashville", state: "TN", lat: 36.1627, lon: -86.7816, iana: "America/Chicago", tier: 2 },
  { name: "Oklahoma City", state: "OK", lat: 35.4676, lon: -97.5164, iana: "America/Chicago", tier: 2 },
  { name: "Memphis", state: "TN", lat: 35.1495, lon: -90.0490, iana: "America/Chicago", tier: 2 },
  { name: "Louisville", state: "KY", lat: 38.2527, lon: -85.7585, iana: "America/Kentucky/Louisville", tier: 2 },
  { name: "Baltimore", state: "MD", lat: 39.2904, lon: -76.6122, iana: "America/New_York", tier: 2 },
  { name: "Washington", state: "DC", lat: 38.9072, lon: -77.0369, iana: "America/New_York", tier: 1 },
  { name: "Milwaukee", state: "WI", lat: 43.0389, lon: -87.9065, iana: "America/Chicago", tier: 2 },
  { name: "Albuquerque", state: "NM", lat: 35.0844, lon: -106.6504, iana: "America/Denver", tier: 2 },
  { name: "Tucson", state: "AZ", lat: 32.2226, lon: -110.9747, iana: "America/Phoenix", tier: 2 },
  { name: "Salt Lake City", state: "UT", lat: 40.7608, lon: -111.8910, iana: "America/Denver", tier: 2 },
  { name: "Kansas City", state: "MO", lat: 39.0997, lon: -94.5786, iana: "America/Chicago", tier: 2 },
  { name: "Cleveland", state: "OH", lat: 41.4993, lon: -81.6944, iana: "America/New_York", tier: 2 },
  { name: "Pittsburgh", state: "PA", lat: 40.4406, lon: -79.9959, iana: "America/New_York", tier: 2 },
  { name: "Cincinnati", state: "OH", lat: 39.1031, lon: -84.5120, iana: "America/New_York", tier: 2 },
  { name: "Tampa", state: "FL", lat: 27.9506, lon: -82.4572, iana: "America/New_York", tier: 2 },
  { name: "Orlando", state: "FL", lat: 28.5383, lon: -81.3792, iana: "America/New_York", tier: 2 },
  { name: "Jacksonville", state: "FL", lat: 30.3322, lon: -81.6557, iana: "America/New_York", tier: 2 },
  { name: "Pensacola", state: "FL", lat: 30.4213, lon: -87.2169, iana: "America/Chicago", tier: 3 },
  { name: "New Orleans", state: "LA", lat: 29.9511, lon: -90.0715, iana: "America/Chicago", tier: 2 },
  { name: "St. Louis", state: "MO", lat: 38.6270, lon: -90.1994, iana: "America/Chicago", tier: 2 },
  { name: "Boise", state: "ID", lat: 43.6150, lon: -116.2023, iana: "America/Boise", tier: 3 },
  { name: "Coeur d'Alene", state: "ID", lat: 47.6777, lon: -116.7805, iana: "America/Los_Angeles", tier: 3 },
  { name: "El Paso", state: "TX", lat: 31.7619, lon: -106.4850, iana: "America/Denver", tier: 2 },
  { name: "Amarillo", state: "TX", lat: 35.1991, lon: -101.8313, iana: "America/Chicago", tier: 3 },
  { name: "Evansville", state: "IN", lat: 37.9716, lon: -87.5711, iana: "America/Chicago", tier: 3 },
  { name: "Gary", state: "IN", lat: 41.5934, lon: -87.3464, iana: "America/Chicago", tier: 3 },
  { name: "Marquette", state: "MI", lat: 46.5476, lon: -87.3956, iana: "America/Chicago", tier: 3 },
  { name: "Knoxville", state: "TN", lat: 35.9606, lon: -83.9207, iana: "America/New_York", tier: 3 },
  { name: "Cheyenne", state: "WY", lat: 41.1400, lon: -104.8202, iana: "America/Denver", tier: 3 },
  { name: "Omaha", state: "NE", lat: 41.2565, lon: -95.9345, iana: "America/Chicago", tier: 3 },
  { name: "Scottsbluff", state: "NE", lat: 41.8666, lon: -103.6672, iana: "America/Denver", tier: 3 },
  { name: "Fargo", state: "ND", lat: 46.8772, lon: -96.7898, iana: "America/Chicago", tier: 3 },
  { name: "Bozeman", state: "MT", lat: 45.6769, lon: -111.0429, iana: "America/Denver", tier: 3 },
  { name: "Honolulu", state: "HI", lat: 21.3099, lon: -157.8581, iana: "Pacific/Honolulu", tier: 1 },
  { name: "Anchorage", state: "AK", lat: 61.2181, lon: -149.9003, iana: "America/Anchorage", tier: 1 },
  { name: "Juneau", state: "AK", lat: 58.3019, lon: -134.4197, iana: "America/Juneau", tier: 3 },
];

// ---------- time helpers (DST-aware via Intl) ----------
function fmtTime(iana, withSec = true) {
  const opts = { timeZone: iana, hour: "numeric", minute: "2-digit", hour12: true };
  if (withSec) opts.second = "2-digit";
  return new Intl.DateTimeFormat("en-US", opts).format(new Date());
}
function tzAbbr(iana) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: iana, hour: "numeric", timeZoneName: "short" }).formatToParts(new Date());
    return (parts.find(p => p.type === "timeZoneName") || {}).value || "";
  } catch { return ""; }
}
function fmtDate(iana) {
  return new Intl.DateTimeFormat("en-US", { timeZone: iana, weekday: "short", month: "short", day: "numeric" }).format(new Date());
}

// ---------- map (no tile layer — self-contained US shapes only, no API key needed) ----------
const map = L.map("map", { zoomControl: false, worldCopyJump: false, zoomSnap: 0.5, attributionControl: true }).setView([39.8, -98.5], 4);
L.control.zoom({ position: "bottomright" }).addTo(map);
map.attributionControl.addAttribution("State shapes: Natural Earth via PublicaMundi");

function stateStyle(feature) {
  const info = STATE_TZ[feature.properties.name] || { tz: "central" };
  const base = TZ_BY_ID[info.tz] ? TZ_BY_ID[info.tz].color : "#94a3b8";
  return {
    fillColor: base, fillOpacity: info.split ? 0.8 : 0.7,
    color: info.split ? "#111827" : "#ffffff",
    weight: info.split ? 2 : 1.2,
    dashArray: info.split ? "5 3" : null,
    opacity: 1,
  };
}

let statesLayer, labelLayer = L.layerGroup().addTo(map);

fetch("us-states.json")
  .then(r => { if (!r.ok) throw new Error("states load failed"); return r.json(); })
  .then(geo => {
    geo.features = geo.features.filter(f => f.properties.name !== "Puerto Rico");
    statesLayer = L.geoJSON(geo, {
      style: stateStyle,
      onEachFeature: (feature, layer) => {
        const name = feature.properties.name;
        const abbr = STATE_ABBR[name] || name;
        const info = STATE_TZ[name] || { tz: "central" };
        const tzMeta = TZ_BY_ID[info.tz];
        layer.bindTooltip(`${name} — ${info.split ? info.split : tzMeta.label}`, { sticky: true, direction: "top" });
        layer.on("click", () => {
          const t = fmtTime(tzMeta.iana), ab = tzAbbr(tzMeta.iana);
          layer.bindPopup(
            `<b>${name} (${abbr})</b><br>` +
            (info.split ? `<i>Split state:</i> ${info.split}<br>${info.note || ""}<br>` : `${tzMeta.label} Time<br>`) +
            (info.note && !info.split ? `${info.note}<br>` : "") +
            `<b>${t} ${ab}</b><br><small>${fmtDate(tzMeta.iana)} · ${tzMeta.iana}</small>`
          ).openPopup();
        });
        // permanent state-abbrev label at polygon center
        try {
          const c = layer.getBounds().getCenter();
          L.tooltip({ permanent: true, direction: "center", className: "state-label", opacity: 1 })
            .setLatLng(c).setContent(abbr).addTo(labelLayer);
        } catch {}
      }
    }).addTo(map);
    statesLayer.bringToBack();
    // initial view: all 50 states visible, accounting for top bar
    map.fitBounds([[17.5, -179.5], [71.8, -64.5]], { paddingTopLeft: L.point(0, 90), paddingBottomRight: L.point(0, 10) });
  })
  .catch(err => {
    console.error(err);
    map.setView([39.8, -98.5], 4);
  });

// ---------- cities ----------
const cityLayer = L.layerGroup().addTo(map);
const cityMarkers = {};

function tzColorForIana(iana) {
  if (iana.includes("New_York") || iana.includes("Detroit") || iana.includes("Indiana") || iana.includes("Kentucky/Louisville")) return TZ_BY_ID.eastern.color;
  if (iana.includes("Chicago")) return TZ_BY_ID.central.color;
  if (iana.includes("Denver") || iana.includes("Boise") || iana.includes("Phoenix")) return TZ_BY_ID.mountain.color;
  if (iana.includes("Los_Angeles")) return TZ_BY_ID.pacific.color;
  if (iana.includes("Anchorage") || iana.includes("Juneau")) return TZ_BY_ID.alaska.color;
  if (iana.includes("Honolulu")) return TZ_BY_ID.hawaii.color;
  return "#64748b";
}

CITIES.forEach(c => {
  const color = tzColorForIana(c.iana);
  const r = c.tier === 1 ? 7 : c.tier === 2 ? 5.5 : 4.5;
  const m = L.circleMarker([c.lat, c.lon], {
    radius: r, fillColor: color, color: "#fff", weight: 2, opacity: 1, fillOpacity: 0.95,
  }).addTo(cityLayer);
  const showLabel = () => {
    const z = map.getZoom();
    const want = c.tier === 1 || (c.tier === 2 && z >= 4.5) || z >= 6;
    if (want && !m.getTooltip()) m.bindTooltip(`${c.name}, ${c.state}`, { permanent: true, direction: "top", offset: [0, -8], className: "city-label" });
    else if (!want && m.getTooltip() && m.getTooltip().options.permanent) m.unbindTooltip();
    else if (want && m.getTooltip() && !m.getTooltip().options.permanent) { m.unbindTooltip(); m.bindTooltip(`${c.name}, ${c.state}`, { permanent: true, direction: "top", offset: [0, -8], className: "city-label" }); }
  };
  showLabel();
  map.on("zoomend", showLabel);
  m.bindPopup(() => {
    return `<b>${c.name}, ${c.state}</b><br>${fmtTime(c.iana)} ${tzAbbr(c.iana)}<br><small>${fmtDate(c.iana)} · ${c.iana}<br>${c.lat.toFixed(4)}, ${c.lon.toFixed(4)}</small>`;
  });
  m.on("mouseover", function () { this.openPopup(); });
  cityMarkers[c.name.toLowerCase()] = { marker: m, city: c };
});

// refresh open city popup every second so time ticks
setInterval(() => {
  cityLayer.eachLayer(l => {
    if (l.isPopupOpen && l.isPopupOpen()) {
      const p = l.getPopup();
      if (p && p.isOpen && p.isOpen()) l.openPopup();
    }
  });
}, 1000);

// ---------- clocks / legend ----------
const clocksEl = document.getElementById("tz-clocks");
const legendEl = document.getElementById("legend-list");
TIME_ZONES.forEach(t => {
  const d = document.createElement("div");
  d.className = "tz-chip"; d.style.borderLeftColor = t.color;
  d.innerHTML = `<strong>${t.label}</strong><span class="time" id="clock-${t.id}">--:--:--</span><span class="abbr" id="abbr-${t.id}"></span>`;
  d.title = t.iana;
  clocksEl.appendChild(d);
  const li = document.createElement("li");
  li.innerHTML = `<span class="swatch" style="background:${t.color}"></span><span><b>${t.label}</b> — <span id="legend-${t.id}">--:--</span> <span id="legend-abbr-${t.id}"></span></span>`;
  legendEl.appendChild(li);
});

function tick() {
  const now = new Date();
  document.getElementById("utc-clock").textContent =
    "UTC " + new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(now)
    + " · " + new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(now);
  TIME_ZONES.forEach(t => {
    const el = document.getElementById("clock-" + t.id);
    const ab = document.getElementById("abbr-" + t.id);
    const lg = document.getElementById("legend-" + t.id);
    const lgAb = document.getElementById("legend-abbr-" + t.id);
    if (el) el.textContent = fmtTime(t.iana);
    const a = tzAbbr(t.iana);
    if (ab) ab.textContent = a;
    if (lg) lg.textContent = fmtTime(t.iana, false) + " " + fmtDate(t.iana);
    if (lgAb) lgAb.textContent = a;
  });
}
tick();
setInterval(tick, 1000);

// ---------- search ----------
const input = document.getElementById("city-search");
const results = document.getElementById("search-results");
input.addEventListener("input", () => {
  const q = input.value.trim().toLowerCase();
  results.innerHTML = "";
  if (!q) return;
  CITIES.filter(c => c.name.toLowerCase().includes(q)).slice(0, 8).forEach(c => {
    const li = document.createElement("li");
    li.textContent = `${c.name}, ${c.state} — ${fmtTime(c.iana, false)} ${tzAbbr(c.iana)}`;
    li.onclick = () => { map.flyTo([c.lat, c.lon], Math.max(map.getZoom(), 6), { duration: 1 }); cityMarkers[c.name.toLowerCase()].marker.openPopup(); };
    results.appendChild(li);
  });
});
