# Convex Integration Plan

## Schema Design

1. BeeminderConfig table:
```ts
beeminderConfig: {
  userId: string, // For future auth
  apiToken: string,
  defaultRate: number,
  defaultAccount: string,
  defaultComment: string
}
```

## Implementation Steps

1. Schema Implementation
   - Add tables to schema.ts
   - Run convex dev to generate types

2. Create Convex Functions
   - Query functions for fetching data
   - Mutation functions for saving data
   - Add proper typing

3. Component Updates
   - BeeminderImport: Switch from localStorage to Convex
   - DataConverter: Add history feature
   - SortEntries: Add history feature

4. Add Loading States
   - Show loading indicators during Convex operations
   - Handle errors appropriately

5. Testing
   - Test all Convex operations
   - Verify data persistence
   - Check error handling
