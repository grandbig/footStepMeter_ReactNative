# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React Native port of the original Swift iOS app [footStepMeter](https://github.com/grandbig/footStepMeter). The goal is to recreate the walking route tracking functionality using Expo Router and make it available cross-platform.

### Original App Features (to be implemented)
- **Route Tracking**: Records walking routes with GPS data (latitude, longitude, direction, speed, accuracy)
- **Customizable Accuracy**: User-selectable GPS accuracy levels (with battery consumption trade-offs)
- **Multi-Route Management**: Save and manage multiple walking routes
- **Route History**: View previously recorded routes with detailed information
- **Data Export**: Email sharing of route records
- **Route Deletion**: Remove unwanted routes from history
- **Multilingual Support**: English and Japanese localization (original app feature)

### Technical Architecture
The project uses a layered architecture with clean separation of concerns, designed specifically for GPS tracking and route management functionality. It follows Expo's file-based routing system with TypeScript throughout.

## Development Commands

- `npm start` or `npx expo start` - Start the development server
- `npm run android` - Start with Android emulator
- `npm run ios` - Start with iOS simulator  
- `npm run web` - Start web version
- `npm run lint` - Run ESLint checks
- `npm run reset-project` - Reset to blank project (moves current code to app-example/)

## Architecture

### Layered Architecture Design

```
┌─────────────────┐
│  Presentation   │ ← app/ + components/
├─────────────────┤
│  Application    │ ← hooks/ + stores/
├─────────────────┤
│  Domain         │ ← services/ + types/
├─────────────────┤
│  Infrastructure │ ← utils/ + constants/
└─────────────────┘
```

This layered architecture ensures:
- **Clean separation of concerns** between UI, business logic, and infrastructure
- **Single responsibility principle** for each directory and module
- **Dependency flow** from upper layers to lower layers only
- **Testability** with isolated business logic in services layer
- **Maintainability** through clear module boundaries

### Directory Structure

```
├── app/                    # 🎨 Presentation Layer - Expo Router screens
│   ├── (tabs)/            # Tab-based navigation screens
│   ├── route/             # Route detail screens
│   └── _layout.tsx
├── components/             # 🎨 Presentation Layer - Reusable UI
│   ├── tracking/          # GPS tracking related components
│   ├── route/             # Route management components
│   └── ui/                # Common UI components
├── hooks/                  # 🧠 Application Layer - Business logic abstraction
├── stores/                 # 🧠 Application Layer - State management
├── services/               # ⚙️ Domain Layer - Business logic
├── types/                  # ⚙️ Domain Layer - Type definitions
├── utils/                  # 🔧 Infrastructure Layer - Utilities
├── constants/              # 🔧 Infrastructure Layer - Configuration
└── assets/                 # Static resources
    ├── fonts/
    └── images/
```

### Development Principles

1. **Component Responsibility**: 
   - Components should only handle UI rendering and user interaction
   - No direct API calls or complex business logic in components
   - Use custom hooks to connect components to business logic

2. **Service Layer Pattern**:
   - All external API interactions (GPS, SQLite, file system) go through services
   - Services contain pure business logic and data transformation
   - Services are framework-agnostic and easily testable

3. **State Management Strategy**:
   - Use Zustand for complex state management (tracking, routes)
   - Separate stores by domain responsibility
   - Keep state minimal and derived data in selectors

4. **Hook Pattern**:
   - Custom hooks bridge components and services/stores
   - Encapsulate complex logic and state management
   - Promote reusability across components

### Key Technologies
- **Expo Router v5** - File-based routing with typed routes enabled
- **React Native 0.79.5** with React 19
- **React Navigation** - Bottom tabs and stack navigation
- **TypeScript** - Strict mode enabled with path mapping (`@/*` → `./`)
- **New Architecture** - React Native's new architecture is enabled

### Required Additional Modules

**Core GPS & Location:**
- **expo-location** - GPS position tracking and location services
- **expo-task-manager** - Background location tracking capability
- **expo-constants** - Device and app information access

**Data Management:**
- **zustand** - Lightweight state management for real-time tracking state
- **expo-sqlite** - Local database for persistent route data storage
- **expo-file-system** - File operations for route data export

**User Interface & Experience:**
- **expo-mail-composer** - Email sharing functionality for routes
- **i18n-js** + **expo-localization** - Multi-language support (Japanese/English)
- **date-fns** - Date/time formatting and calculations

**Optional:**
- **react-native-maps** - Map visualization for route display (if visual maps needed)

### Theme System
The app supports automatic light/dark mode switching using:
- `useColorScheme` hook for detecting system theme
- `Colors` constant for theme-specific color values
- `ThemeProvider` from React Navigation for consistent theming

### Component Patterns
- Components use TypeScript interfaces for props
- Platform-specific components use `.ios.tsx` and `.tsx` naming
- Themed components use `useThemeColor` hook
- Haptic feedback integrated in interactive elements

## TDD Implementation Plan

This project follows Test-Driven Development (TDD) principles with Red-Green-Refactor cycles. Focus on **Unit Tests** for business logic and pure functions.

### Phase 1: Pure Functions (Strict TDD)
```
🔴 utils/calculations.ts Unit Tests
  - Distance calculation between two GPS points (Haversine formula)
  - Speed calculation (distance/time → km/h)
  - Direction angle calculation
🟢 Implement calculation logic
🔄 Refactor for precision and error handling

🔴 utils/formatters.ts Unit Tests
  - Date/time display formatting
  - Distance/speed unit conversion formatting
🟢 Implement formatting functions
🔄 Enhance internationalization support
```

### Phase 2: Type Definitions & Validation (TDD)
```
🔴 types/location.ts Validation Tests
  - LocationPoint type validation
  - GPS accuracy value range checks
🟢 Implement type definitions and validation functions
🔄 Optimize type design
```

### Phase 3: State Management (Unit TDD)
```
🔴 stores/trackingStore.ts Unit Tests
  - Start/stop tracking state changes
  - Location data addition to state
  - Store calculation logic
🟢 Implement Zustand tracking store
🔄 Optimize state design

🔴 stores/routeStore.ts Unit Tests
  - Route data CRUD operations
  - Route search and filtering logic
🟢 Implement route management store
🔄 Improve data structure
```

### Phase 4: Service Layer (Interface + Mock)
```
🔴 services/locationService.ts Unit Tests
  - GPS settings change logic
  - Location data transformation
  - Error handling (mock Expo APIs)
🟢 Implement location service
🔄 Improve accuracy and performance

🔴 services/routeService.ts Unit Tests
  - Route data operation business logic
  - Data consistency checks
🟢 Implement route management service
🔄 Optimize data operations
```

### Phase 5: Custom Hooks (Unit TDD)
```
🔴 hooks/useLocationTracking.ts Unit Tests
  - Hook internal state management
  - Hook calculation processing
🟢 Implement location tracking hook
🔄 Improve hook design

🔴 hooks/useRouteManagement.ts Unit Tests
  - Route operation logic
  - Hook data transformation
🟢 Implement route management hook
🔄 Enhance reusability
```

### Phase 6: UI Components (Unit TDD)
```
🔴 components/tracking/* Unit Tests
  - Display logic based on props
  - Component calculation processing
  - Event handler testing
🟢 Implement GPS tracking UI
🔄 Improve component design

🔴 components/route/* Unit Tests
  - Data display logic
  - Component internal state management
🟢 Implement route display UI
🔄 Enhance reusability
```

### TDD Implementation Principles
1. **Pure functions first** - Apply strict TDD to pure functions
2. **Mock external dependencies** - Enable Unit Testing with mocks
3. **Focus on business logic** - Write tests for core functionality
4. **One feature, one test** - Maintain Red-Green-Refactor granularity
5. **Continuous refactoring** - Improve design during refactor phase

### Non-TDD Areas (Separate Implementation)
- **Expo API integration** - expo-location, expo-sqlite actual behavior
- **Screen navigation** - Expo Router functionality verification
- **Device-specific features** - GPS, background processing
- **Performance testing** - Real device behavior confirmation

## Configuration
- **ESLint** - Uses expo/flat config with strict TypeScript
- **Metro** - Web bundler with static output
- **Expo** - Configured for universal app (iOS/Android/Web) with edge-to-edge on Android
- **Fonts** - SpaceMono loaded asynchronously in development