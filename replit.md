# Currency Exchange Dashboard

## Overview
A dynamic currency exchange rate dashboard providing real-time, precise financial data with comprehensive global currency tracking and interactive user experience.

**Stack:**
- TypeScript + React frontend 
- Express.js backend
- JSON file-based storage (local data independence)
- Web scraping for live currency rates
- Responsive design with Tailwind CSS + shadcn/ui

## Current Status
**✅ Resolved:** App is running successfully with local storage
- Migrated from PostgreSQL to JSON storage system
- Complete independence from external database servers
- Currency converter enforcing BRL requirement
- All features working properly
- Data persistence in ./data/ directory

## Recent Changes
- **2025-06-23:** Successfully migrated from PostgreSQL to JSON storage system
- **2025-06-23:** Implemented local file-based data persistence (./data/ directory)
- **2025-06-23:** Created automatic migration system for existing data
- **2025-06-23:** Eliminated dependency on external database servers
- **2024-06-22:** Fixed database authentication by recreating PostgreSQL connection
- **2024-06-22:** Updated currency converter logic to enforce BRL requirement

## Project Architecture
- **Frontend:** React with Wouter routing, TanStack Query for state management
- **Backend:** Express.js with custom JSON storage layer
- **Database:** Local JSON files (currencies.json, history.json, emails.json)
- **Data Source:** Web scraping from external currency exchange site
- **Storage:** Complete local data independence, no external servers required

## User Preferences
- Language: Portuguese (BR)
- Non-technical user
- Prefers local storage over external database dependencies
- Values system independence and portability