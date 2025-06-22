# Currency Exchange Dashboard

## Overview
A dynamic currency exchange rate dashboard providing real-time, precise financial data with comprehensive global currency tracking and interactive user experience.

**Stack:**
- TypeScript + React frontend 
- Express.js backend
- PostgreSQL database (Neon)
- Web scraping for live currency rates
- Responsive design with Tailwind CSS + shadcn/ui

## Current Status
**Issue:** Database authentication failure preventing app startup
- Error: `password authentication failed for user 'neondb_owner'`
- Need to recreate PostgreSQL database connection

## Recent Changes
- **2024-06-22:** Debugging database connection issues

## Project Architecture
- **Frontend:** React with Wouter routing, TanStack Query for state management
- **Backend:** Express.js with Drizzle ORM
- **Database:** PostgreSQL with currency and history tables
- **Data Source:** Web scraping from external currency exchange site

## User Preferences
- Language: Portuguese (BR)
- Non-technical user