# Errolian Club - Project Configuration

## Project Overview
React-based club management application with calendar management, split-pay expenses, document library, and member authentication.

## Project Setup Instructions
When starting work on this project:

1. **Read the latest progress file** from `Progress So Far/` directory to understand current state
2. **Check the TASKS.md file** in `Reading Files/` for current priorities
3. **Review the project structure** to understand the codebase organization

## Tech Stack
- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Supabase
- **State Management**: Zustand
- **Routing**: React Router
- **Validation**: Zod schemas

## Key Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript check

## Project Structure
```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── calendar/       # Calendar-related components
│   ├── documents/      # Document library components
│   ├── layout/         # Layout and navigation
│   ├── maps/           # Location and mapping
│   ├── splitpay/       # Split-pay system
│   └── ui/             # Shadcn/ui components
├── contexts/           # React contexts
├── hooks/              # Custom React hooks
├── lib/                # Utilities and API
├── pages/              # Main page components
├── schemas/            # Zod validation schemas
├── store/              # Zustand stores
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## Current Status
- All frontend features implemented
- Supabase integration in progress
- Authentication system functional
- Calendar, Split-Pay, Documents, and Account features complete

## Important Notes
- Always preserve existing functionality when making changes
- Follow React best practices and hook rules
- Use TypeScript strictly with proper type definitions
- Maintain mobile-first responsive design
- Use Tailwind CSS for styling consistency