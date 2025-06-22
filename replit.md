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
**✅ Resolved:** App is running successfully
- Database connection restored
- Currency converter enforcing BRL requirement
- All features working properly

## Recent Changes
- **2024-06-22:** Fixed database authentication by recreating PostgreSQL connection
- **2024-06-22:** Updated currency converter logic to enforce BRL requirement
- **2024-06-22:** Modified dropdown behavior to show all currencies but auto-correct invalid selections

## Project Architecture
- **Frontend:** React with Wouter routing, TanStack Query for state management
- **Backend:** Express.js with Drizzle ORM
- **Database:** PostgreSQL with currency and history tables
- **Data Source:** Web scraping from external currency exchange site

## User Preferences
- Language: Portuguese (BR)
- Non-technical user