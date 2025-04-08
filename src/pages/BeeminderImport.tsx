import React, { useState, useEffect } from 'react';
import { Key, CheckCircle, XCircle } from 'lucide-react';

const BEEMINDER_CONFIG_KEY = 'beeminderConfig';

interface BeeminderConfig {
  apiToken: string;
}

function BeeminderImport() {
  const [token, setToken] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedConfig = localStorage.getItem(BEEMINDER_CONFIG_KEY);
    if (savedConfig) {
      const config: BeeminderConfig = JSON.parse(savedConfig);
      setToken(config.apiToken);
      setIsConfigured(true);
    }
  }, []);

  const handleSaveToken = () => {
    if (!token.trim()) {
      setError('Please enter an API token');
      return;
    }

    const config: BeeminderConfig = { apiToken: token.trim() };
    localStorage.setItem(BEEMINDER_CONFIG_KEY, JSON.stringify(config));
    setIsConfigured(true);
    setError('');
  };

  const handleClearToken = () => {
    localStorage.removeItem(BEEMINDER_CONFIG_KEY);
    setToken('');
    setIsConfigured(false);
    setError('');
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-8">
        <div className="flex items-center mb-6">
          <Key className="w-8 h-8 text-blue-600 mr-3" />
          <h2 className="text-2xl font-semibold text-gray-900">Beeminder API Configuration</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label htmlFor="apiToken" className="block text-sm font-medium text-gray-700 mb-2">
              API Token
            </label>
            <div className="flex gap-4">
              <input
                type="password"
                id="apiToken"
                className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  error ? 'border-red-300' : 'border-gray-300'
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
                ? 'API token is configured'
                : 'API token not configured. Get your token from Beeminder settings.'}
            </p>
          </div>

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