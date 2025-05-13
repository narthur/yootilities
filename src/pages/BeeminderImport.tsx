import React, { useState, useEffect, useCallback } from "react";
import { Key, CheckCircle, XCircle } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface BeeminderGoal {
  slug: string;
  title: string;
  goalval: number;
  rate: number;
  runits: string;
}

interface BeeminderDatapoint {
  timestamp: number;
  value: number;
  comment: string;
}

function BeeminderImport() {
  const config = useQuery(api.beeminderConfig.get);
  const saveConfig = useMutation(api.beeminderConfig.save);
  const removeConfig = useMutation(api.beeminderConfig.remove);
  const runMigrations = useMutation(api.migrations.runMigrations);
  const { isLoaded: isAuthLoaded } = useAuth();

  useEffect(() => {
    // Run migrations when component mounts and auth is loaded
    if (isAuthLoaded) {
      runMigrations();
    }
  }, [runMigrations, isAuthLoaded]);

  const [token, setToken] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState<BeeminderGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [output, setOutput] = useState<string[]>([]);
  const [rate, setRate] = useState(35);
  const [account, setAccount] = useState("na");
  const [comment, setComment] = useState("hours");

  const fetchGoals = useCallback(
    async (apiToken: string) => {
      setIsLoading(true);
      setError("");
      try {
        const response = await fetch(
          `https://www.beeminder.com/api/v1/users/me/goals.json?auth_token=${apiToken}`,
        );
        if (!response.ok) {
          throw new Error("Failed to fetch goals");
        }
        const data = await response.json();
        setGoals(
          data.sort((a: BeeminderGoal, b: BeeminderGoal) =>
            a.slug.localeCompare(b.slug),
          ),
        );
      } catch {
        setError("Failed to load goals. Please check your API token.");
        setIsConfigured(false);
        await removeConfig();
      }
      setIsLoading(false);
    },
    [removeConfig],
  );

  useEffect(() => {
    if (config) {
      setToken(config.apiToken);
      setRate(config.defaultRate);
      setAccount(config.defaultAccount);
      setComment(config.defaultComment);
      setIsConfigured(true);
      fetchGoals(config.apiToken);
    }
  }, [config, fetchGoals]);

  const fetchDatapoints = async (goalSlug: string) => {
    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `https://www.beeminder.com/api/v1/users/me/goals/${goalSlug}/datapoints.json?auth_token=${token}`,
      );
      if (!response.ok) {
        throw new Error("Failed to fetch datapoints");
      }
      const data: BeeminderDatapoint[] = await response.json();

      const groupedData = data.reduce(
        (acc: { [key: string]: number }, point) => {
          const date = new Date(point.timestamp * 1000)
            .toISOString()
            .split("T")[0];
          acc[date] = (acc[date] || 0) + point.value;
          return acc;
        },
        {},
      );

      const outputLines = Object.entries(groupedData)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, totalValue]) => {
          const formattedDate = date.replace(/-/g, ".");
          const roundedValue = Number(totalValue.toFixed(2));
          return `iou[${formattedDate}, ${roundedValue}*${rate}, ppd, ${account}, "${comment}"]`;
        });

      setOutput(outputLines);
    } catch {
      setError("Failed to load datapoints. Please try again.");
    }
    setIsLoading(false);
  };

  const handleSaveToken = async () => {
    if (!token.trim()) {
      setError("Please enter an API token");
      return;
    }

    try {
      await saveConfig({
        apiToken: token.trim(),
        defaultRate: rate,
        defaultAccount: account,
        defaultComment: comment,
      });
      setIsConfigured(true);
      setError("");
      fetchGoals(token.trim());
    } catch {
      setError("Failed to save configuration");
    }
  };

  const handleClearToken = async () => {
    try {
      await removeConfig();
      setToken("");
      setIsConfigured(false);
      setError("");
      setGoals([]);
      setSelectedGoal("");
      setOutput([]);
    } catch {
      setError("Failed to clear configuration");
    }
  };

  const handleGoalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const goalSlug = e.target.value;
    setSelectedGoal(goalSlug);
    if (goalSlug) {
      fetchDatapoints(goalSlug);
    } else {
      setOutput([]);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Key className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">
            Beeminder API Configuration
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
            <div className="flex gap-4">
              <input
                type="password"
                id="apiToken"
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  error ? "border-red-300" : "border-gray-300"
                }`}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your Beeminder API token"
              />
              {isConfigured ? (
                <button
                  onClick={handleClearToken}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                >
                  Clear
                </button>
              ) : (
                <button
                  onClick={handleSaveToken}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              )}
            </div>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          </div>

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
                ? "API token is configured"
                : "API token not configured. Get your token from Beeminder settings."}
            </p>
          </div>

          {isConfigured && (
            <>
              <div>
                <label
                  htmlFor="goal"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Select Goal
                </label>
                <select
                  id="goal"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={selectedGoal}
                  onChange={handleGoalChange}
                  disabled={isLoading}
                >
                  <option value="">Select a goal</option>
                  {goals.map((goal) => (
                    <option key={goal.slug} value={goal.slug}>
                      {goal.slug}
                    </option>
                  ))}
                </select>
                {isLoading && (
                  <p className="mt-2 text-sm text-gray-600">Loading...</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="rate"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
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
                  <label
                    htmlFor="account"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
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
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
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

              {output.length > 0 && (
                <div>
                  <label
                    htmlFor="output"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Output
                  </label>
                  <textarea
                    id="output"
                    className="w-full h-64 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                    value={output.join("\n")}
                    readOnly
                  />
                </div>
              )}
            </>
          )}

          {!isConfigured && (
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
      </div>
    </div>
  );
}

export default BeeminderImport;
