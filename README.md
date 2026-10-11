# USA Map — States, Major Cities & Live Time Zones

Full-viewport website (GitHub Pages ready, no build step).

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

> Must be served over HTTP (not `file://`) so `us-states.json` can load.

## Put on GitHub Pages

```bash
git init
git add index.html styles.css app.js us-states.json README.md
git commit -m "US live time-zone map"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

Then: repo → **Settings → Pages → Deploy from a branch → main / (root)**.

## Accuracy

- **State shapes**: `us-states.json` (Natural Earth geometry via PublicaMundi, WGS84) drawn over a CARTO/OpenStreetMap base map.
- **Cities**: ~60 major cities with Census/GNIS lat/lon (4dp, city center), each tagged with its correct IANA zone — so split states (FL, TX, TN, KY, IN, ID, …) still show the exact local time per city.
- **Times**: browser `Intl.DateTimeFormat` with IANA zones (`America/New_York`, `America/Chicago`, `America/Denver`, `America/Los_Angeles`, `America/Anchorage`, `Pacific/Honolulu`, plus `America/Phoenix`, `America/Indiana/Indianapolis`, …). DST handled automatically (including Arizona/Hawaii no-DST). Ticks every second.
