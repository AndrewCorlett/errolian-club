# Errolian Club Development Task List

**Tech Stack**: Vite + React 19 + TypeScript + Tailwind CSS + Supabase + Shadcn/ui

## Project Setup & Configuration
- [x] ✅ Create project directory and initialize Vite + React + TypeScript
- [x] ✅ Install and configure Tailwind CSS for mobile-first styling
- [x] ✅ Set up Shadcn/ui component library and theme configuration
- [x] ✅ Configure PWA manifest.json and service worker for mobile installation
- [x] ✅ Install routing (React Router) and state management (Zustand)
- [x] ✅ Create basic project structure and folder organization

## Core Layout & Navigation
- [x] ✅ Build responsive bottom navigation layout (Home, Calendar, Split-Pay, Docs, Account)
- [x] ✅ Create role system types and mock data (Super-Admin, Commodore, Officers, Members)

## Home Dashboard
- [x] ✅ Build Home Dashboard with basic widget layout
- [ ] ⏳ Make dashboard widgets draggable
- [ ] ⏳ Create notifications feed widget for dashboard
- [ ] ⏳ Build upcoming events widget with countdown timer
- [x] ✅ Create Split-Pay balance widget with settle up CTA (basic version)

## Calendar Features
- [x] ✅ Build Calendar page with infinite month scroll (-12m to +24m)
- [x] ✅ Add Calendar day tap functionality and 24h timeline sheet
- [x] ✅ Implement Calendar long-press and + button for event creation
- [x] ✅ Create Calendar filter system (Events, Availability, Officer layers)
- [x] ✅ Build Event creation and editing modal with form validation
- [x] ✅ Create Event detail sheet with info and itinerary list

## Itinerary Builder
- [ ] ⏳ Build Itinerary Builder with dynamic forms for Travel/Stay/Activity/Other
- [ ] ⏳ Implement context-aware fields for different itinerary types
- [ ] ⏳ Connect itinerary costs to Split-Pay draft expenses

## Split-Pay System
- [ ] ⏳ Build Split-Pay page with sticky header showing owe/owed balance
- [ ] ⏳ Create expense list grouped by event with filters
- [ ] ⏳ Implement Add Expense form with participant selection
- [ ] ⏳ Build n-1 settlement algorithm for optimal money transfers

## Documents Library
- [ ] ⏳ Create Documents Library with folder structure and search
- [ ] ⏳ Build file upload system with 10MB limit and approval workflow
- [ ] ⏳ Create full-screen document viewer for PDF/images/Office docs
- [ ] ⏳ Implement document versioning system

## Account & Settings
- [ ] ⏳ Build Account page with profile, role display, and settings
- [ ] ⏳ Add theme switching (Light/Dark/System)

## Backend & Database
- [ ] ⏳ Set up Supabase project and configure database schema
- [ ] ⏳ Connect frontend to Supabase for data persistence
- [ ] ⏳ Implement offline functionality and data synchronization
- [ ] ⏳ Add authentication system (magic links + Google SSO)

## Performance & PWA
- [ ] ⏳ Test and optimize PWA performance (target Lighthouse 90+)

---

## Current Status
**Completed**: Basic React app structure, routing, placeholder pages, basic Home dashboard
**Next Priority**: Install and configure Tailwind CSS, then set up Shadcn/ui components

## Notes
- Currently using custom CSS instead of Tailwind - need to migrate
- Pages are placeholder implementations with basic layouts
- Zustand is installed but not yet used for state management
- No backend integration yet - all data is static/mock