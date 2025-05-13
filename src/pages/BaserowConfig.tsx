import React, { useState, useEffect } from "react";
import { Key, CheckCircle, XCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function BaserowConfig() {
  const config = useQuery(api.baserowConfig.get);
  const saveConfig = useMutation(api.baserowConfig.save);
  const removeConfig = useMutation(api.baserowConfig.remove);

  const [token, setToken] = useState("");
  const [tableId, setTableId] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (config) {
      setToken(config.apiToken);
      setTableId(config.tableId);
      setIsConfigured(true);
    }
  }, [config]);

  const handleSaveConfig = async () => {
    if (!token.trim() || !tableId.trim()) {
      setError("Please enter both API token and table ID");
      return;
    }

    try {
      await saveConfig({
        apiToken: token.trim(),
        tableId: tableId.trim(),
      });
      setIsConfigured(true);
      setError("");
    } catch {
      setError("Failed to save configuration");
    }
  };

  const handleClearConfig = async () => {
    try {
      await removeConfig();
      setToken("");
      setTableId("");
      setIsConfigured(false);
      setError("");
    } catch {
      setError("Failed to clear configuration");
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Key className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">
            Baserow Configuration
          </h2>
        </div>

        <div className="space-y-6">
          <div>
            <label
              htmlFor="apiToken"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              API Token
            </label>
            <input
              type="password"
              id="apiToken"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? "border-red-300" : "border-gray-300"
              }`}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter your Baserow API token"
            />
          </div>

          <div>
            <label
              htmlFor="tableId"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Table ID
            </label>
            <input
              type="text"
              id="tableId"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                error ? "border-red-300" : "border-gray-300"
              }`}
              value={tableId}
              onChange={(e) => setTableId(e.target.value)}
              placeholder="Enter your Baserow table ID"
            />
          </div>

          <div className="flex justify-end gap-4">
            {isConfigured ? (
              <button
                onClick={handleClearConfig}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Clear
              </button>
            ) : (
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            )}
          </div>

          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

          <div className="flex items-center">
            <div className="mr-3">
              {isConfigured ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-sm text-gray-600">
              {isConfigured
                ? "Baserow is configured"
                : "Baserow not configured"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BaserowConfig;