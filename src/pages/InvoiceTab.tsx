import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Loader2 } from "lucide-react";

function InvoiceTab() {
  const [clientName, setClientName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [billableEntries, setBillableEntries] = useState<
    { hours: number }[] | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get Baserow configuration
  const baserowConfig = useQuery(api.baserowConfig.get);

  // Clients could be fetched from Baserow but for now we'll keep it simple
  // In a real implementation, you would fetch clients from Baserow
  const startFetch = useMutation(api.ledger.startInvoiceFetch);
  const [requestId, setRequestId] = useState<string | null>(null);
  const invoiceResult = useQuery(
    api.ledger.getInvoiceResult,
    requestId ? { requestId } : "skip",
  );

  // Set default date range to current month
  useEffect(() => {
    if (!startDate || !endDate) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(lastDay));
    }
  }, [startDate, endDate]);

  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  // Effect to update billable entries when the invoice result changes
  useEffect(() => {
    if (!invoiceResult) return;

    if (invoiceResult.status === "completed") {
      if (Array.isArray(invoiceResult.result.entries)) {
        setBillableEntries(invoiceResult.result.entries);
      } else {
        setBillableEntries([]);
        console.error(
          "Received invalid entries format:",
          invoiceResult.result.entries,
        );
      }
      setIsLoading(false);
    } else if (invoiceResult.status === "error") {
      setError(
        "Failed to fetch entries: " +
          (invoiceResult.result.error || "Unknown error"),
      );
      setIsLoading(false);
    } else if (invoiceResult.status === "pending") {
      // Keep loading state active while pending
      setIsLoading(true);
    } else if (invoiceResult.status === "not_found") {
      setError("Request not found. Please try again.");
      setIsLoading(false);
    }
  }, [invoiceResult]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName) {
      setError("Please enter a client name");
      return;
    }

    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    if (!baserowConfig) {
      setError(
        "Baserow configuration is missing. Please configure it in Settings.",
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setBillableEntries(null);

    try {
      const result = await startFetch({
        clientName,
        startDate,
        endDate,
      });

      setRequestId(result.requestId);

      // The actual data will be loaded by the useQuery hook when the result is ready
    } catch (err) {
      setError(
        "Failed to start invoice fetch: " +
          (err instanceof Error ? err.message : String(err)),
      );
      setIsLoading(false);
    }
  };

  const calculateTotalHours = () => {
    if (
      !billableEntries ||
      !Array.isArray(billableEntries) ||
      billableEntries.length === 0
    ) {
      return 0;
    }
    return billableEntries
      .reduce((total, entry) => {
        const hours =
          typeof entry.hours === "number"
            ? entry.hours
            : typeof entry.hours === "string"
              ? parseFloat(entry.hours)
              : 0;
        return total + (isNaN(hours) ? 0 : hours);
      }, 0)
      .toFixed(2);
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Generate Invoice
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="clientName"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Client Name
              </label>
              <input
                id="clientName"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Enter client name"
              />
            </div>

            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Generate Invoice"}
            </button>
            {invoiceResult && invoiceResult.status === "pending" && (
              <span className="ml-2 text-sm text-gray-600 flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Fetching data... This may take a few moments.
              </span>
            )}
          </div>
        </form>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {billableEntries && billableEntries.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
            No billable entries found.
          </div>
        )}

        {billableEntries && billableEntries.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                Billable Entries
              </h3>
              <span className="text-sm text-gray-600">
                Found {billableEntries.length} entries
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Start
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      End
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                {billableEntries.length === 0 && (
                  <tbody>
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No entries found for the selected date range and client.
                      </td>
                    </tr>
                  </tbody>
                )}
                <tbody className="bg-white divide-y divide-gray-200">
                  {billableEntries.length > 0 &&
                    billableEntries.map((entry, index) => (
                      <tr
                        key={index}
                        className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.date || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.start || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.end || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {typeof entry.hours === "number"
                            ? entry.hours.toFixed(2)
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.user || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {entry.client || "N/A"}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {entry.notes || "N/A"}
                        </td>
                      </tr>
                    ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50">
                    <td
                      colSpan={3}
                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right"
                    >
                      Total Hours:
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {calculateTotalHours()}
                    </td>
                    <td colSpan={3}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InvoiceTab;
