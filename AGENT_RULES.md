# AGENT RULES - Errolian Club Project

## 🎯 ESSENTIAL STARTUP ROUTINE
**EVERY TIME YOU START WORKING ON THIS PROJECT:**

1. **READ THIS FILE FIRST** - Contains all essential project context and rules
2. **CHECK CHANGE LOG** - Review `Change Log/[today's date].md` for recent changes
3. **REVIEW CURRENT TASKS** - Check `Reading Files/TASKS.md` for current priorities
4. **UPDATE CHANGE LOG** - Every code change MUST be logged with timestamp and brief description

## 📋 PROJECT OVERVIEW

**Errolian Club** is a comprehensive React-based club management application for adventure/social clubs. The platform provides:

- **📅 Calendar Management**: Event creation, itinerary building, participant management
- **💰 Split-Pay System**: Expense tracking, settlement calculations, receipt management
- **📚 Document Library**: File storage with approval workflows and version control
- **👤 Member Authentication**: Role-based access (Super-Admin → Commodore → Officer → Member)
- **🏠 Dashboard**: Activity feeds, notifications, and member widgets

## 🏗️ TECHNOLOGY STACK

### Frontend
- **Framework**: Vite + React 19 + TypeScript
- **Styling**: Tailwind CSS (mobile-first design)
- **UI Components**: Shadcn/ui library
- **State Management**: Zustand stores
- **Routing**: React Router with protected routes
- **Validation**: Zod schemas for form validation

### Backend & Integration
- **Database**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (email/password + Google OAuth)
- **File Storage**: Supabase Storage with bucket policies
- **Real-time**: Supabase real-time subscriptions

## 🛠️ MCP SERVER CAPABILITIES

This project has access to powerful MCP (Model Context Protocol) servers configured globally:

### 1. Supabase MCP (`@supabase/mcp-server-supabase`)
**Use for:**
- Direct database queries and schema management
- Creating tables, policies, and functions
- Testing database operations
- Real-time data access and debugging
- Migration script development

### 2. GitHub MCP (`@modelcontextprotocol/server-github`)
**Use for:**
- Repository operations (branches, commits, PRs)
- Issue tracking and management
- Code collaboration workflows
- Release management

### 3. Puppeteer MCP
**Use for:**
- UI testing and screenshots
- Automated browser testing
- Visual regression testing
- User flow validation

## 📁 PROJECT STRUCTURE & NAVIGATION

```
errolian-club/
├── AGENT_RULES.md          # THIS FILE - Read first!
├── CLAUDE.md               # Claude Code project configuration
├── Change Log/             # Daily development logs (MUST UPDATE)
│   └── 2025-06-18.md      # Today's changes
├── Reading Files/          # Reference documentation
│   ├── TASKS.md           # Current task priorities
│   └── SUPABASE_BACKEND_SETUP.md  # Backend setup guide
├── src/                   # Main application code
│   ├── components/        # React components by feature
│   ├── pages/            # Main application pages
│   ├── lib/              # API and utilities
│   ├── types/            # TypeScript definitions
│   └── store/            # Zustand state management
└── database/             # Schema and migration files
```

## 📖 KEY REFERENCE FILES

### For Current Work
- **`Reading Files/TASKS.md`** - Current development priorities and completion status
- **`Change Log/[today].md`** - Recent changes and implementation details

### For Backend Setup
- **`Reading Files/SUPABASE_BACKEND_SETUP.md`** - Complete backend configuration guide
- **`database/schema.sql`** - Database schema with all tables
- **`database/policies.sql`** - Row Level Security policies

### For Development
- **`src/types/supabase.ts`** - TypeScript type definitions for database
- **`src/lib/database.ts`** - Database service layer and CRUD operations

## ⚡ DEVELOPMENT COMMANDS

```bash
# Development
npm run dev          # Start development server (port 5173)
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality (ALWAYS RUN BEFORE COMMITTING)
npm run lint         # ESLint code checking
npm run typecheck    # TypeScript validation

# Database Testing
npm run test:database  # Test Supabase connection and operations
```

## 🔄 CHANGE LOG REQUIREMENTS

**CRITICAL**: Every code implementation must be logged in `Change Log/[YYYY-MM-DD].md`

### Format:
```
## [HH:MM] - Brief Description (10-15 words)
- Specific changes made
- Files affected
- Any issues encountered

Example:
## 14:30 - Fixed calendar event creation column mapping bug
- Updated EventCreateModal.tsx to use end_date instead of endDate
- Modified database service in lib/database.ts
- Resolved TypeScript build errors
```

## 🔐 CURRENT PROJECT STATUS

### ✅ COMPLETED FEATURES
- Complete frontend implementation for all major features
- Supabase backend integration with authentication
- Database schema with RLS policies
- Role-based permission system
- File upload and storage system

### ⚠️ KNOWN ISSUES
- Event creation has column mapping issue (endDate vs end_date)
- Some TypeScript build warnings in components

### 🎯 CURRENT PRIORITIES
1. Resolve remaining TypeScript build errors
2. Test and validate all Supabase integrations
3. Implement remaining real-time features
4. Optimize performance and loading states

## 🚨 CRITICAL DEVELOPMENT RULES

### Code Standards
1. **NEVER add comments** unless explicitly requested
2. **Follow existing patterns** - Check similar components before implementing
3. **Mobile-first design** - Use Tailwind responsive classes
4. **TypeScript strict mode** - Proper type definitions required
5. **Component consistency** - Use Shadcn/ui components and established patterns

### File Management
1. **PREFER editing existing files** over creating new ones
2. **NEVER create documentation files** unless explicitly requested
3. **Maintain existing functionality** when making changes
4. **Check imports and dependencies** before adding new libraries

### Database Operations
1. **Use MCP Supabase server** for direct database operations
2. **Test queries** before implementing in application code
3. **Follow RLS policies** - respect security constraints
4. **Update TypeScript types** after schema changes

### Security
1. **Never commit secrets** or API keys
2. **Respect RLS policies** in all database operations
3. **Validate user permissions** before sensitive operations
4. **Use proper authentication checks** in protected routes

## 🎯 WORKFLOW OPTIMIZATION

### When Starting New Features:
1. Check `TASKS.md` for priority and requirements
2. Review similar existing components for patterns
3. Check if required libraries are already installed
4. Plan database changes if needed

### When Fixing Bugs:
1. Reproduce the issue first
2. Check recent Change Log entries for context
3. Use MCP tools for debugging database issues
4. Update Change Log with fix details

### When Making Database Changes:
1. Use Supabase MCP server to test queries
2. Update schema files if needed
3. Regenerate TypeScript types
4. Test with frontend integration

## 🤝 COLLABORATION NOTES

This is a private club management platform with:
- Role-based access control (4 levels: Super-Admin, Commodore, Officer, Member)
- Event management for adventure/social activities
- Financial tracking for group expenses
- Document management for club resources

The application is designed for mobile-first usage with PWA capabilities for easy installation on member devices.

---

**Remember**: This file contains the authoritative project context. When in doubt, refer back to these rules and the referenced documentation files.