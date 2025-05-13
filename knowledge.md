# Yootilities

A collection of utility tools built with React, TypeScript, and Tailwind CSS.

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons
- PNPM for package management (v10.6.1)
- Node.js v23.5.0
- Convex for backend (serverless database + functions)

## Development Guidelines

- Use Tailwind CSS for styling. No additional UI libraries.
- Use Lucide React icons only. Do not install other icon packages.
- For images, use Unsplash URLs only. Do not download images.
- Keep designs beautiful and production-ready, not cookie-cutter.
- Use TypeScript's strict mode.
- Use Convex actions for API calls, not mutations. Mutations cannot use fetch().
- For long-running operations:
  1. Mutation schedules an action using ctx.scheduler.runAfter
  2. Action performs the work and saves results to database
  3. Client receives updates through Convex real-time system

## Project Structure

- `/src/pages/` - Page components
- `/src/App.tsx` - Main app component with routing
- `/src/main.tsx` - App entry point
- `/convex/` - Convex backend (schema, functions)

## Current Features

- Data Converter: Converts tab-separated time entries to a specific format
- Beeminder Integration: Import data using Beeminder API
- Sort Entries: Sort iou[] format entries by date

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
- `npx convex dev` - Start Convex development server

## Development Setup

Two servers need to be running for development:
1. Vite dev server (`pnpm dev`)
2. Convex dev server (`npx convex dev`)

## Example Ledger

```
account[b,   "Bill", "email@example.com"]
account[t,   "Ted"]
account[corp,  "Corp"]
account[shared,   "Shared"]

(******************************************************************************)
(* TRANSACTIONS, LATEST FIRST.  TEMPLATE: iou[YYYY.MM.DD, amt, from, to, why] *)
(******************************************************************************)

iou[2025.05.09, 25/60*20, b, t, "dishes, kitchen clean-up"]
iou[2025.05.08, 550, shared, corp, "cash transfer"]
iou[2025.05.05, 1.38*35, corp, b, "hours"]
iou[2025.05.05, 4.65*35, corp, t, "hours"]
iou[2025.05.05, 7, shared, t, "Food"]
iou[2025.05.04, 1.35*35, corp, b, "hours"]
iou[2025.05.03, 2.48*35, corp, b, "hours"]
iou[2025.05.02, 2.85*35, corp, b, "hours"]
iou[2025.05.01, 2.38*35, corp, b, "hours"]

(******************************************************************************)
(********************************** SETTINGS **********************************)
(******************************************************************************)

irate[1970.01.01] = .05;
irate[2005.05.31] = .06;     (* Add new lines when the interest rate changes. *)

asOf = TODAY;      (* Compute balances as of this date.  Possible values:     *)
                   (* - An actual date like 2006.07.26                        *)
                   (* - LAST to compute up thru the last logged transaction   *)
                   (*   or noon today, whichever's later.                     *)
                   (* - TODAY to compute up thru noon today.                  *)

(******************************************************************************)
(*** NOTES.  NOTHING BELOW THIS LINE WILL BE PROCESSED.  [MAGIC_LEDGER_END] ***)
(******************************************************************************)

Treat the area here like a normal etherpad document, for scratch notes, etc.
Move any IOUs here to comment them out.

2025-03-15: We've agreed that Corp will pay us $35 / hour on both billable and non-bullable work
2025-02-26: we've agreed to pay each other $20 / hour for time spent
cleaning common areas

```
