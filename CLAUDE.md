# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a sales estimation support tool consisting of three main parts:
- **Frontend**: React + TypeScript + Vite application with Tailwind CSS and shadcn/ui components
- **Backend**: FastAPI Python application (legacy, not actively used in current deployment)
- **Database**: Supabase backend with PostgreSQL database and Edge Functions for email notifications

The application allows users to manage sales estimation requests with user authentication, CRUD operations, status tracking, and automated email notifications.

## Development Commands

### Frontend (sales_estimation_frontend/)
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
tsc -b

# Linting
npm run lint

# Preview production build
npm run preview
```

### Backend (sales_estimation_backend/)
The FastAPI backend is legacy and not actively used. Current deployment uses Supabase REST API directly from the frontend.

```bash
# Install dependencies (if needed)
poetry install
# or
pip install -r requirements.txt

# Run development server (if needed)
poetry run uvicorn app.main:app --reload
# or
uvicorn app.main:app --reload
```

### Supabase
```bash
# Deploy Edge Functions
supabase functions deploy send-email

# Run local development
supabase start
```

## Architecture

### Frontend Architecture
- **Main App**: Single-page React application (`src/App.tsx`) handling all functionality
- **UI Components**: Uses shadcn/ui component library with Radix UI primitives
- **State Management**: Local React state with hooks
- **Database Integration**: Direct Supabase client integration (`src/lib/supabase.ts`)
- **Styling**: Tailwind CSS with custom component styles

### Key Components
- Authentication system with session-based login
- CRUD operations for estimation requests
- User management system
- Email notification system via Supabase Edge Functions
- Search and filtering functionality
- Status tracking with visual badges

### Database Schema
The application uses Supabase PostgreSQL with these main tables:
- `estimation_requests`: Core data for sales estimation requests
- `users`: User management with username and email
- `app_settings`: Application configuration (admin password)

### Teams Notification System
- **Supabase Edge Function**: `supabase/functions/send-email/index.ts`
- **Notification Types**: Assignment notifications and completion notifications
- **Integration**: Microsoft Teams Incoming Webhook
- **Message Format**: Rich MessageCard format with action buttons
- **Fallback**: Console logging when Edge Function fails

## Project Structure

```
sales_estimation_frontend/
├── src/
│   ├── components/ui/          # shadcn/ui components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/
│   │   ├── supabase.ts        # Supabase client and types
│   │   └── utils.ts           # Utility functions
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Application entry point
├── package.json               # Dependencies and scripts
├── vite.config.ts             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
└── tsconfig*.json             # TypeScript configuration

sales_estimation_backend/       # Legacy FastAPI backend
├── app/
│   ├── main.py                # FastAPI application
│   ├── models.py              # Pydantic models
│   └── database.py            # Database connection
└── pyproject.toml             # Poetry configuration

supabase/
├── functions/
│   └── send-email/
│       └── index.ts           # Email notification Edge Function
└── config.toml                # Supabase configuration
```

## Key Features

- Password-protected access with admin authentication
- Full CRUD operations for estimation requests
- User management with email integration
- Status tracking with predefined options
- Real-time search and filtering
- Automated Teams notifications for assignments and completions
- Responsive design with Tailwind CSS
- Type-safe TypeScript implementation

## Environment Setup

Frontend requires:
- VITE_SUPABASE_URL environment variable for Supabase URL
- VITE_SUPABASE_ANON_KEY environment variable for Supabase integration

Edge Function requires:
- TEAMS_WEBHOOK_URL environment variable for Microsoft Teams Incoming Webhook URL

Default Supabase URL: `https://ltkgmmbapafctihusddh.supabase.co`