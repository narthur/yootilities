import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function Settings() {
  // Baserow config state
  const baserowConfig = useQuery(api.baserowConfig.get);
  const saveBaserowConfig = useMutation(api.baserowConfig.save);
  const removeBaserowConfig = useMutation(api.baserowConfig.remove);
  const [baserowToken, setBaserowToken] = useState("");
  const [tableId, setTableId] = useState("");
  const [baserowError, setBaserowError] = useState("");
  const [baserowExpanded, setBaserowExpanded] = useState(true);

  // Beeminder config state
  const beeminderConfig = useQuery(api.beeminderConfig.get);
  const saveBeeminderConfig = useMutation(api.beeminderConfig.save);
  const removeBeeminderConfig = useMutation(api.beeminderConfig.remove);
  const [beeminderToken, setBeeminderToken] = useState("");
  const [rate, setRate] = useState(35);
  const [account, setAccount] = useState("na");
  const [comment, setComment] = useState("hours");
  const [beeminderConfigured, setBeeminderConfigured] = useState(false);
  const [beeminderError, setBeeminderError] = useState("");
  const [beeminderExpanded, setBeeminderExpanded] = useState(true);

  useEffect(() => {
    if (baserowConfig) {
      setBaserowToken(baserowConfig.apiToken);
      setTableId(baserowConfig.tableId);
    }
  }, [baserowConfig]);

  useEffect(() => {
    if (beeminderConfig) {
      setBeeminderToken(beeminderConfig.apiToken);
      setRate(beeminderConfig.defaultRate);
      setAccount(beeminderConfig.defaultAccount);
      setComment(beeminderConfig.defaultComment);
      setBeeminderConfigured(true);
    }
  }, [beeminderConfig]);

  const handleSaveBaserowConfig = async () => {
    if (!baserowToken.trim() || !tableId.trim()) {
      setBaserowError("Please enter both API token and table ID");
      return;
    }

    try {
      await saveBaserowConfig({
        apiToken: baserowToken.trim(),
        tableId: tableId.trim(),
      });
      setBaserowError("");
    } catch {
      setBaserowError("Failed to save configuration");
    }
  };

  const handleClearBaserowConfig = async () => {
    try {
      await removeBaserowConfig();
      setBaserowToken("");
      setTableId("");
      setBaserowError("");
    } catch {
      setBaserowError("Failed to clear configuration");
    }
  };

  const handleSaveBeeminderConfig = async () => {
    if (!beeminderToken.trim()) {
      setBeeminderError("Please enter an API token");
      return;
    }

    try {
      await saveBeeminderConfig({
        apiToken: beeminderToken.trim(),
        defaultRate: rate,
        defaultAccount: account,
        defaultComment: comment,
      });
      setBeeminderConfigured(true);
      setBeeminderError("");
    } catch {
      setBeeminderError("Failed to save configuration");
    }
  };

  const handleClearBeeminderConfig = async () => {
    try {
      await removeBeeminderConfig();
      setBeeminderToken("");
      setBeeminderConfigured(false);
      setBeeminderError("");
    } catch {
      setBeeminderError("Failed to clear configuration");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center mb-6">
        <SettingsIcon className="w-8 h-8 text-blue-600 mr-3" />
        <h2 className="text-2xl font-semibold text-gray-900">Settings</h2>
      </div>

      {/* Baserow Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <button
          className="w-full p-4 flex justify-between items-center border-b border-gray-200"
          onClick={() => setBaserowExpanded(!baserowExpanded)}
        >
          <h3 className="text-lg font-medium text-gray-900">
            Baserow Configuration
          </h3>
          {baserowExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {baserowExpanded && (
          <div className="p-6 space-y-6">
            <div>
              <label
                htmlFor="baserowToken"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                API Token
              </label>
              <input
                type="password"
                id="baserowToken"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  baserowError ? "border-red-300" : "border-gray-300"
                }`}
                value={baserowToken}
                onChange={(e) => setBaserowToken(e.target.value)}
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
                  baserowError ? "border-red-300" : "border-gray-300"
                }`}
                value={tableId}
                onChange={(e) => setTableId(e.target.value)}
                placeholder="Enter your Baserow table ID"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={handleSaveBaserowConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleClearBaserowConfig}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Clear
              </button>
            </div>

            {baserowError && (
              <p className="mt-2 text-sm text-red-600">{baserowError}</p>
            )}
          </div>
        )}
      </div>

      {/* Beeminder Section */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <button
          className="w-full p-4 flex justify-between items-center border-b border-gray-200"
          onClick={() => setBeeminderExpanded(!beeminderExpanded)}
        >
          <h3 className="text-lg font-medium text-gray-900">
            Beeminder Configuration
          </h3>
          {beeminderExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {beeminderExpanded && (
          <div className="p-6 space-y-6">
            <div>
              <label
                htmlFor="beeminderToken"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                API Token
              </label>
              <input
                type="password"
                id="beeminderToken"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  beeminderError ? "border-red-300" : "border-gray-300"
                }`}
                value={beeminderToken}
                onChange={(e) => setBeeminderToken(e.target.value)}
                placeholder="Enter your Beeminder API token"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="rate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Default Rate
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
                <label
                  htmlFor="account"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Default Account
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
              <label
                htmlFor="comment"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Default Comment
              </label>
              <input
                type="text"
                id="comment"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                onClick={handleSaveBeeminderConfig}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleClearBeeminderConfig}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Clear
              </button>
            </div>

            {beeminderError && (
              <p className="mt-2 text-sm text-red-600">{beeminderError}</p>
            )}

            {!beeminderConfigured && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-700">
                  To get your API token:
                  <ol className="list-decimal ml-4 mt-2 space-y-1">
                    <li>Log in to your Beeminder account</li>
                    <li>Go to Account Settings</li>
                    <li>Find your API token in the Apps & API section</li>
                  </ol>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Settings;
