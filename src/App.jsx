import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import {
  AuthProvider,
} from "./context/AuthContext";

import ProtectedRoute from "./components/auth/ProtectedRoute";

import GetStarted from "./pages/GetStarted";
import Login from "./pages/Login";

import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Items from "./pages/Items";
import Purchase from "./pages/Purchase";
import Suppliers from "./pages/Suppliers";
import Warehouse from "./pages/Warehouse";
import Dispatch from "./pages/Dispatch";
import Returns from "./pages/Returns";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Staff from "./pages/Staff";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/"
            element={<GetStarted />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            element={
              <ProtectedRoute />
            }
          >
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/events"
              element={<Events />}
            />

            <Route
              path="/items"
              element={<Items />}
            />

            <Route
              path="/purchase"
              element={<Purchase />}
            />

            <Route
              path="/suppliers"
              element={<Suppliers />}
            />

            <Route
              path="/warehouse"
              element={<Warehouse />}
            />

            <Route
              path="/dispatch"
              element={<Dispatch />}
            />

            <Route
              path="/returns"
              element={<Returns />}
            />

            <Route
              path="/reports"
              element={<Reports />}
            />

            <Route
              path="/staff"
              element={<Staff />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />
          </Route>

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;