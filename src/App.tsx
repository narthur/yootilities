import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  Calculator,
  Wrench,
  ChevronRight,
  ArrowDownAZ,
  Settings as SettingsIcon,
  RefreshCw,
  FileText,
} from "lucide-react";
import { UserButton } from "@clerk/clerk-react";
import DataConverter from "./pages/DataConverter";
import BeeminderImport from "./pages/BeeminderImport";
import SortEntries from "./pages/SortEntries";
import Settings from "./pages/Settings";
import LedgerUpdate from "./pages/LedgerUpdate";
import InvoiceTab from "./pages/InvoiceTab";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import ProtectedRoute from "./components/ProtectedRoute";

console.log("App");

function App() {
  const location = useLocation();

  const navigation = [
    { name: "From Clipboard", path: "/", icon: Calculator },
    { name: "From Beeminder", path: "/tools", icon: Wrench },
    { name: "Sort Entries", path: "/sort", icon: ArrowDownAZ },
    { name: "Settings", path: "/settings", icon: SettingsIcon },
    { name: "Update Ledger", path: "/update", icon: RefreshCw },
    { name: "Invoice", path: "/invoice", icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-2xl font-bold text-blue-600">
                  Yootilities
                </h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                      location.pathname === item.path
                        ? "border-blue-500 text-gray-900"
                        : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                    }`}
                  >
                    <item.icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center">
              <UserButton afterSignOutUrl="/sign-in" />
            </div>
          </div>
        </div>
      </nav>

      <div className="py-10">
        <main>
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="px-4 py-2 sm:px-0">
              <div className="flex items-center text-sm text-gray-500 mb-4">
                <Link to="/" className="hover:text-gray-700">
                  Home
                </Link>
                <ChevronRight className="w-4 h-4 mx-2" />
                <span className="text-gray-900">
                  {navigation.find((item) => item.path === location.pathname)
                    ?.name || "Page"}
                </span>
              </div>
              <Routes>
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DataConverter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/tools"
                  element={
                    <ProtectedRoute>
                      <BeeminderImport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/sort"
                  element={
                    <ProtectedRoute>
                      <SortEntries />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/update"
                  element={
                    <ProtectedRoute>
                      <LedgerUpdate />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/invoice"
                  element={
                    <ProtectedRoute>
                      <InvoiceTab />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
