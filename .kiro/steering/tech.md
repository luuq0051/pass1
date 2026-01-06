# Tech Stack & Build System

## Core Technologies

- **React 18.3.1**: Frontend framework với hooks và functional components
- **TypeScript 5.5.3**: Static typing cho JavaScript
- **Vite 5.4.1**: Build tool và dev server hiện đại
- **Tailwind CSS 3.4.11**: Utility-first CSS framework
- **shadcn/ui**: Component library dựa trên Radix UI

## Key Libraries

### UI & Styling
- **@radix-ui/***: Headless UI components (accordion, dialog, dropdown, etc.)
- **lucide-react**: Icon library
- **tailwindcss-animate**: Animation utilities
- **class-variance-authority**: Component variant management
- **clsx + tailwind-merge**: Conditional className utilities

### State Management & Data
- **@tanstack/react-query**: Server state management và caching
- **react-hook-form**: Form handling với validation
- **@hookform/resolvers + zod**: Form validation schema
- **IndexedDB**: Browser-native database cho local storage

### Backend & Database
- **Node.js + Express**: Backend API server
- **NeonDB (PostgreSQL)**: Cloud database cho production
- **pg**: PostgreSQL client cho Node.js
- **cors**: Cross-origin resource sharing

### Routing & Navigation
- **react-router-dom**: Client-side routing
- **BrowserRouter**: Hash-free routing

### Utilities
- **date-fns**: Date manipulation và formatting
- **sonner**: Toast notifications
- **cmdk**: Command palette component

## Build Commands

```bash
# Development
npm run dev          # Khởi chạy dev server tại localhost:8080
npm run server       # Khởi chạy backend server
npm run dev:full     # Khởi chạy cả frontend và backend
npm run dev:neon     # Khởi chạy với NeonDB integration

# Production
npm run build        # Build cho production
npm run build:dev    # Build cho development mode
npm run preview      # Preview production build

# Database
npm run migrate      # Chạy database migration
npm run migrate:neon # Migrate to NeonDB
npm run test:neon    # Test NeonDB connection

# Code Quality
npm run lint         # Chạy ESLint để kiểm tra code
npm run quality:check # Chạy lint + test + build
npm run quality:fix  # Auto-fix ESLint issues

# Testing
npm run test         # Chạy tests với Vitest
npm run test:ui      # Chạy tests với UI
npm run test:run     # Chạy tests một lần
npm run test:coverage # Chạy tests với coverage report

# Validation
npm run validate:html # Validate HTML output
```

## Development Configuration

### Vite Config
- **Port**: 8080 (default)
- **Host**: "::" (bind to all interfaces)
- **Plugins**: React SWC, Lovable Tagger (dev only)
- **Path Alias**: `@/` → `./src/`
- **Force cache clear**: Enabled để tránh HTML parsing issues

### TypeScript Config
- **Strict Mode**: Một số tùy chọn được tắt để linh hoạt hơn
  - `noImplicitAny: false`
  - `strictNullChecks: false`
  - `noUnusedParameters: false`
- **Path Mapping**: `@/*` → `./src/*`
- **Target**: Modern ES modules

### ESLint Config
- **Parser**: TypeScript ESLint
- **Plugins**: React hooks, React refresh
- **Rules**: Standard React/TypeScript rules
- **Unused vars**: Disabled cho development flexibility

## Database Architecture

### Local Storage (Development)
- **IndexedDB**: Browser-native database
- **Database Name**: `memorySafeGuardDB`
- **Object Store**: `passwords`
- **Indexes**: service, username, updatedAt

### Production Database
- **NeonDB**: PostgreSQL cloud database
- **Connection**: Via DATABASE_URL environment variable
- **Migration Scripts**: Available trong `/scripts` folder

## Environment Variables

```bash
# Database
DATABASE_URL=                    # NeonDB connection string
VITE_USE_NEONDB=false          # Enable NeonDB integration

# API Configuration  
VITE_ENABLE_API_SYNC=false     # Enable API synchronization
VITE_API_TIMEOUT=10000         # API timeout in milliseconds

# Security
VITE_ENCRYPTION_KEY=           # Encryption key cho sensitive data
```