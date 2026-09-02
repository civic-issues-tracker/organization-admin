# Organization Admin Portal

A React + TypeScript web application for organization administrators to manage civic issues assigned to their organization, featuring geospatial tracking, real-time alerts, and performance-optimized analytics.

## Features

- **Dashboard**: View and manage assigned issues in a queue.
- **Geospatial Map View**: High-performance interactive visualization of issue locations using Leaflet (optimized with `flyTo` panning and tile caching constraints).
- **Analytics**: Beautiful charts and metrics for resolved tickets.
- **Alerts**: Real-time notifications for issue updates.
- **Settings**: Organization-specific configurations.

## Tech Stack

- **Framework**: React 19.2.5 + TypeScript 6.0.2
- **Build Tool**: Vite 8.0.10
- **Styling**: TailwindCSS 4.3.0
- **Routing**: React Router 7.15.0
- **Networking**: Axios 1.16.0 (with JWT interceptors)
- **Maps**: Leaflet 1.9.4 & React Leaflet 5.0.0
- **Charts**: Recharts 3.8.1
- **Testing**: Vitest 4.1.5 + jsdom (DOM simulation)

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Runs locally on `http://localhost:5173`

## Testing

The project uses **Vitest** configured with `jsdom` to natively test UI components, hooks, and helpers without DOM-related crashes from libraries like Leaflet.

```bash
# Run tests
npm run test
```

## Build

```bash
npm run build
```

Output: `dist/` folder. Ready for Vercel/Netlify deployment.

## Environment variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
# Optional: Define a custom OSM tile server (defaults to public OSM)
VITE_MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

## Project Structure

```
src/
├── app/              # Application Routes and core layouts
├── components/       # Reusable UI components (buttons, inputs)
├── context/          # React Context (AuthContext)
├── features/         # Feature-based modules (dashboard, report, auth)
├── hooks/            # Custom hooks (useNotifications)
├── lib/              # Utilities and constants
├── stores/           # Global state management
└── types/            # TypeScript interfaces
```

## API Integration

Uses secure JWT authentication with automated refresh tokens via Axios interceptors. API requests are dynamically configured via `VITE_API_BASE_URL`.

## Linting

```bash
npm run lint
```

## License

Civic Issues Tracker Project. All rights reserved.
