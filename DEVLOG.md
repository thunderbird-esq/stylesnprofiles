# Development Log

## 2025-12-07 - Phase 1: Design System Foundation

### Session Summary
Fixed scrollbar SVG rendering issue and established CSS font sizing variables for consistent scaling across apps.

### Root Cause Analysis: Scrollbar SVGs Not Loading
- **ISSUE**: `system-css-main/style.css` uses `svg-load()` - a PostCSS function
- **PROBLEM**: Our compiled CSS had text character fallbacks (▲▼◄►) but no SVG processing
- **SOLUTION**: Embedded SVG as base64 data URIs directly in CSS
- **RESULT**: Scrollbar buttons now display proper System 6 pixel-art arrows

### Completed Tasks

**1.1 CSS Font Sizing Variables**
- Added to `:root` in `system.css`:
  - `--font-size-base: 12px`
  - `--font-size-sm: 10px`
  - `--font-size-lg: 16px` (40% larger)
  - `--font-size-xl: 21px` (75% larger)
  - `--font-size-xxl: 24px` (2x)

**1.2 Scrollbar SVG Fix**
- Converted all 4 scrollbar arrow SVGs to base64 data URIs
- Inline embedded in `system.css` for up/down/left/right buttons
- Active state uses relative URL to SVG files (compiled into build)

**1.3 Utility Classes**
- `.text-sm`, `.text-base`, `.text-lg`, `.text-xl`, `.text-xxl`
- `.app-text-lg` container class scales all child text/buttons 40% larger

**1.4 Documentation**
- Created `SYSTEM6_DESIGN_STANDARDS.md` with usage guidelines
- Created `.stylelintrc.json` for future CSS linting

### Files Changed
- `client/src/styles/system.css` - Font variables, scrollbar SVGs, utility classes
- `client/SYSTEM6_DESIGN_STANDARDS.md` - NEW documentation
- `client/.stylelintrc.json` - NEW lint config

### Verified
- Build successful: CSS increased 1.6KB (font vars + utilities)
- Scrollbar buttons display proper pixel-art arrows in deployed app
- Font sizing variables available for Phase 2 text scaling

---

## 2025-12-05 - Week 5: NASA API Expansion

### Session Summary
Implemented 5 new NASA apps and significantly expanded API coverage. Fixed EPIC connectivity issues.

### Root Cause Analysis
- **Mars Rover API**: Archived (Heroku backend is down)
- **EPIC API**: Intermittent connectivity - added fallback to api.nasa.gov mirror
- **DEMO_KEY**: Rate limited - users need their own key from api.nasa.gov

### Completed Tasks

**Phase A: New API Functions (12 new endpoints)**
- DONKI Space Weather: `getDonkiCME()`, `getDonkiFLR()`, `getDonkiGST()`, `getDonkiSEP()`, `getDonkiNotifications()`
- EONET Events: `getEonetEvents()`, `getEonetCategories()`
- SSD/CNEOS: `getCloseApproaches()`, `getSmallBodyData()`
- Exoplanet: `getExoplanets()`
- Techport: `getTechportProjects()`, `getTechportProject()`
- InSight: `getInsightWeather()`

**Phase B: New App Components**
- `SpaceWeatherApp.js` - CME, solar flares, geomagnetic storms
- `EarthEventsApp.js` - EONET wildfires, storms, volcanoes
- `ExoplanetApp.js` - 5,000+ planets from Exoplanet Archive
- `CloseApproachApp.js` - Asteroid flybys from JPL SSD
- `TechportApp.js` - NASA technology projects

**Phase C: EPIC Fix**
- Added fallback from epic.gsfc.nasa.gov to api.nasa.gov mirror
- 10-second timeout with automatic retry
- Better connectivity error messages

**Phase D: Text Size Increase**
- Base content: 15px → 20px (+35%)
- Titles: 17px → 26px
- NEO details: 20px → 22px
- Panel titles: 24px → 28px

**Phase E: Desktop Updates**
- 11 app icons (was 6)
- New: Space Weather, Earth Events, Exoplanets, Close Approach, Techport

### Files Changed
- `client/src/services/nasaApi.js` - Added 12+ API functions, EPIC fallback
- `client/src/components/apps/SpaceWeatherApp.js` - NEW
- `client/src/components/apps/EarthEventsApp.js` - NEW
- `client/src/components/apps/ExoplanetApp.js` - NEW
- `client/src/components/apps/CloseApproachApp.js` - NEW
- `client/src/components/apps/TechportApp.js` - NEW
- `client/src/contexts/AppContext.js` - Registered 5 new apps
- `client/src/components/system6/Desktop.js` - Added 5 icons
- `client/src/styles/system.css` - Increased text sizes
- `CHANGELOG.md` - Added v0.4.0 notes

### Build Stats
- Bundle size: 253.58 kB gzip (+5.06 kB)
- 5 new components added

### Live URL
https://thunderbird-esq.github.io/stylesnprofiles

---

## 2025-12-05 - Week 4 Implementation

### Completed Tasks

**Phase A: API Extensions**
- Extended `nasaApi.js` with 7 new functions:
  - `getMarsPhotos()` / `getMarsRoverManifest()`
  - `searchNasaLibrary()` / `getNasaLibraryAsset()`
  - `getEpicImages()` / `getEpicDates()` / `buildEpicImageUrl()`

**Phase B: Mars Rover App**
- Created `MarsRoverApp.js` (260+ lines)
- Rover selection: Curiosity, Opportunity, Spirit, Perseverance
- Sol (Mars day) and camera filters
- Paginated photo grid with thumbnails
- Full-size modal with mission metadata

**Phase C: NASA Library App**
- Created `NasaLibraryApp.js` (320+ lines)
- Full-text search (images.nasa.gov API)
- Media type and year filters
- Paginated results grid
- Detail modal with metadata

**Phase D: EPIC Earth App**
- Created `EpicApp.js` (230+ lines)
- Natural and Enhanced color modes
- Date picker for historical images
- Image carousel with thumbnail strip
- Coordinate and sun position display

**Phase E-F: Integration**
- Registered apps in `AppContext.js`
- Added desktop icons for all new apps
- Fixed SaveButton `itemDate` prop issues

**Phase G: Validation**
- Build successful (247.31 kB gzip)
- Deployed to GitHub Pages
- Updated CHANGELOG.md

### Technical Notes
- All apps are client-side only (no server required)
- NASA APIs called directly with user's API key or DEMO_KEY
- Bookmark/save functionality uses localStorage
- Mobile touch support already in place from previous session

### Files Changed
- `client/src/services/nasaApi.js` - Added 7 API functions
- `client/src/components/apps/MarsRoverApp.js` - NEW
- `client/src/components/apps/NasaLibraryApp.js` - NEW
- `client/src/components/apps/EpicApp.js` - NEW
- `client/src/contexts/AppContext.js` - Registered 3 new apps
- `client/src/components/system6/Desktop.js` - Added 3 new icons
- `CHANGELOG.md` - Added v0.3.0 release notes

### Live URL
https://thunderbird-esq.github.io/stylesnprofiles

---

## 2025-12-04 - Mobile Touch & UI Improvements

### Completed Tasks
- Mobile touch support for window dragging
- Text size increased by 8.5%
- NEO 3D visualization improvements (brighter, full orbits)
- Responsive CSS for mobile/tablet devices

---

## 2025-12-05 - System 6 HIG Overhaul + Three.js Sun

### Session Summary
Major design discipline enforcement (Apple HIG 1986), critical bug fixes, and new Three.js sun visualization for DONKI space weather.

### Root Cause Analysis
- **Earth Events Map**: GIBS tiles were only showing southern hemisphere. Switched to WMS.
- **Dark Themes**: Violated Apple HIG 1986 - all removed.
- **Techport Rate Limit**: DEMO_KEY gets throttled - added sequential requests.

### Completed Tasks

**Phase A: Design Discipline**
- Removed dark themes from EPIC, Earth Viewer, Exoplanets, Techport
- All apps use white backgrounds, System 6 modals
- Modal overlays now semi-transparent gray

**Phase B: Three.js Sun Visualization**
- Created `SunVisualization.js` with animated sun + corona
- CME particle system radiating from sun
- Earth with orbital path
- System 6 styled controls (play/pause, intensity slider)
- Integrated into SpaceWeatherApp with toggle button

**Phase C: Bug Fixes**
- Earth Events: NASA Earth Observatory map (reliable CORS)
- Exoplanet: 30s timeout, better error handling
- Techport: Sequential API requests, API key status display
- Deleted CloseApproachApp (duplicated NEO)

**Phase D: Earth Viewer Enhancement**
- 20+ GIBS layers in 6 categories
- 9 region presets
- Zoom controls (0.5x - 8x)
- 7-day skip buttons

### Files Changed
- `EarthEventsApp.js` - Map fix
- `EarthViewerApp.js` - 20+ layers, zoom, regions
- `ExoplanetApp.js` - Error handling
- `TechportApp.js` - Sequential requests
- `SpaceWeatherApp.js` - Sun viz integration
- `SunVisualization.js` - NEW Three.js component
- `EPIC/EarthViewer/Exoplanet/Techport` - System 6 styling

---

*Development log for NASA System 6 Portal*

