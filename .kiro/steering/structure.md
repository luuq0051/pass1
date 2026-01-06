# Project Structure & Organization

## Folder Structure

```
src/
├── assets/              # Static resources (images, fonts)
│   └── password-hero.png
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── input.tsx
│   │   ├── toast.tsx
│   │   └── ... (other UI primitives)
│   ├── ErrorBoundary.tsx   # Global error boundary component
│   ├── PasswordCard.tsx    # Password display component
│   ├── PasswordForm.tsx    # Add/edit password form
│   └── SearchBar.tsx       # Search functionality
├── hooks/               # Custom React hooks
│   ├── use-clipboard.ts    # Enhanced clipboard operations
│   ├── use-loading-state.ts # Reusable loading state management
│   ├── use-mobile.tsx      # Mobile detection hook
│   ├── use-passwords.ts    # Password management hook
│   ├── use-performance.ts  # Performance monitoring hook
│   └── use-toast-notifications.ts # Toast notification hook
├── lib/                 # Utilities and libraries
│   ├── config/             # Application configuration
│   │   ├── app-config.ts      # Main app configuration
│   │   ├── config-manager.ts  # Configuration management
│   │   ├── env-utils.ts       # Environment utilities
│   │   └── url-builder.ts     # URL construction utilities
│   ├── constants/          # Application constants
│   ├── db/                 # Database layer
│   │   ├── database-operations.ts # Specialized database operations
│   │   └── db.ts              # IndexedDB management (Singleton)
│   ├── services/           # Business logic services
│   │   ├── password-service.ts    # Password business logic
│   │   ├── neon-password-service.ts # NeonDB service implementation
│   │   └── service-factory.ts     # Service factory pattern
│   ├── types/              # TypeScript type definitions
│   │   ├── config-types.ts    # Configuration types
│   │   ├── models.ts          # Data model types
│   │   └── error-types.ts     # Error handling types
│   ├── utils/              # Utility functions
│   │   ├── logger.ts          # Comprehensive logging system
│   │   ├── performance-monitor.ts # Performance tracking
│   │   └── error-handler.ts   # Error handling utilities
│   ├── validation/         # Validation schemas
│   │   └── password-validation.ts # Password validation logic
│   └── utils.ts            # Common utility functions
├── pages/               # Page components
│   ├── Index.tsx           # Main application page
│   └── NotFound.tsx        # 404 error page
├── App.tsx              # Root application component
├── main.tsx             # Application entry point
├── index.css            # Global styles
└── vite-env.d.ts        # Vite type definitions

server/                  # Backend Node.js server
├── controllers/         # Request handlers
├── services/           # Business logic
├── repositories/       # Data access layer
├── middleware/         # Express middleware
├── utils/              # Server utilities
└── index.js            # Server entry point
```

## Architecture Patterns

### Component Organization
- **UI Components**: Base components trong `src/components/ui/`
- **Feature Components**: Components chức năng trong `src/components/`
- **Page Components**: Components trang trong `src/pages/`

### State Management
- **Local State**: useState cho component state
- **Global State**: Custom hooks (usePasswords) cho shared state
- **Server State**: React Query cho data fetching và caching

### Data Layer
- **Database**: IndexedDB thông qua DatabaseManager singleton
- **Service Layer**: Business logic separation với factory pattern
- **Types**: TypeScript interfaces cho type safety
- **Hooks**: Custom hooks để abstract business logic

### Configuration Management
- **Centralized Config**: Tất cả config trong `src/lib/config/`
- **Environment Utils**: Type-safe environment variable access
- **Factory Pattern**: Service creation với dependency injection

## Naming Conventions

### Files & Folders
- **Components**: PascalCase (PasswordCard.tsx)
- **Hooks**: camelCase với prefix "use-" (use-passwords.ts)
- **Utilities**: camelCase (utils.ts)
- **Pages**: PascalCase (Index.tsx)
- **Services**: camelCase với suffix "-service" (password-service.ts)

### Code Style
- **Components**: Functional components với TypeScript
- **Props**: Interface definitions với Props suffix
- **Exports**: Named exports cho utilities, default export cho components
- **Imports**: Absolute imports sử dụng `@/` alias

## File Responsibilities

### Components
- **ErrorBoundary.tsx**: Global error boundary với fallback UI và error reporting
- **PasswordCard.tsx**: Hiển thị thông tin mật khẩu, secure clipboard operations, edit/delete actions
- **PasswordForm.tsx**: Form thêm/chỉnh sửa mật khẩu với validation, password strength indicator
- **SearchBar.tsx**: Tìm kiếm mật khẩu theo service/username

### Hooks
- **use-clipboard.ts**: Enhanced clipboard operations với security features
- **use-loading-state.ts**: Reusable loading state management và error handling
- **use-passwords.ts**: CRUD operations cho passwords, error handling, toast notifications
- **use-performance.ts**: Performance monitoring và metrics tracking
- **use-mobile.tsx**: Mobile device detection

### Database & Services
- **db.ts**: DatabaseManager singleton class, IndexedDB operations
- **database-operations.ts**: Specialized operations (search, batch operations)
- **password-service.ts**: Business logic layer cho password operations
- **service-factory.ts**: Factory pattern cho service creation

### Configuration
- **app-config.ts**: Centralized application configuration
- **config-manager.ts**: Configuration management utilities
- **env-utils.ts**: Type-safe environment variable access

### Validation & Utils
- **password-validation.ts**: Zod schemas, password strength validation, secure password generation
- **logger.ts**: Comprehensive logging system với multiple levels và performance tracking
- **utils.ts**: Common utility functions

### Pages
- **Index.tsx**: Main page layout, password list, search integration
- **NotFound.tsx**: 404 error handling

## Import Patterns

```typescript
// External libraries
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

// Internal utilities
import { cn } from '@/lib/utils';

// Types
import { PasswordEntry } from '@/lib/types/models';

// Hooks
import { usePasswords } from '@/hooks/use-passwords';

// Services
import { ServiceFactory } from '@/lib/services/service-factory';
```

## Component Structure

```typescript
// Standard component structure
interface ComponentProps {
  // Props definition với proper typing
}

export const Component = ({ prop1, prop2 }: ComponentProps) => {
  // Hooks (theo thứ tự: state, effects, custom hooks)
  // State management
  // Event handlers
  // Computed values (useMemo, useCallback)
  
  return (
    // JSX với proper structure
  );
};
```

## Key Architectural Principles

1. **Separation of Concerns**: Business logic trong services, UI logic trong components
2. **Singleton Pattern**: Database manager để đảm bảo single connection
3. **Factory Pattern**: Service creation với proper dependency injection
4. **Error Boundaries**: Global error handling với graceful fallbacks
5. **Performance Monitoring**: Built-in performance tracking và logging
6. **Type Safety**: Comprehensive TypeScript typing throughout