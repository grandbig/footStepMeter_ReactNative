# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Language
**IMPORTANT**: All terminal responses and task explanations should be in **Japanese** for this Japanese project. Use natural, professional Japanese when communicating with the user. Only code comments and documentation may remain in English for international compatibility.

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
- `npm test` - Run unit tests
- `npm run test:coverage` - Run unit tests with coverage report
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

This project follows Test-Driven Development (TDD) principles with Red-Green-Refactor cycles. Focus on **Unit Tests** for business logic and pure functions. This implementation faithfully recreates the original Swift iOS app functionality without additional features.

### Phase 1: Pure Functions (Strict TDD)
```
🔴 utils/formatters.ts Unit Tests
  - Date/time display formatting
  - GPS coordinate display formatting
  - Accuracy/speed unit formatting
🟢 Implement formatting functions
🔄 Enhance internationalization support

🔴 utils/coordinates.ts Unit Tests
  - GPS coordinate validation
  - Coordinate range checks (-90≤lat≤90, -180≤lng≤180)
🟢 Implement coordinate validation logic
🔄 Optimize validation performance
```

### Phase 2: Type Definitions & Validation (TDD)
```
🔴 types/location.ts Validation Tests  
  - LocationPoint type validation (latitude, longitude, accuracy, speed, direction, timestamp)
  - GPS accuracy value range checks
🟢 Implement type definitions and validation functions
🔄 Optimize type design
```

### Phase 3: State Management (Unit TDD)
```
🔴 stores/footprintStore.ts Unit Tests
  - Start/stop location collection state changes
  - GPS footprint data addition to state
  - Location count tracking
  - Current location state management
🟢 Implement Zustand footprint collection store
🔄 Optimize state design

🔴 stores/routeStore.ts Unit Tests
  - Route addition (createFootprint equivalent)
  - Get all routes (fetchFootprints equivalent) 
  - Get routes by title (fetchFootprintsByTitle equivalent)
  - Delete routes by title (delete equivalent)
  - Get route count (countFootprints equivalent)
🟢 Implement route management store (original features only)
🔄 Optimize data structure for original functionality
```

### Phase 4: Service Layer (Interface + Mock)
```
🔴 services/locationService.ts Unit Tests
  - GPS accuracy settings (6 levels: bestForNavigation, best, nearestTenMeters, hundredMeters, kilometer, threeKilometers)
  - Background location tracking configuration
  - Location data transformation and validation
  - Error handling (mock expo-location APIs)
🟢 Implement location service (original features only)
🔄 Improve accuracy and performance

🔴 services/storageService.ts Unit Tests
  - Footprint data CRUD operations (createFootprint, fetchFootprints, fetchFootprintsByTitle, delete, countFootprints)
  - SQLite database operations (equivalent to original Realm functionality)
  - Data aggregation and title-based organization
🟢 Implement storage service (original features only)
🔄 Optimize data operations

🔴 services/exportService.ts Unit Tests
  - CSV data generation from footprint array (makeCSVData equivalent)
  - Email composition with CSV attachment (sendMailWithCSV equivalent)
  - File encoding and MIME type handling
  - Error handling for mail service unavailability
🟢 Implement data export service (original features only)
🔄 Optimize CSV generation and file handling
```

### Phase 5: Custom Hooks (Unit TDD)
```
🔴 hooks/useLocationCollection.ts Unit Tests
  - Hook location collection state management
  - GPS authorization handling
  - Location accuracy control
🟢 Implement location collection hook
🔄 Improve hook design

🔴 hooks/useFootprintManagement.ts Unit Tests
  - Footprint data operations
  - Route management logic
  - Data transformation hooks
🟢 Implement footprint management hook
🔄 Enhance reusability
```

### Phase 6: UI Components (Unit TDD)
```
🔴 components/location/* Unit Tests
  - Location display components
  - GPS status indicators
  - Accuracy level selectors
🟢 Implement GPS location UI
🔄 Improve component design

🔴 components/footprint/* Unit Tests
  - Footprint list display
  - Route history components
  - Export functionality UI
🟢 Implement footprint display UI
🔄 Enhance reusability
```

### Phase 7: Expo API Integration & Real Device Testing (Post-TDD)
```
📦 Install Required Expo Modules
  - expo-location - GPS and location services
  - expo-sqlite - Local database operations  
  - expo-file-system - File operations for data export
  - expo-mail-composer - Email sharing functionality
  - expo-task-manager - Background location tracking
  - i18n-js + expo-localization - Multi-language support

🔧 Replace Mock Dependencies with Real APIs
  - Update locationService.ts to use actual expo-location
  - Update storageService.ts to use actual expo-sqlite
  - Update exportService.ts to use actual expo-file-system + expo-mail-composer
  - Verify all existing unit tests still pass with real implementations

📱 Device Integration Testing
  - Test GPS accuracy on real devices (iOS/Android)
  - Verify background location tracking functionality
  - Test SQLite database performance with large datasets
  - Verify email export functionality across platforms
  - Test app behavior with location services disabled/denied

🚀 Performance Optimization
  - Profile SQLite query performance with real data
  - Optimize location tracking for battery usage
  - Verify memory usage with large route datasets
  - Test app startup time with database operations
```

### TDD Implementation Principles
1. **Pure functions first** - Apply strict TDD to pure functions
2. **Mock external dependencies** - Enable Unit Testing with mocks
3. **Focus on business logic** - Write tests for core functionality
4. **One feature, one test** - Maintain Red-Green-Refactor granularity
5. **Continuous refactoring** - Improve design during refactor phase

### Unit Testing Guidelines

#### Test Scope and Focus
1. **Test Your Own Logic Only**:
   - Focus on testing business logic and custom functions you implement
   - Do not test OSS modules (Jest, Expo APIs, React Native components)
   - Mock external dependencies rather than testing their internal behavior
   - Example: Test `calculateDistance()` logic, but not `Math.sin()` function

2. **Coverage-Driven Testing**:
   - Aim for high code coverage while maintaining test quality
   - Use `npm run test:coverage` to monitor coverage metrics
   - Target coverage guidelines: Statements (80%+), Branches (80%+), Functions (80%+)
   - 100% coverage is ideal but not mandatory - prioritize meaningful tests

3. **Avoid Redundant Tests**:
   - Don't write tests that don't improve coverage metrics
   - Remove duplicate test scenarios that test the same code paths
   - Focus on unique branches, edge cases, and error conditions
   - Example: If boundary value tests cover normal cases, skip redundant normal value tests

4. **Do Not Test Constants**:
   - Constants (simple value assignments) do not require unit tests
   - Testing constants adds no value and clutters the test suite
   - Instead, test functions that use the constants to verify correct behavior
   - Keep constants private (no `export`) if only used within the module
   - Example: Don't test `const MAX_VALUE = 100`, but test `isValid(100)` returns `true`

#### Test Quality Standards
- **Precise Assertions**: Use `toBe()` for fixed inputs rather than `toBeCloseTo()`
- **Complete Truth Tables**: Test all logical combinations (AND/OR operations)
- **Error Path Coverage**: Test all validation and error handling branches
- **Clear Test Names**: Describe what specific behavior is being verified

#### Coverage Analysis
```bash
# Generate detailed coverage report
npm run test:coverage

# View HTML report (detailed line-by-line coverage)
open coverage/index.html
```

### Non-TDD Areas (Manual Verification)
- **Screen navigation** - Expo Router functionality verification
- **Device-specific features** - Platform-specific behavior testing
- **Performance testing** - Real device performance confirmation

## Configuration
- **ESLint** - Uses expo/flat config with strict TypeScript
- **Metro** - Web bundler with static output
- **Expo** - Configured for universal app (iOS/Android/Web) with edge-to-edge on Android
- **Fonts** - SpaceMono loaded asynchronously in development