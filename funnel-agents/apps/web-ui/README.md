# FunnelAgents Web UI

A modern, React-based marketing automation platform powered by AI agents. FunnelAgents provides a comprehensive suite of tools for managing campaigns, leads, workflows, and AI-powered marketing agents through an intuitive web interface.

## Features

- **AI Marketing Agents** - Create and manage intelligent agents for automated marketing tasks
- **Campaign Management** - Design, launch, and track marketing campaigns
- **CRM & Lead Management** - Centralized contact and deal pipeline management
- **Workflow Automation** - Visual workflow builder with drag-and-drop functionality
- **Interactive Whiteboard** - Collaborative canvas powered by tldraw for planning and brainstorming
- **Reports & Analytics** - Real-time insights and performance dashboards
- **Team Settings** - User management and team collaboration tools

## Tech Stack

- **React 18+** with **Vite** - Fast, modern frontend tooling
- **TailwindCSS** - Utility-first CSS framework
- **Radix UI** - Accessible, headless UI components
- **React Query (@tanstack/react-query)** - Powerful data fetching and state management
- **React Router** - Client-side routing and navigation
- **tldraw** - Infinite canvas / whiteboard functionality
- **Sonner** - Toast notifications
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **Zustand** - Lightweight state management
- **Framer Motion** - Animation library
- **Recharts** - Data visualization and charting

## Prerequisites

- **Node.js** 18+ and npm
- Backend services running (NestJS microservices or Base44)

## Getting Started

### Installation

```bash
npm install
```

### Environment Configuration

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

Key environment variables:

```env
# Backend mode: 'nestjs' (microservices) or 'base44' (BaaS)
VITE_BACKEND_MODE=nestjs

# API Gateway URL (for NestJS backend)
VITE_API_URL=http://localhost:3000

# WebSocket URL
VITE_WS_URL=ws://localhost:3000

# Application settings
VITE_APP_NAME=FunnelAgents
VITE_APP_VERSION=1.0.0

# Error tracking (optional)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/your-project-id
VITE_ENABLE_ERROR_REPORTING=true
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

### Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

### Testing

Run tests:

```bash
npm run test              # Run tests in watch mode
npm run test:ui           # Run tests with UI
npm run test:run          # Run tests once
npm run test:coverage     # Generate coverage report
```

### Code Quality

```bash
npm run lint              # Lint code
npm run lint:fix          # Auto-fix linting issues
npm run typecheck         # Type checking with TypeScript
```

## Project Structure

```
src/
├── pages/              # Page components (routes)
│   ├── Agents.jsx
│   ├── Campaigns.jsx
│   ├── Leads.jsx
│   ├── Workflows.jsx
│   ├── Reports.jsx
│   └── Settings.jsx
├── components/         # Reusable UI components
│   ├── ui/            # Base UI components (Radix-based)
│   ├── forms/         # Form components
│   └── layout/        # Layout components
├── api/               # API client and service layer
│   ├── client.js      # API client configuration
│   └── services/      # Service modules
├── lib/               # Utilities and context providers
│   ├── api.js         # API utilities
│   └── utils.js       # Helper functions
├── hooks/             # Custom React hooks
│   ├── useAuth.js
│   ├── useApi.js
│   └── ...
├── store/             # Global state (Zustand)
├── utils/             # Utility functions
├── App.jsx            # Main app component
├── Layout.jsx         # App layout wrapper
└── main.jsx           # Application entry point
```

## Backend Integration

FunnelAgents Web UI supports two backend modes:

### NestJS Microservices (Default)

Connect to a local or deployed NestJS backend with the following microservices:

- **API Gateway** (`VITE_API_URL`) - Unified entry point
- **Auth Service** - Authentication and authorization
- **CRM Service** - Contacts, leads, and deals
- **Campaigns Service** - Campaign management
- **Agents Service** - AI agent orchestration
- **Automations Service** - Workflow automation
- **Reports Service** - Analytics and reporting

Set `VITE_BACKEND_MODE=nestjs` in your `.env` file.

### Base44 Backend (Legacy)

Alternatively, connect to Base44 BaaS platform:

```env
VITE_BACKEND_MODE=base44
VITE_BASE44_APP_ID=your-app-id
VITE_BASE44_BACKEND_URL=https://api.base44.com
```

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests in watch mode |
| `npm run test:ui` | Run tests with UI |
| `npm run test:run` | Run tests once |
| `npm run test:coverage` | Generate test coverage |
| `npm run lint` | Lint code |
| `npm run lint:fix` | Auto-fix linting issues |
| `npm run typecheck` | Run TypeScript type checking |

## Contributing

1. Follow the existing code style and conventions
2. Write tests for new features
3. Run `npm run lint:fix` and `npm run typecheck` before committing
4. Ensure all tests pass with `npm run test:run`

## License

Proprietary - All rights reserved

---

**Version:** 1.0.0
**Built with:** React + Vite + TailwindCSS
