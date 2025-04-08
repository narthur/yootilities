import React, { useState, useCallback } from 'react';

interface DataEntry {
  hours: number;
  date: string;
}

interface ProcessedEntry {
  date: string;
  totalHours: number;
}

function DataConverter() {
  const [inputData, setInputData] = useState('');
  const [rate, setRate] = useState(35);
  const [account, setAccount] = useState('la');
  const [comment, setComment] = useState('hours');
  const [output, setOutput] = useState<string[]>([]);

  const processData = useCallback(() => {
    // Parse input data
    const entries: DataEntry[] = inputData
      .trim()
      .split('\n')
      .map(line => {
        const [hours, date] = line.split('\t');
        return {
          hours: parseFloat(hours),
          date: date.trim()
        };
      })
      .filter(entry => !isNaN(entry.hours) && entry.date);

    // Group and sum by date
    const groupedData = entries.reduce((acc: { [key: string]: number }, curr) => {
      acc[curr.date] = (acc[curr.date] || 0) + curr.hours;
      return acc;
    }, {});

    // Convert to array and sort by date descending
    const processedEntries: ProcessedEntry[] = Object.entries(groupedData)
      .map(([date, totalHours]) => ({ 
        date, 
        totalHours: Number(totalHours.toFixed(2))
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Generate output lines
    const outputLines = processedEntries.map(entry => {
      const formattedDate = entry.date.replace(/-/g, '.');
      return `iou[${formattedDate}, ${entry.totalHours}*${rate}, ppd, ${account}, "${comment}"]`;
    });

    setOutput(outputLines);
  }, [inputData, rate, account, comment]);

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="input" className="block text-sm font-medium text-gray-700 mb-2">
                Input Data (Tab-separated)
              </label>
              <textarea
                id="input"
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00&#9;2025-04-08"
                value={inputData}
                onChange={(e) => setInputData(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-2">
                  Rate
                </label>
                <input
                  type="number"
                  id="rate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                />
              </div>
              <div>
                <label htmlFor="account" className="block text-sm font-medium text-gray-700 mb-2">
                  Account
                </label>
                <input
                  type="text"
                  id="account"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comment
              </label>
              <input
                type="text"
                id="comment"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <button
              onClick={processData}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Convert Data
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

export default DataConverter;