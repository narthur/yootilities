1. Create new SortEntries component
2. Add route and navigation item for the new tab
3. Implement parsing of iou[] format
4. Add sorting functionality
5. Match existing UI style

Component structure:
```typescript
interface Entry {
  date: string;
  value: string; // Keep original calculation string
  account: string;
  comment: string;
}

function SortEntries() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState<string[]>([]);

  // Parse iou[2024.01.01, 2*35, ppd, la, "hours"] format
  // Sort by date
  // Output in same format
}
```