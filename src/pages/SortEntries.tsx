import React, { useState, useCallback } from 'react';

function SortEntries() {
  const [inputData, setInputData] = useState('');
  const [output, setOutput] = useState<string[]>([]);

  const processData = useCallback(() => {
    // Parse input data and extract dates
    const entries = inputData
      .trim()
      .split('\n')
      .map(line => {
        const dateMatch = line.match(/iou\[(\d{4}\.\d{2}\.\d{2})/);
        return dateMatch ? { line, date: dateMatch[1] } : null;
      })
      .filter((entry): entry is { line: string, date: string } => entry !== null);

    // Sort by date descending
    const sortedEntries = entries.sort((a, b) => b.date.localeCompare(a.date));

    // Output original lines in sorted order
    setOutput(sortedEntries.map(entry => entry.line));
  }, [inputData]);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
                Input Data
              </label>
              <textarea
                id="input"
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder='iou[2024.01.01, 2*35, ppd, la, "hours"]'
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
              />
            </div>

            <button
              onClick={processData}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sort Entries
            </button>
          </div>

          <div>
            <label htmlFor="output" className="block text-sm font-medium text-gray-700 mb-2">
              Output
            </label>
            <textarea
              id="output"
              className="w-full h-[calc(100%-2rem)] px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
              value={output.join('\n')}
              readOnly
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SortEntries;