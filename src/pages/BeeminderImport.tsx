import React, { useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";

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
  const [goals, setGoals] = useState<BeeminderGoal[]>([]);
  const [selectedGoal, setSelectedGoal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState<string[]>([]);

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
      }
      setIsLoading(false);
    },
    [],
  );

  React.useEffect(() => {
    if (config?.apiToken) {
      fetchGoals(config.apiToken);
    }
  }, [config, fetchGoals]);

  const fetchDatapoints = async (goalSlug: string) => {
    if (!config) return;

    setIsLoading(true);
    setError("");
    try {
      const response = await fetch(
        `https://www.beeminder.com/api/v1/users/me/goals/${goalSlug}/datapoints.json?auth_token=${config.apiToken}`,
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
          return `iou[${formattedDate}, ${roundedValue}*${config.defaultRate}, ppd, ${config.defaultAccount}, "${config.defaultComment}"]`;
        });

      setOutput(outputLines);
    } catch {
      setError("Failed to load datapoints. Please try again.");
    }
    setIsLoading(false);
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

  if (!config) {
    return (
      <div className="bg-white shadow rounded-lg p-8">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Please configure your Beeminder settings first
          </p>
          <Link
            to="/settings"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-8">
        <div className="space-y-6">
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

          {error && <p className="text-sm text-red-600">{error}</p>}

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
        </div>
      </div>
    </div>
  );
}

export default BeeminderImport;
