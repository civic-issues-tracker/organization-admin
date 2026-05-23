# Organization Admin Portal

A React + TypeScript web application for organization administrators to manage civic issues assigned to their organization.

## Features

- **Dashboard**: View and manage assigned issues in a queue
- **Map View**: Geospatial visualization of issue locations using Leaflet
- **Analytics**: Charts and metrics for resolved tickets
- **Alerts**: Real-time notifications for issue updates
- **Settings**: Organization-specific configurations

## Tech Stack

- React 19.2.5
- TypeScript 6.0.2
- Vite 8.0.10
- TailwindCSS 4.3.0
- React Router 7.15.0
- Axios 1.16.0
- Leaflet 1.9.4
- Recharts 3.8.1

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start development server
npm run dev
```

Runs on `http://localhost:5173`

## Build

```bash
npm run build
```

Output: `dist/` folder

## Environment

Create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Project Structure

```
src/
├── app/              # Routes and layout
├── components/       # Reusable UI components
├── context/          # React Context (Auth)
├── features/         # Feature modules
├── hooks/            # Custom hooks
├── lib/              # Utilities
├── stores/           # State management
└── types/            # TypeScript types
```

## API Integration

Uses JWT authentication with refresh tokens. API requests configured via `VITE_API_BASE_URL`.

## Linting

```bash
npm run lint
```

## License

Civic Issues Tracker Project
