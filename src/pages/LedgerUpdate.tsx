import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function LedgerUpdate() {
  const [ledgerContent, setLedgerContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedLedger, setUpdatedLedger] = useState("");
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);

  const baserowConfig = useQuery(api.baserowConfig.get);
  const beeminderConfig = useQuery(api.beeminderConfig.get);
  const updateLedger = useMutation(api.ledger.update);

  // Subscribe to ledger snapshots
  const latestSnapshot = useQuery(api.ledger.getLatestSnapshot);

  // Update UI when new snapshot arrives
  useEffect(() => {
    if (latestSnapshot?.afterContent) {
      setUpdatedLedger(latestSnapshot.afterContent);
      setProcessingStatus(null);
    }
  }, [latestSnapshot]);

  const handleUpdate = async () => {
    if (!ledgerContent.trim()) {
      setError("Please enter the current ledger content");
      return;
    }

    if (!baserowConfig || !beeminderConfig) {
      setError("Please configure both Baserow and Beeminder first");
      return;
    }

    setIsLoading(true);
    setError("");
    setProcessingStatus("Starting...");

    try {
      const result = await updateLedger({
        currentContent: ledgerContent,
      });

      if (result.status === "processing") {
        setProcessingStatus("Processing... This may take a few moments.");
      }
    } catch (err) {
      setError("Failed to update ledger: " + (err as Error).message);
      setProcessingStatus(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">
          Update Ledger
        </h2>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="currentLedger"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Current Ledger Content
            </label>
            <textarea
              id="currentLedger"
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={ledgerContent}
              onChange={(e) => setLedgerContent(e.target.value)}
              placeholder="Paste your current ledger content here..."
            />
          </div>

          <button
            onClick={handleUpdate}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          >
            {isLoading ? "Updating..." : "Update Ledger"}
          </button>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {processingStatus && (
            <p className="text-sm text-blue-600">{processingStatus}</p>
          )}

          {updatedLedger && (
            <div>
              <label
                htmlFor="updatedLedger"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Updated Ledger Content
              </label>
              <textarea
                id="updatedLedger"
                className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                value={updatedLedger}
                readOnly
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LedgerUpdate;