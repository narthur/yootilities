# Clerk Integration Plan

## Setup Steps

1. Configure Environment Variables
   - Add VITE_CLERK_PUBLISHABLE_KEY to .env.local
   - Update .gitignore to exclude .env.local

2. Add ClerkProvider to main.tsx
   ```tsx
   import { ClerkProvider } from "@clerk/clerk-react";
   
   const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
   ```

3. Protect Routes with Authentication
   - Add SignIn and SignUp components
   - Create protected route wrapper
   - Update App.tsx routing

4. Add User Menu to Navigation
   - Add UserButton component to nav
   - Style to match existing design

5. Connect Clerk with Convex
   - Configure Convex auth with Clerk
   - Update schema to use Clerk user IDs
   - Add auth checks to Convex functions

## Implementation Notes

- Keep existing styling (Tailwind)
- Maintain current navigation structure
- Ensure smooth integration with Convex
- Add loading states for auth transitions