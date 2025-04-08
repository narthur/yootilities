# Yootilities

A collection of utility tools built with React, TypeScript, and Tailwind CSS.

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons
- PNPM for package management (v10.6.1)
- Node.js v23.5.0

## Development Guidelines

- Use Tailwind CSS for styling. No additional UI libraries.
- Use Lucide React icons only. Do not install other icon packages.
- For images, use Unsplash URLs only. Do not download images.
- Keep designs beautiful and production-ready, not cookie-cutter.
- Use TypeScript's strict mode.

## Project Structure

- `/src/pages/` - Page components
- `/src/App.tsx` - Main app component with routing
- `/src/main.tsx` - App entry point

## Current Features

- Data Converter: Converts tab-separated time entries to a specific format
- Beeminder Integration: Import data using Beeminder API

## External APIs

- Beeminder API: https://api.beeminder.com/#beeminder-api-reference
  - API token stored in localStorage under 'beeminderConfig'
  - Token management in BeeminderImport component
  - Goals endpoint: GET https://www.beeminder.com/api/v1/users/me/goals.json
  - Datapoints endpoint: GET https://www.beeminder.com/api/v1/users/me/goals/:slug/datapoints.json
  - Data formats:
    - Goal: { slug, title, goalval, rate, runits }
    - Datapoint: { timestamp, value, comment }

## Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm preview` - Preview production build