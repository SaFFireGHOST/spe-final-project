# LastMile - Metro Last-Mile Ride Sharing

A modern web application for connecting metro commuters with shared rides for their last-mile journey.

## Features

### For Riders
- Request rides from metro stations to nearby destinations
- Real-time request status tracking (Pending → Assigned → Completed)
- Interactive map showing station locations and 400m geofence zones
- Auto-suggested destination areas based on selected stations

### For Drivers
- Register routes with multiple stations and destination areas
- Manage seat availability
- Simulate driver movement to stations
- Real-time geofence entry detection
- Visual tracking on interactive maps

### Admin Features
- Full CRUD operations for metro stations
- Interactive map visualization for station locations
- Manage nearby areas for each station

## Tech Stack

- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS with custom design system
- **State Management:** Zustand (with localStorage persistence)
- **Forms:** react-hook-form + zod validation
- **Maps:** Leaflet (OpenStreetMap)
- **UI Components:** Custom components + shadcn/ui
- **Testing:** Vitest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:8080`

### Running Tests

```bash
npm test
```

## Project Structure

```
src/
├── components/          # Shared layout components
│   ├── AppShell.tsx    # Main layout with nav & sidebar
│   └── AppSidebar.tsx  # Navigation sidebar
├── features/           # Feature-specific components (future organization)
├── hooks/              # Custom React hooks
│   ├── useStations.ts
│   ├── useRiderRequests.ts
│   ├── useDriverRoute.ts
│   └── useDriverSimulator.ts
├── lib/                # Utilities and types
│   ├── types.ts        # TypeScript interfaces
│   ├── geo.ts          # Geographic calculations
│   └── utils.ts        # General utilities
├── mocks/              # Mock data repositories
│   ├── stationsRepo.ts
│   ├── riderRepo.ts
│   └── driverRepo.ts
├── pages/              # Route pages
│   ├── Home.tsx
│   ├── Rider.tsx
│   ├── Driver.tsx
│   └── Stations.tsx
├── shared/             # Shared UI components
│   └── ui/
│       └── GeoMap.tsx  # Leaflet map wrapper
├── stores/             # Zustand stores
│   └── useRoleStore.ts
└── test/               # Test files
```

## Mock Data Layer

All data is stored in-memory and simulated with realistic latency (300-600ms). The following repositories are available:

### Stations Repository (`mocks/stationsRepo.ts`)
- Pre-seeded with 4 Bangalore metro stations
- CRUD operations: `getAllStations()`, `getStationById()`, `createStation()`, `updateStation()`, `deleteStation()`

### Rider Repository (`mocks/riderRepo.ts`)
- Create ride requests with status tracking
- `createRequest()`, `getRequestsByRider()`, `getAllRequests()`
- `simulateAssignments()` - randomly assigns pending requests

### Driver Repository (`mocks/driverRepo.ts`)
- Manage driver routes and availability
- `upsertRoute()`, `getRoute()`, `deleteRoute()`

## Key Features

### Geographic Calculations
The app includes comprehensive geospatial utilities:
- Haversine distance calculation
- Bearing calculation between coordinates
- Point movement along a bearing
- Geofence detection (400m radius)

### Driver Simulator
Simulates realistic driver movement:
- Starts 1km from target station
- Moves at constant speed (5 m/s ≈ 18 km/h)
- Updates position every second
- Detects geofence entry
- Calculates real-time ETA

### Form Validation
All forms use zod schemas:
- **Rider:** Required fields, ETA must be ≥ 0
- **Driver:** Seats validation, station selection, ETA matching window
- **Station:** Coordinate validation, area parsing

## Design System

The app uses a modern design system defined in `src/index.css`:
- **Primary:** Transportation blue (HSL: 200, 98%, 39%)
- **Accent:** Orange for CTAs (HSL: 25, 95%, 53%)
- **Success:** Green for active states
- **Warning:** Amber for pending states
- All colors support dark mode

### Components
- Cards with `rounded-2xl` for modern feel
- Generous padding and soft shadows
- Semantic color usage throughout
- Fully responsive mobile-first layout

## Testing

The project includes tests for critical functionality:

1. **Form Validation** (`riderForm.test.ts`)
   - Valid/invalid input scenarios
   - ETA boundary conditions

2. **Geographic Math** (`driverSimulator.test.ts`)
   - Distance calculations
   - Bearing calculations
   - Point movement
   - Movement accuracy

3. **Repository CRUD** (`stationsRepo.test.ts`)
   - Create, read, update, delete operations
   - Data persistence and retrieval

## Routes

- `/` - Home page with role selection
- `/rider` - Rider dashboard for requesting rides
- `/driver` - Driver dashboard for route management
- `/stations` - Admin panel for station management

## Status Indicators

### Ride Request Status
- **PENDING** - Awaiting driver assignment (amber badge)
- **ASSIGNED** - Matched with a driver (green badge)
- **COMPLETED** - Ride completed (gray badge)

### Connection Status
- Always shows "Offline (Mock)" in the top nav to indicate no real networking

## Development Notes

- No external API calls - all data is mock/in-memory
- Data resets on page reload
- Rider ID and Driver ID are persisted in localStorage
- Auto-refresh intervals on rider requests (3s)
- Geofence radius: 400 meters
- Simulator speed: 5 m/s (~18 km/h)

## Future Enhancements

- Real backend integration with Supabase/Firebase
- WebSocket for real-time updates
- Push notifications for geofence entry
- Route optimization algorithms
- Payment integration
- Rating system
- Historical ride data and analytics

## License

MIT

## Credits

Built with React, TypeScript, Tailwind CSS, and Leaflet.
