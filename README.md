# Errolian Club Platform

A comprehensive React-based club management application with calendar management, split-pay expenses, document library, and member authentication.

## Tech Stack
- **Frontend**: Vite + React 19 + TypeScript + Tailwind CSS
- **UI Components**: Shadcn/ui
- **Backend**: Supabase
- **State Management**: Zustand
- **Routing**: React Router
- **Validation**: Zod schemas

## Features
- 📅 **Calendar**: Event management with itinerary builder
- 💰 **Split-Pay**: Expense tracking and settlement system
- 📚 **Documents**: File library with version control
- 👤 **Account**: User profiles and authentication
- 🏠 **Dashboard**: Activity feeds and notifications

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup
```bash
npm install
npm run dev
```

### Key Commands
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript check

## MCP Server Integration

This project leverages **Model Context Protocol (MCP)** servers for enhanced development capabilities. The following MCP servers are configured globally in `~/.claude/mcp_servers.json` and available to all Claude Code projects:

### Available MCP Servers
1. **Supabase MCP** (`@supabase/mcp-server-supabase`)
   - Direct database operations and queries
   - Schema management and data manipulation
   - Real-time data access for development

2. **GitHub MCP** (`@modelcontextprotocol/server-github`)
   - Repository management and operations
   - Issue and PR management
   - Branch and commit operations

3. **Context7 MCP** (SSE transport)
   - Advanced context and code analysis
   - Project-wide code understanding
   - Development workflow optimization

### MCP Configuration
The MCP servers are configured globally at `~/.claude/mcp_servers.json` with project-specific credentials, making them available across all development projects while maintaining security.

To verify MCP server status:
```bash
claude mcp list
```

## Project Structure
```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── calendar/       # Calendar-related components
│   ├── documents/      # Document library components
│   ├── layout/         # Layout and navigation
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
- ✅ All frontend features implemented
- ✅ Supabase integration functional
- ✅ Authentication system complete
- ⚠️ One known issue: Event creation column mapping bug

## Contributing
This is a private club management platform. Development workflow utilizes MCP servers for enhanced productivity and database management.