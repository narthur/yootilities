1. Rename BaserowConfig component to Settings
2. Update App.tsx navigation to reflect new name and icon
3. Modify Settings component to include both Baserow and Beeminder configuration sections:
   - Move Baserow config into a collapsible section
   - Add Beeminder config section with token, rate, account, and comment fields
   - Use consistent styling across both sections
4. Update routing to use "/settings" instead of "/baserow"
5. Remove redundant Beeminder config from BeeminderImport component
6. Update BeeminderImport to use settings from Settings page

Implementation details:
- Use Disclosure component pattern for collapsible sections
- Keep existing Convex backend functionality
- Maintain current styling but adjust for multiple sections
- Add visual separation between config sections