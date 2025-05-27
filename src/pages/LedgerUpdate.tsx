import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import ReactDiffViewer, { DiffMethod } from "react-diff-viewer-continued";
import { Copy, Check } from "lucide-react";

function LedgerUpdate() {
  const [ledgerContent, setLedgerContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [updatedLedger, setUpdatedLedger] = useState("");
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const baserowConfig = useQuery(api.baserowConfig.get);
  const beeminderConfig = useQuery(api.beeminderConfig.get);
  const updateLedger = useMutation(api.ledger.update);

  // Subscribe to ledger snapshots
  const latestSnapshot = useQuery(api.ledger.getLatestSnapshot);

  // Extract just the iou entries for diffing
  const extractIouEntries = (content: string) => {
    return content
      .split("\n")
      .filter((line) => line.trim().startsWith("iou["))
      .join("\n");
  };

  // Update UI when new snapshot arrives
  useEffect(() => {
    if (latestSnapshot?.afterContent) {
      setUpdatedLedger(latestSnapshot.afterContent);
      setProcessingStatus(null);
    }
  }, [latestSnapshot]);

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

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

  const handleCopy = async () => {
    const entries = extractIouEntries(updatedLedger);
    await navigator.clipboard.writeText(entries);
    setCopied(true);
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
              className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Changes</h3>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Entries
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <ReactDiffViewer
                  oldValue={extractIouEntries(ledgerContent)}
                  newValue={extractIouEntries(updatedLedger)}
                  splitView={true}
                  compareMethod={DiffMethod.WORDS_WITH_SPACE}
                  useDarkTheme={false}
                  leftTitle="Original Entries"
                  rightTitle="Updated Entries"
                  hideLineNumbers={false}
                  styles={{
                    variables: {
                      light: {
                        diffViewerBackground: "#fff",
                        gutterBackground: "#f7f7f7",
                        addedBackground: "#e6ffed",
                        addedGutterBackground: "#cdffd8",
                        removedBackground: "#ffeef0",
                        removedGutterBackground: "#ffdce0",
                        wordAddedBackground: "#acf2bd",
                        wordRemovedBackground: "#fdb8c0",
                        codeFoldBackground: "#f1f8ff",
                        emptyLineBackground: "#fafbfc",
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LedgerUpdate;
