# FLOODGUARD — District Flood Response & Emergency Coordination Platform

FloodGuard is an existing MERN district emergency-operations application upgraded into a data-rich Assam flood-response demo while preserving its existing navigation, auth, Leaflet, MongoDB, Socket.IO and Groq architecture.

## Primary demo

`Assam → Dibrugarh`

Also supported:

- Assam → Lakhimpur
- Assam → Barpeta
- Assam → Morigaon
- Assam → Dhemaji
- Assam → Majuli
- Assam → Sonitpur
- Uttar Pradesh → Lucknow

## Public / real integrations

- **SACHET / NDMA:** `https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails` when reachable. Alerts are normalized and cached in MongoDB with `OFFICIAL` trust metadata. SACHET documents its CAP/RSS/public alert architecture and CAP XML caching requirements.
- **Open-Meteo:** live current + 7-day weather for the selected district; MongoDB cache is used when the API is unavailable.
- **OpenStreetMap + Leaflet:** map basemap and operational geospatial context.
- **OSRM:** live road routing with deterministic haversine fallback.
- **ASDMA:** public Assam Flood Report page is monitored at low frequency; its page/link metadata is stored as an official-source record when reachable.
- **Assam Water Resources:** public department site is monitored as a source page; no unsupported live gauge values are claimed.
- **CWC:** CWC flood-forecasting network is represented through clearly labelled cached/demo gauge records. The public CWC forecasting site is not treated as a machine-readable live API unless a stable public endpoint is actually available.
- **IMD:** a direct district-warning adapter exists, but object IDs are intentionally not hardcoded unless verified. Configure `IMD_DISTRICT_IDS_JSON` only with current IDs from IMD's API documentation. SACHET alerts remain the official alert path without this optional mapping.
- **Groq:** backend-only AI Copilot with deterministic database-grounded fallback.

## Data trust model

Every major operational record carries source metadata such as:

- `OFFICIAL`
- `VERIFIED`
- `COMMUNITY`
- `CACHED`
- `DEMO`
- `SIMULATION`
- `OPERATOR`

The UI displays the trust state. Demo seed data is never presented as government data.

## Fallback architecture

External feed → normalize → MongoDB cache → UI

If the external feed fails:

MongoDB cached record → UI

If there is no cache:

FloodGuard demo seed → UI

The dashboard therefore does not collapse into a blank `0 incidents` state just because a public API is unavailable.

## Setup

### One-command development

```bash
npm install
npm run install:all
npm run dev
```

This starts the Express/Socket.IO API and Vite frontend together. If you prefer separate terminals, use the Backend and Frontend commands below.

### Backend

Node.js 20+ is recommended. MongoDB may be local or MongoDB Atlas. FloodGuard still starts in populated demo-memory mode if MongoDB is temporarily unavailable.

```bash
cd backend
npm install
copy .env.example .env
npm run seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`.

## Environment

Backend `.env`:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_EXPIRES_IN`
- `GROQ_API_KEY` (optional; Copilot has a deterministic fallback)
- `GROQ_MODEL` (default `openai/gpt-oss-120b`)
- `CLIENT_URL`
- `AUTO_INGEST=true`
- `INGEST_INTERVAL_MS=300000`
- `IMD_DISTRICT_IDS_JSON={}` optional, only with verified current IMD object IDs

Frontend `.env`:

- `VITE_API_URL=http://localhost:5000/api`

No API key is required in the frontend.

## Demo accounts

Password for all: `floodguard123`

- `admin@floodguard.gov` — ADMIN
- `officer@floodguard.gov` — DISTRICT_OFFICER
- `responder@floodguard.gov` — FIELD_RESPONDER
- `citizen@floodguard.gov` — CITIZEN

The seeded operational default is Uttar Pradesh / Lucknow. Assam / Dibrugarh and additional configured districts remain available.

## Main demo flow

1. Login as District Officer.
2. Select Assam → Dibrugarh.
3. Command Centre immediately shows incidents, critical queue, resources, shelters, river situation, alerts and a populated Leaflet map.
4. Open a critical incident and inspect the explainable priority reasons.
5. Dispatch a recommended resource; OSRM route is shown, or a clearly labelled fallback route is used.
6. Block a road; Socket.IO updates the operational state without refresh.
7. Create an evacuation operation; shelter occupancy is persisted and status changes to `NEAR CAPACITY` / `FULL` at thresholds.
8. Login as Citizen in another browser/session and submit an emergency report.
9. The report becomes a MongoDB incident and is broadcast through Socket.IO.
10. Field Responder sees assigned/in-progress missions in a mobile-first view.
11. Ask AI Copilot for immediate attention, resources, shelter capacity or a situation summary.
12. Generate a print-friendly SITREP.
13. Run a simulation and compare before/after operational metrics.

## Honest limitations

- Public government sites can change endpoints, rate-limit requests or become unavailable. FloodGuard caches the last usable data and falls back to labelled demo data.
- CWC's public forecasting web application is not assumed to expose a stable anonymous JSON endpoint; therefore seeded gauge values are explicitly marked `CACHED`/`DEMO` rather than falsely claiming live CWC telemetry.
- Direct IMD district warning API integration requires current district object IDs. The adapter is present, but IDs are not guessed.
- OSM/Overpass and OSRM are public services and can have usage/rate limits; route fallback prevents the UI from breaking.

## Citizen public-safety workspace

Citizen accounts now use a separate sidebar and public-information surface:

- Public Safety
- Flood Map
- Find Shelter
- Emergency
- Evacuation
- Weather
- Official Alerts
- My Reports
- Emergency Contacts

Citizen reports create a district incident and appear in the command centre through Socket.IO. Citizen users never receive the internal resource/dispatch queue.

## Reliability improvements

The API now has two operational data modes:

1. MongoDB live/cache mode — normal deployment with persistent records.
2. Demo-memory mode — if MongoDB is temporarily unavailable, the API still starts with a populated Assam operational dataset so the UI never becomes an empty dashboard. Mutations remain in memory until MongoDB is restored.

The previous route-collection lookup bug based on `req.baseUrl` was also removed; CRUD endpoints now derive their collection from the actual request path.

## Data reliability — important

The backend now has a populated operational dataset independent of MongoDB availability.

### Backend

Node.js 20+ is recommended. MongoDB may be local or MongoDB Atlas. FloodGuard still starts in populated demo-memory mode if MongoDB is temporarily unavailable. demo dataset

The server-side memory dataset contains, for Dibrugarh:

- 35 incidents
- 18 response resources
- 10 shelters
- 22 road segments
- 2 river/gauge records
- 12 hospitals/police/fire facilities
- 4 flood zones
- 2 demo alerts
- 3 active evacuation operations
- 7-day demo weather fallback

Other configured districts receive the same operational structure with district-specific coordinates and names.

This data is generated in `backend/services/memoryStore.js` and is explicitly labelled `DEMO`.

### MongoDB behaviour

At startup FloodGuard:

1. Tries MongoDB.
2. If MongoDB is available, verifies/synchronizes missing demo operational collections from the backend dataset.
3. If MongoDB is unavailable, serves the same populated backend dataset from memory.
4. If MongoDB is available but a district is incomplete, the API automatically serves the populated backend dataset for that district instead of returning zeros.

Operational writes (dispatch, incident updates, shelter occupancy, evacuation, simulation and citizen reports) use the same fallback dataset whenever a district's MongoDB operational records are incomplete.

### Public data refresh

The backend also attempts low-frequency public refreshes for:

- SACHET / NDMA alerts
- Open-Meteo weather
- ASDMA public flood-report page

Public results are cached in memory and, where MongoDB is healthy, persisted through the existing ingestion/cache architecture.

A failed public fetch never replaces usable operational data with an empty response.


## Premium UI / multilingual layer

The frontend uses a light government-command-centre visual system with responsive desktop/tablet/mobile layouts, Leaflet operational mapping, Recharts analytics, Socket.IO live updates, notification drawer, accessible controls and a real language selector.

Supported language codes include English, Hindi, Bengali, Telugu, Marathi, Tamil, Gujarati, Urdu, Kannada, Odia, Malayalam, Punjabi, Assamese, Maithili, Sanskrit, Kashmiri, Nepali, Konkani, Sindhi, Dogri, Manipuri, Bodo and Santali. English/Hindi have the most complete interface dictionary; additional languages have structured core navigation translations and can be expanded without changing components.

## AI endpoints

- `POST /api/ai/extract` — structured incident extraction with deterministic fallback.
- `POST /api/ai/copilot` — database-grounded command copilot with fallback.
- `POST /api/ai/translate` — emergency/public message translation; falls back to the original text if Groq is unavailable.
- `POST /api/ai/advisory` — public flood-safety advisory generation.
- `POST /api/ai/sitrep` — database-grounded SITREP generation with deterministic fallback.

Groq is server-side only. `GROQ_API_KEY` is never bundled into the frontend.

## Trust / demo posture

FloodGuard intentionally separates `OFFICIAL`, `VERIFIED`, `COMMUNITY`, `CACHED`, `DEMO`, `SIMULATION` and `OPERATOR` records. Seeded records are not labelled as government alerts. Public feeds are cached and can fail without making the command centre unusable.
