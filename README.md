# International Dossier Management System v2.0

A comprehensive system for managing international dossiers, policy briefs, and diplomatic relationships with offline-first mobile capabilities.

## Overview

The International Dossier System is a full-stack application that enables organizations to:
- Manage international dossiers and policy briefs
- Track relationships between countries, organizations, and positions
- Process intake requests and assignments
- Search across all entities with full-text search
- Collaborate in real-time with notifications
- Access data offline on mobile devices

## Architecture

### Web Application
- **Frontend**: React 19 + TypeScript 5.8+ + Vite
- **UI**: shadcn/ui + Tailwind CSS (Mobile-first, RTL-ready)
- **Backend**: Node.js 18+ LTS + Express
- **Database**: Supabase (PostgreSQL 15+)
- **Real-time**: Supabase Realtime
- **State Management**: TanStack Query v5

### Mobile Application
- **Framework**: React Native 0.81+ + Expo SDK 52+
- **UI**: React Native Paper 5.12+ (Material Design 3)
- **Database**: WatermelonDB 0.28+ (offline-first)
- **Navigation**: React Navigation 7+
- **Internationalization**: i18next (English + Arabic RTL)

See [mobile/README.md](./mobile/README.md) for detailed mobile setup instructions.

## Quick Start

### Prerequisites

- **Node.js**: 18+ LTS
- **pnpm**: 10.x+ (Package manager)
- **Git**: Latest version
- **Supabase Account**: For backend services

### Web Application Setup

```bash
# Clone repository
git clone <repository-url>
cd Intl-DossierV2.0

# Install pnpm globally (if not installed)
npm install -g pnpm

# Install dependencies (monorepo)
pnpm install

# Configure environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit .env files with your Supabase credentials

# Run database migrations
pnpm db:migrate

# Start development servers
pnpm dev
```

The web app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Mobile Application Setup

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
pnpm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start Expo development server
pnpm start

# Run on iOS (macOS only)
pnpm ios

# Run on Android
pnpm android
```

See [mobile/README.md](./mobile/README.md) for comprehensive mobile setup guide.

## Project Structure

```
Intl-DossierV2.0/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── api/          # API routes
│   │   ├── config/       # Configuration
│   │   ├── middleware/   # Express middleware
│   │   ├── services/     # Business logic
│   │   └── utils/        # Utilities
│   └── package.json
│
├── frontend/             # React web application
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API clients
│   │   ├── i18n/         # Translations (en, ar)
│   │   └── lib/          # Utilities
│   └── package.json
│
├── mobile/               # React Native mobile app
│   ├── src/
│   │   ├── components/   # Mobile UI components
│   │   ├── screens/      # Screen components
│   │   ├── database/     # WatermelonDB models
│   │   ├── services/     # Mobile services
│   │   └── navigation/   # Navigation config
│   ├── README.md         # Mobile-specific docs
│   └── package.json
│
├── supabase/             # Database & edge functions
│   ├── migrations/       # SQL migrations
│   └── functions/        # Edge functions
│
├── tests/                # E2E and integration tests
└── package.json          # Monorepo config
```

## Key Features

### Web Application

- **Dossier Management**: Create, edit, and track international dossiers
- **Relationship Mapping**: Visualize connections between entities
- **Advanced Search**: Full-text search across all data
- **Real-time Collaboration**: Live updates and notifications
- **Kanban Boards**: Visual workflow management
- **Document Management**: Upload and manage documents
- **Waiting Queue Actions**: Comprehensive action management for pending assignments
  - **Assignment Details View**: Quick access to full assignment information with aging indicators
  - **Follow-Up Reminders**: Send individual or bulk reminders with 24-hour cooldown enforcement
  - **Assignment Escalation**: Escalate overdue items to management with organizational hierarchy support
  - **Advanced Filtering**: Filter by priority, aging, type, and assignee with sub-second performance
  - **Bulk Operations**: Process up to 100 assignments at once with progress tracking
  - **Bilingual Notifications**: English and Arabic notification templates with RTL support
- **RTL Support**: Full Arabic language support
- **Responsive Design**: Mobile-first, works on all devices
- **Accessibility**: WCAG AA compliant

### Mobile Application

- **Offline-First**: View and edit data without internet
- **Biometric Auth**: Face ID, Touch ID, fingerprint
- **Push Notifications**: Real-time assignment alerts
- **Auto-Sync**: Background synchronization when online
- **Storage Management**: Smart cache and cleanup
- **Performance Monitoring**: Track app performance
- **Privacy Controls**: Opt-out of analytics and tracking
- **Onboarding Tour**: Guided introduction for new users

## Technology Stack

### Frontend Technologies
- React 19 + TypeScript 5.8+
- Vite (build tool)
- TanStack Router + Query v5
- shadcn/ui + Tailwind CSS
- i18next (internationalization)
- React Flow (network graphs)
- Zod (validation)

### Mobile Technologies
- React Native 0.81+ + Expo SDK 52+
- TypeScript 5.8+ (strict mode)
- React Native Paper 5.12+ (Material Design 3)
- WatermelonDB 0.28+ (offline storage)
- React Navigation 7+
- expo-local-authentication (biometrics)
- expo-notifications (push)

### Backend Technologies
- Node.js 18+ LTS
- Express
- Supabase (PostgreSQL 15+)
- Redis 7.x (caching)
- Supabase Auth (authentication)
- Supabase Realtime (WebSockets)

### Database
- PostgreSQL 15+
- pgvector (vector search)
- pg_trgm (fuzzy search)
- pg_tsvector (full-text search)
- Row-Level Security (RLS)

### DevOps
- Docker (containerization)
- GitHub Actions (CI/CD)
- Jest (testing)
- Playwright (E2E testing)
- Maestro (mobile E2E)

## Development

### Running Tests

```bash
# Web unit tests
cd frontend && pnpm test

# Backend tests
cd backend && pnpm test

# Mobile tests
cd mobile && pnpm test

# E2E tests
pnpm test:e2e
```

### Code Quality

```bash
# Lint all packages
pnpm lint

# Type check
pnpm typecheck

# Format code
pnpm format
```

### Database

```bash
# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Reset database
pnpm db:reset

# Generate migration
pnpm db:migration:create
```

## Deployment

### Web Application

```bash
# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Mobile Application

```bash
# Development build
cd mobile && eas build --profile development --platform all

# Production build
cd mobile && eas build --profile production --platform all

# Submit to app stores
cd mobile && eas submit --platform ios
cd mobile && eas submit --platform android
```

See [mobile/README.md](./mobile/README.md) for detailed mobile deployment guide.

## Documentation

- [Mobile App README](./mobile/README.md) - Mobile development guide
- [Backend API](./backend/README.md) - API documentation
- [Frontend Guide](./frontend/README.md) - Web development guide
- [Supabase Schema](./supabase/README.md) - Database schema

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a pull request

### Coding Standards

- TypeScript strict mode enabled
- Follow ESLint rules
- Write tests for new features
- Mobile-first responsive design
- RTL support for Arabic
- Accessibility (WCAG AA)
- Document public APIs

## Testing Credentials

For development and testing:

```
Email: kazahrani@stats.gov.sa
Password: itisme
```

## Environment Configuration

### Backend (.env)

```env
# Supabase
SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# Redis
REDIS_URL=redis://localhost:6379

# Server
PORT=3000
NODE_ENV=development
```

### Frontend (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API
VITE_API_URL=http://localhost:3000
```

### Mobile (.env)

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=https://zkrcjzdemdmwhearhfgg.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Performance

### Web Application
- **Lighthouse Score**: 95+
- **First Contentful Paint**: <1.5s
- **Time to Interactive**: <3.5s
- **Bundle Size**: <500KB (gzipped)

### Mobile Application
- **Cold Start**: <3s
- **Screen Navigation**: <300ms
- **60fps Scrolling**: Maintained on all lists
- **Offline Sync**: <30s for 1000 records

## Security

- JWT-based authentication
- Row-Level Security (RLS) on all tables
- HTTPS/TLS for all connections
- Encrypted storage on mobile
- Biometric authentication support
- OWASP security best practices
- Regular dependency updates

## Accessibility

- WCAG AA compliant
- Screen reader support (VoiceOver, TalkBack)
- Keyboard navigation
- High contrast mode
- Text scaling up to 200%
- Focus indicators
- Alt text for images

## Internationalization

- English (en) - Default
- Arabic (ar) - Full RTL support
- Locale-aware date/time formatting
- Number formatting per locale
- Bidirectional text support

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

## Mobile Platform Support

- iOS 14+
- Android 10+ (API 29+)

## License

Copyright © 2025 General Authority for Statistics (GASTAT). All rights reserved.

## Support

For issues, questions, or contributions:
1. Check [mobile/README.md](./mobile/README.md) for mobile-specific docs
2. Search existing GitHub issues
3. Create a new issue with reproduction steps
4. Contact the development team

---

**Version**: 2.0.0
**Last Updated**: January 2025
