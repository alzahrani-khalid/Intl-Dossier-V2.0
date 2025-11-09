# GASTAT International Dossier System

## Overview

The GASTAT International Dossier System is a comprehensive platform for managing international relationships, agreements, and diplomatic activities for the General Authority for Statistics of Saudi Arabia.

## Features

### Core Functionality
- **Country Dossiers**: Complete profiles for all nations with diplomatic, economic, and strategic information
- **MoU Management**: Track Memorandums of Understanding with lifecycle management and alerts
- **Event Management**: Coordinate international forums, conferences, and bilateral meetings
- **Contact Database**: Maintain relationships with key international contacts
- **Document Repository**: Secure storage for agreements, reports, and correspondence
- **AI-Powered Briefs**: Generate executive summaries and talking points using AnythingLLM
- **Real-time Collaboration**: Live editing, presence awareness, and activity feeds

### Key Capabilities
- Bilingual support (Arabic/English) with RTL layout
- Voice command interface using Whisper AI
- Advanced search with faceted filtering
- Relationship health monitoring
- Performance analytics and ROI tracking
- Mobile-responsive design
- Offline support with data synchronization

## Technology Stack

- **Frontend**: React 19, TypeScript, TanStack Router/Query, Tailwind CSS
- **Backend**: Node.js 20 LTS, Express, TypeScript
- **Database**: Supabase (PostgreSQL) with RLS
- **Real-time**: Supabase Realtime, WebRTC (Yjs)
- **AI Integration**: AnythingLLM, OpenAI Whisper
- **Testing**: Vitest, Playwright, k6
- **Deployment**: Docker, GitHub Actions

## Getting Started

### Prerequisites
- Node.js 20 LTS or higher
- Docker and Docker Compose
- Supabase account
- AnythingLLM instance (self-hosted)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/gastat/intl-dossier.git
cd intl-dossier
```

2. Install dependencies:
```bash
pnpm install
```

3. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start Supabase locally:
```bash
pnpm exec supabase start
```

5. Run migrations:
```bash
pnpm run db:migrate
```

6. Seed demo data:
```bash
pnpm run db:seed
```

7. Start development servers:
```bash
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Supabase Studio: http://localhost:54323

## Project Structure

```
├── backend/              # Backend API server
│   ├── src/
│   │   ├── api/         # API endpoints
│   │   ├── models/      # Data models
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   └── config/      # Configuration
│   └── tests/          # Backend tests
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── hooks/      # Custom React hooks
│   │   ├── lib/        # Utilities and helpers
│   │   └── store/      # State management
│   └── tests/          # Frontend tests
├── e2e/                # End-to-end tests
├── docs/               # Documentation
├── supabase/           # Supabase configuration
│   ├── migrations/     # Database migrations
│   └── seed.sql       # Seed data
└── scripts/           # Build and deployment scripts
```

## Testing

### Unit Tests
```bash
pnpm run test:unit
```

### Integration Tests
```bash
pnpm run test:integration
```

### E2E Tests
```bash
pnpm run test:e2e
```

### Performance Tests
```bash
pnpm run test:performance
```

### Accessibility Tests
```bash
pnpm run test:a11y
```

### All Tests
```bash
pnpm test
```

## Deployment

### Development
```bash
pnpm run deploy:dev
```

### Staging
```bash
pnpm run deploy:staging
```

### Production
```bash
pnpm run deploy:production
```

## API Documentation

API documentation is available at http://localhost:3000/api-docs when running the development server.

## Security

- Row-level security (RLS) enabled on all tables
- Multi-factor authentication support
- End-to-end encryption for sensitive data
- Regular security audits and penetration testing
- OWASP compliance

## Performance

- Average response time: < 200ms
- 95th percentile: < 500ms
- Supports 100+ concurrent users
- Real-time updates with < 100ms latency

## Accessibility

- WCAG 2.1 Level AA compliant
- Full keyboard navigation
- Screen reader support
- RTL language support
- High contrast mode

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is proprietary software owned by the General Authority for Statistics of Saudi Arabia.

## Support

For support, please contact the IT department at support@stats.gov.sa

## Acknowledgments

- GASTAT leadership for their vision and support
- The development team for their dedication
- Our international partners for their collaboration